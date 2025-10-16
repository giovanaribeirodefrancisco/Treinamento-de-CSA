// config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/treinamento-professores', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB conectado com sucesso!');
    } catch (error) {
        console.error('Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
