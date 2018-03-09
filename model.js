

const Sequelize = require('sequelize');
const sequelize= new Sequelize("sqlite:quizzes.sqlite",{logging:false});

sequelize.define('quiz', {
    question: {
        type: Sequelize.STRING,
        unique: {msg: "Ya existe esta pregunta."},
        validate: {notEmpty: {msg: "La pregunta no puede estar vacía."}}
    },
    answer: {
        type: Sequelize.STRING,
        validate: {notEmpty: {msg: "La respuesta no puede estar vacía."}}
    }
});

sequelize.sync()
.then(() => sequelize.models.quiz.count()) //creo que es model 
.then(count => {
    if (!count) {

        return sequelize.models.quiz.bulkCreate([
            { question: "Apellido del primo de Harry Potter", answer: "Dursley"},
            { question: "Forma de la cicatriz de Harry Potter", answer: "Rayo"},
            { question: "Nombre en clave que le dan los protagonistas a Sirius", answer: "Hocicos"},
            { question: "Cerveza de....", answer: "mantequilla"}
        ]);
    }
})
.catch(error => {
    console.log(error);
});

module.exports = sequelize;