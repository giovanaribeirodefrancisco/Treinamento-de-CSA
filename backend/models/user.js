// backend/models/user.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username é obrigatório'],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email é obrigatório'],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Senha é obrigatória'],
        minlength: 6
    },
    fotoPerfil: {
        type: String,
        required: false,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    videoIntroducaoAssistido: {
        type: Boolean,
        default: false,
        required: false
    },
    dataVideoAssistido: {
        type: Date,
        required: false
    },
    progresso: {
        etapaAtual: {
            type: Number,
            default: 0
        },
        treinoProgresso: {
            type: Number,
            default: 0
        },
        dicasUsadas: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    }
});

// Middleware para garantir que progresso sempre exista
userSchema.pre('save', function(next) {
    if (!this.progresso) {
        this.progresso = {
            etapaAtual: 0,
            treinoProgresso: 0,
            dicasUsadas: {}
        };
    }

    // Inicializa campos do vídeo se não existirem
    if (this.videoIntroducaoAssistido === undefined) {
        this.videoIntroducaoAssistido = false;
    }

    next();
});

module.exports = mongoose.model('User', userSchema);
