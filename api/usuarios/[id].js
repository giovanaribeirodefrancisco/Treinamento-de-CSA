// api/usuarios/[id].js
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Modelo do usuário
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

userSchema.pre('save', function(next) {
    if (!this.progresso) {
        this.progresso = {
            etapaAtual: 0,
            treinoProgresso: 0,
            dicasUsadas: {}
        };
    }

    if (this.videoIntroducaoAssistido === undefined) {
        this.videoIntroducaoAssistido = false;
    }

    next();
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Função para conectar ao MongoDB
const connectDB = async () => {
    if (mongoose.connections[0].readyState) return;

    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/treinamento-professores';

        await mongoose.connect(mongoUri);
        console.log('MongoDB conectado com sucesso!');
    } catch (error) {
        console.error('Erro ao conectar ao MongoDB:', error);
        throw error;
    }
};

// Handler da Serverless Function
export default async function handler(req, res) {
    // CORS headers - IMPORTANTE para PUT funcionar
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight por 24h

    // Responde OPTIONS imediatamente (preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        await connectDB();

        const { id } = req.query;
        const method = req.method;

        console.log(`[${method}] /api/usuarios/${id}`);

        // PUT - Atualizar perfil do usuário
        if (method === 'PUT') {
            return handlePutUsuario(req, res, id);
        }

        // GET - Buscar um usuário por ID
        if (method === 'GET') {
            return handleGetUsuario(req, res, id);
        }

        res.status(405).json({
            success: false,
            message: 'Método não permitido'
        });

    } catch (error) {
        console.error('Erro na API:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

async function handlePutUsuario(req, res, userId) {
    // Middleware de autenticação
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Acesso negado. Token não fornecido.'
        });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        req.user = { id: verified.id, username: verified.username };
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: 'Token inválido'
        });
    }

    try {
        const { username, email, fotoPerfil } = req.body;

        console.log('Atualizando usuário:', userId, { username, email });

        // Validação
        const validationErrors = [];

        if (!username || username.trim().length < 3) {
            validationErrors.push('Nome de usuário deve ter pelo menos 3 caracteres');
        }

        if (!email || !email.includes('@')) {
            validationErrors.push('Email inválido');
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: validationErrors.join(', ')
            });
        }

        // Busca o usuário atual
        const usuario = await User.findById(userId);

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Verifica se o novo username já existe
        if (username.trim() !== usuario.username) {
            const usernameExistente = await User.findOne({
                username: username.trim(),
                _id: { $ne: userId }
            });

            if (usernameExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Nome de usuário já está em uso'
                });
            }
        }

        // Verifica se o novo email já existe
        if (email.trim() !== usuario.email) {
            const emailExistente = await User.findOne({
                email: email.trim(),
                _id: { $ne: userId }
            });

            if (emailExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Email já está em uso'
                });
            }
        }

        // Atualiza os dados
        usuario.username = username.trim();
        usuario.email = email.trim();

        if (fotoPerfil !== undefined) {
            usuario.fotoPerfil = fotoPerfil;
        }

        await usuario.save();

        // Gera novo token
        const novoToken = jwt.sign(
            { id: usuario._id, username: usuario.username },
            process.env.JWT_SECRET || 'secretkey',
            { expiresIn: '1h' }
        );

        console.log('Usuário atualizado com sucesso');

        res.status(200).json({
            success: true,
            message: 'Perfil atualizado com sucesso',
            user: {
                id: usuario._id,
                username: usuario.username,
                email: usuario.email,
                fotoPerfil: usuario.fotoPerfil,
                token: novoToken
            }
        });

    } catch (err) {
        console.error('Erro ao atualizar usuário:', err);
        res.status(500).json({
            success: false,
            message: 'Erro interno no servidor'
        });
    }
}

async function handleGetUsuario(req, res, userId) {
    try {
        const usuario = await User.findById(userId);
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }
        res.status(200).json({
            success: true,
            user: usuario
        });
    } catch (err) {
        console.error('Erro ao buscar usuário:', err);
        res.status(500).json({
            success: false,
            message: 'Erro interno no servidor'
        });
    }
}
