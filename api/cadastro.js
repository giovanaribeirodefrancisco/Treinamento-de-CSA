// api/cadastro.js
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
    await connectDB();

    const { username, email, password, confirmPassword } = req.body;

    console.log('📝 Tentando cadastro com:', username, email);

    // Validações
    if (!username || username.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Nome de usuário deve ter pelo menos 3 caracteres'
      });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Senha deve ter pelo menos 6 caracteres'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'As senhas não conferem'
      });
    }

    // Verifica se já existe
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email ou nome de usuário já cadastrado'
      });
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Cria usuário
    const user = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword
    });

    await user.save();

    // Gera token
    const token = jwt.sign(
      { id: user._id.toString(), username: user.username },
      'secretkey',
      { expiresIn: '24h' }
    );

    console.log('✅ Cadastro bem-sucedido:', username);

    return res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        id: user._id.toString(),
        name: user.username,
        username: user.username,
        email: user.email,
        token: token
      }
    });

  } catch (error) {
    console.error('❌ Erro no cadastro:', error.message);
    console.error('Stack:', error.stack);

    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor',
      error: error.message
    });
  }
};
