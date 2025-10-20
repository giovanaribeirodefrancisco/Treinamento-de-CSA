// api/login.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Importa o modelo User
const User = require('../backend/models/user');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });
  }

  try {
    // Conecta ao MongoDB
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      console.error('❌ MONGODB_URI não está configurado');
      return res.status(500).json({
        success: false,
        message: 'MONGODB_URI não configurado'
      });
    }

    // Verifica se já está conectado
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('✅ Conectado ao MongoDB');
    }

    const { email, password } = req.body;

    console.log('🔐 Login attempt:', email);

    // Validação
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    // Busca o usuário
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ Usuário não encontrado:', email);
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Valida senha
    const senhaValida = await bcrypt.compare(password, user.password);

    if (!senhaValida) {
      console.log('❌ Senha incorreta');
      return res.status(401).json({
        success: false,
        message: 'Senha incorreta'
      });
    }

    // Gera token
    const token = jwt.sign(
      {
        id: user._id.toString(),
        username: user.username
      },
      'secretkey',
      { expiresIn: '24h' }
    );

    console.log('✅ Login bem-sucedido:', email);

    return res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: user._id.toString(),
        name: user.username,
        username: user.username,
        email: user.email,
        fotoPerfil: user.fotoPerfil || null,
        token: token
      }
    });

  } catch (error) {
    console.error('❌ Erro no login:', error.message);
    console.error('Stack:', error.stack);

    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor',
      error: error.message
    });
  }
};
