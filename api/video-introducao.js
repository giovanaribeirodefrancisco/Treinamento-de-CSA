// api/video-introducao.js
const User = require('../backend/models/user');
const connectDB = require('../backend/config/database');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token não fornecido'
      });
    }

    let verified;
    try {
      verified = jwt.verify(token, 'secretkey');
    } catch (err) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token inválido'
      });
    }

    // GET - Verificar status
    if (req.method === 'GET') {
      const user = await User.findById(verified.id);

      if (!user) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Usuário não encontrado'
        });
      }

      return res.status(200).json({
        sucesso: true,
        videoIntroducaoAssistido: user.videoIntroducaoAssistido || false,
        dataAssistido: user.dataVideoAssistido || null
      });
    }

    // POST - Marcar como assistido
    if (req.method === 'POST') {
      const user = await User.findById(verified.id);

      if (!user) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Usuário não encontrado'
        });
      }

      user.videoIntroducaoAssistido = true;
      user.dataVideoAssistido = new Date();

      await user.save();

      return res.status(200).json({
        sucesso: true,
        mensagem: 'Vídeo marcado como assistido',
        dataAssistido: user.dataVideoAssistido
      });
    }

    return res.status(405).json({
      sucesso: false,
      mensagem: 'Método não permitido'
    });

  } catch (error) {
    console.error('❌ Erro em /api/video-introducao:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: error.message
    });
  }
};
