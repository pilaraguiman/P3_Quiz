
const {log,biglog, errorlog, colorize}=require("./out");
const Sequelize = require('sequelize');
const {models}=require ('./model');  //es model

/**
* Muestra la ayuda
*/
exports.helpCmd = rl => {
	log('Comandos:');
	log("  h|help - Muestra esta ayuda.");
    log("  list - Listar los quizzes existentes");
    log("  show <id> - Muestra la pregunta y la respuesta del quiz indicado");
    log("  add - Añadir nuevo Quiz interactivamente. ");
    log("  delete <id> - Borrar el quiz indicado.");
	log("  edit <id> - Editar el quiz indicado");
	log("  test <id> - Probar el quiz indicado");
	log("  p|play - Jugar a una pregunta aleatoriamente todos los quizzes");
	log("  credits - Creditos");
	log("  q|quit - Salir del programa.");
	rl.prompt();
};
/**
* Salimos del programa
*/
exports.quitCmd = rl =>{
	rl.close();

};
/**
* Añadimos un nuevo quiz
*/
exports.addCmd = rl => {
	makeQuestion(rl, 'Introduzca una pregunta: ')
    .then(q => {
        return makeQuestion(rl, 'Introduzca la respuesta: ')
        .then(a => {
            return {question: q, answer: a};
        });
    })
    .then(quiz => {
        return models.quiz.create(quiz);
    })
    .then((quiz) => {
  	    log(` ${colorize('Se ha añadido.', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog('El quiz es erróneo.');
        error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
	});		
};

/**
* Listamos todos los quizzes existentes
*/
exports.listCmd = rl =>{

	models.quiz.findAll()
	.each(quiz => {
        log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
    })
    .catch(error => {
	    errorlog(error.message);
    })
    .then(() => {
    rl.prompt();
    });
};

exports.showCmd = (rl,id)=>{
	validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
        if (!quiz) {
            throw new Error(`No existe un quiz asociado al id=${id}.`);
        }
        log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
	});
};

/**
* probamos el Quiz indicado
*/
exports.testCmd = (rl,id) =>{
	//log('Probar el quiz indicado');
	validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
        if (!quiz) {
            throw new Error(`No existe un quiz asociado al id=${id}.`);
        }
        makeQuestion(rl, quiz.question) //esto es una promesa
		.then(answer => { //respuesta 
			if(answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) { //quito blancos y no distingue mayusculas y minusculas
				log('Su respuesta es correcta');
				biglog('Correcta', 'green');
				rl.prompt();
			}else{
				log('Su respuesta es incorrecta');
				biglog('Incorrecta', 'red');
				rl.prompt();
			}
		})
    })
    .catch(error => {
        errorlog(error.message);
    })
	.then(() => {
		rl.prompt();
	})
};

/**
* Jugamos al Quiz indicado
*/
exports.playCmd = rl => {
	log('Jugar', 'red'); 
	let score = 0; //puntuacion 
	let toBePlayed = []; //meto todas las preguntas existentes

	const playOne = () => { //me creo una funcion
		
		return new Promise((resolve, reject) => {

			//longitud del array es mayor que 0?
			if(toBePlayed.length === 0) {
				log(`No hay nada mas que preguntar`);
				log(`Tu resultado ha sido:`);
				biglog(score ,'magenta');
				resolve();
				return;
			}

			let pos = Math.floor(Math.random()*toBePlayed.length) //tengo un valor que va de 0 a la longitud de este chisme; pero tiene decimales, luego hay que aproximar con el Math.floor().
			let quiz = toBePlayed[pos];
			toBePlayed.splice(pos, 1);

			makeQuestion(rl, quiz.question) //esto es una promesa
			.then(answer => { //respuesta 
				if(answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) { //quito blancos y no distingue mayusculas y minusculas
					score++;
					log(`Correcto - Llevas ${score} aciertos`);
					resolve(playOne());
				} else {
					log(`INCORRECTO`);
					log(`Fin del examen, Aciertos:`);
					biglog(score, 'magenta');
					resolve();
				}
			})
		})
	}
	models.quiz.findAll({raw: true}) //devuleve un string simplemente con la respuesta o lo que le digas que te saque
	.then(quizzes => {
		toBePlayed = quizzes;
	})
	.then(() => { //hasta que no acabe la anterior promesa no paso a esta ultima, por eso se mete ahi es playOne, si no no se rellenaria bien el array
		playOne(); 
	})
	.catch(e => {
		console.log("Error: " + e); // si esto se pega una galleta me gustaria que se quedara ahi pegado hasta que la promesa haya realmente terminado, por eso se pone el promt() al final, para que cuando haya acabado de verdad y vea que no hay errores entonces es cuando saco que esta todo bien con los resultados correctos
	})
	.then(() => {
		console.log(score);
		rl.prompt();
	})
};

exports.deleteCmd =(rl,id)=>{
	    validateId(id)
        .then(id => models.quiz.destroy({where: {id}}))
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
	});
};

exports.editCmd =(rl, id)=>{
	validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if(!quiz){
      throw new Error(`No existe un quiz asociado al id=${id}.`);
    }

    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
    return makeQuestion(rl, 'Introduzca la pregunta: ')
    .then(q => {
      process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
      return makeQuestion(rl, 'Introduzca la respuesta: ')
      .then(a => {
        quiz.question = q;
        quiz.answer = a;
        return quiz;
      });
    });
  })
  .then(quiz => {
    return quiz.save();
  })
  .then(quiz => {
    log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
  })
  .catch(Sequelize.ValidationError, error => {
    errorlog('El quiz es erroneo:');
    error.errors.forEach(({message}) => errorlog(message));
  })
  .catch(error => {
    errorlog(error.message);
  })
  .then(() =>{
     rl.prompt();
});	
	
};

exports.creditsCmd =rl=>{
	log('Autores de la practica');
	log('Maria del Pilar Aguilera Manzanera', 'green');
	log('Miguel Lahera Hervilla', 'green');
	rl.prompt();
};

//Codigo de las promesas

const validateId = id => {
    return new Promise((resolve, reject) => {
        if (typeof id === "undefined") {
            reject(new Error(`Falta el parámetro <id>.`));
        } else {
            id = parseInt(id);
            if (Number.isNaN(id)) { //coger la parte entera y descartar lo demas
                reject(new Error(`El valor del parámetro <id> no es un número`));
            } else {
                resolve(id);
            }
        }
    });
};

const makeQuestion = (rl, text) => {
    return new Sequelize.Promise((resolve, reject) => {
        rl.question(colorize(text, 'red'), answer => {
            resolve(answer.toLowerCase().trim());
        });
    });
};