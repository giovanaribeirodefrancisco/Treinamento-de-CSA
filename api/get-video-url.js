// api/get-video-url.js

const { list } = require('@vercel/blob');
const jwt = require('jsonwebtoken');
const User = require('../backend/models/user');
const connectDB = require('../backend/config/database');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  try {
    await connectDB();

    // Verificar token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token não fornecido'
      });
    }

    let verified;
    try {
      verified = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    } catch (err) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token inválido'
      });
    }

    // Verificar se usuário existe
    const user = await User.findById(verified.id);
    if (!user) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }

    // Listar vídeos no Blob (você pode especificar um prefixo como 'videos/')
    const { blobs } = await list({
      //prefix: 'videos/' // Todos os vídeos serão guardados em uma pasta 'videos/'
    });

    // Retornar os vídeos disponíveis
    return res.status(200).json({
      sucesso: true,
      videos: blobs.map(blob => ({
        nome: blob.pathname,
        url: blob.url,
        tamanho: blob.size,
        dataCriacao: blob.uploadedAt
      }))
    });

  } catch (error) {
    console.error('❌ Erro ao listar vídeos:', error);
    return res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
};
