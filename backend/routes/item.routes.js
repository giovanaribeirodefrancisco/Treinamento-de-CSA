//item.routes.js

const express = require('express');
const router = express.Router();
const User = require('../models/user.js');
const auth = require('../middleware/auth.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// GET - Listar todos os usuários
router.get('/', async (req, res) => {
    try {
        const usuarios = await User.find();
        res.json(usuarios);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET - Buscar um usuário por ID
router.get('/:id', async (req, res) => {
    try {
        const usuario = await User.findById(req.params.id);
        if (!usuario) return res.status(404).json({ message: 'Usuário não encontrado' });
        res.json(usuario);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET - Buscar progresso do usuário
router.get('/:id/progresso', async (req, res) => {
    try {
        const usuario = await User.findById(req.params.id);
        if (!usuario) return res.status(404).json({ message: 'Usuário não encontrado' });

        res.json(usuario.progresso);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST - Criar um novo usuário
router.post('/', async (req, res) => {
    const { username, email, senha } = req.body;
    const novoUsuario = new User({ username, email, senha });

    try {
        const usuarioCriado = await novoUsuario.save();
        res.status(201).json(usuarioCriado);
    } catch (err) {
        if (err.code === 11000) {
            res.status(400).json({ message: 'E-mail já cadastrado' });
        } else {
            res.status(400).json({ message: err.message });
        }
    }
});

// POST - Salvar progresso do usuário
router.post('/:id/progresso', async (req, res) => {
    try {
        const { etapaAtual, dicasUsadas } = req.body;

        const usuario = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { "progresso.etapaAtual": etapaAtual, "progresso.dicasUsadas": dicasUsadas } },
            { new: true, runValidators: true }
        );

        if (!usuario) return res.status(404).json({ message: 'Usuário não encontrado' });

        res.json({ message: 'Progresso salvo com sucesso', progresso: usuario.progresso });
    } catch (err) {
        console.error("Erro ao salvar progresso:", err);
        res.status(500).json({ message: err.message });
    }
});

// PUT - Atualizar um usuário por ID
/*router.put('/:id', async (req, res) => {
    const { username, email, senha } = req.body;


    try {
        const usuarioAtualizado = await User.findByIdAndUpdate(
            req.params.id,
            { username, email, senha},
            { new: true, runValidators: true }
        );

        if (!usuarioAtualizado) return res.status(404).json({ message: 'Usuário não encontrado' });
        res.json(usuarioAtualizado);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});*/

// PUT - Atualizar um usuário por ID (COM AUTENTICAÇÃO)
router.put('/:id', auth, async (req, res) => {
    try {
        const { username, email, fotoPerfil } = req.body; // Corrigido os nomes dos campos
        const userId = req.params.id;

        console.log('Atualizando usuário via item.routes:', userId, { username, email });

        // Validação dos dados
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

        // Verifica se o novo username já existe (se for diferente do atual)
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

        // Verifica se o novo email já existe (se for diferente do atual)
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

        // Atualiza os dados do usuário
        usuario.username = username.trim();
        usuario.email = email.trim();

        // Atualiza foto de perfil se foi enviada
        if (fotoPerfil !== undefined){
          usuario.fotoPerfil = fotoPerfil;
        }

        await usuario.save();

        // Gera um novo token com os dados atualizados
        const novoToken = jwt.sign(
            { id: usuario._id, username: usuario.username },
            'secretkey',
            { expiresIn: '1h' }
        );

        console.log('Enviando resposta com foto:', usuario.fotoPerfil ? 'SIM' : 'NÃO');

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
});

// PUT - Alterar senha do usuário
router.put('/:id/alterar-senha', auth, async (req, res) => {
    try {
        const { senhaAtual, novaSenha } = req.body;
        const userId = req.params.id;

        console.log('Alterando senha do usuário:', userId);

        // Verifica se o usuário está tentando alterar sua própria senha
        if (req.user.id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Você não tem permissão para alterar esta senha'
            });
        }

        // Validação dos dados
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
        const bcrypt = require('bcrypt');
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
});

// DELETE - Deletar um usuário por ID
router.delete('/:id', async (req, res) => {
    try {
        const usuarioDeletado = await User.findByIdAndDelete(req.params.id);
        if (!usuarioDeletado) return res.status(404).json({ message: 'Usuário não encontrado' });
        res.json({ message: 'Usuário deletado com sucesso' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

