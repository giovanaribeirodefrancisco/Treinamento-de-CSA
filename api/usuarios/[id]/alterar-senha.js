// api/usuarios/[id]/alterar-senha.js
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

        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB conectado com sucesso!');
    } catch (error) {
        console.error('Erro ao conectar ao MongoDB:', error);
        throw error;
    }
};

// Handler da Serverless Function
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        await connectDB();

        const { id } = req.query;
        const method = req.method;

        console.log(`[${method}] /api/usuarios/${id}/alterar-senha`);

        // PUT - Alterar senha do usuário
        if (method === 'PUT') {
            return handleAlterarSenha(req, res, id);
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

async function handleAlterarSenha(req, res, userId) {
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
        const { senhaAtual, novaSenha } = req.body;

        console.log('Alterando senha do usuário:', userId);

        // Verifica permissão
        if (req.user.id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Você não tem permissão para alterar esta senha'
            });
        }

        // Validação
        if (!senhaAtual || !novaSenha) {
            return res.status(400).json({
                success: false,
                message: 'Senha atual e nova senha são obrigatórias'
            });
        }

        if (novaSenha.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Nova senha deve ter pelo menos 6 caracteres'
            });
        }

        // Busca o usuário
        const usuario = await User.findById(userId);

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Verifica se a senha atual está correta
        const senhaValida = await bcrypt.compare(senhaAtual, usuario.password);

        if (!senhaValida) {
            return res.status(400).json({
                success: false,
                message: 'Senha atual incorreta'
            });
        }

        // Gera hash da nova senha
        const salt = await bcrypt.genSalt(10);
        const novaSenhaHash = await bcrypt.hash(novaSenha, salt);

        // Atualiza a senha
        usuario.password = novaSenhaHash;
        await usuario.save();

        console.log('Senha alterada com sucesso para o usuário:', userId);

        res.status(200).json({
            success: true,
            message: 'Senha alterada com sucesso'
        });

    } catch (err) {
        console.error('Erro ao alterar senha:', err);
        res.status(500).json({
            success: false,
            message: 'Erro interno no servidor'
        });
    }
}
