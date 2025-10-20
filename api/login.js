// api/login.js
const User = require('../backend/models/user');
const connectDB = require('../backend/config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
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
    await connectDB();

    const { email, password } = req.body;

    console.log('🔐 Tentando login com email:', email);

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

    // Valida a senha
    const senhaValida = await bcrypt.compare(password, user.password);

    if (!senhaValida) {
      console.log('❌ Senha incorreta para:', email);
      return res.status(401).json({
        success: false,
        message: 'Senha incorreta'
      });
    }

    // Gera o token JWT
    const token = jwt.sign(
      { id: user._id.toString(), username: user.username },
      'secretkey',
      { expiresIn: '24h' }
    );

    console.log('✅ Login bem-sucedido para:', email);

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
