// api/progress.js
const mongoose = require('mongoose');
const User = require('../backend/models/user');
const connectDB = require('../backend/config/database');
const jwt = require('jsonwebtoken');

// Função para validar token (igual ao auth.js)
function verificarToken(token) {
  try {
    const verified = jwt.verify(token, 'secretkey');
    return verified;
  } catch (err) {
    return null;
  }
}

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Conectar ao banco de dados
    await connectDB();

    // Pegar o token do header
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // Remove "Bearer "

    if (!token) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token não fornecido'
      });
    }

    // Verificar se o token é válido
    const verified = verificarToken(token);
    if (!verified) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token inválido'
      });
    }

    // GET /api/progress - Recuperar progresso
    if (req.method === 'GET') {
      const user = await User.findById(verified.id);
      if (!user) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Usuário não encontrado'
        });
      }

      const progresso = user.progresso || {
        etapaAtual: 1,
        treinoProgresso: 0,
        dicasUsadas: {}
      };

      return res.status(200).json({
        sucesso: true,
        progresso: progresso
      });
    }

    // POST /api/progress - Salvar progresso
    if (req.method === 'POST') {
      const { etapaAtual, treinoProgresso, dicasUsadas } = req.body;

      const user = await User.findById(verified.id);
      if (!user) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Usuário não encontrado'
        });
      }

      // Se não tem progresso, cria um
      if (!user.progresso) {
        user.progresso = {
          etapaAtual: 0,
          treinoProgresso: 0,
          dicasUsadas: {}
        };
      }

      // Atualiza os campos que foram enviados
      if (etapaAtual !== undefined) {
        user.progresso.etapaAtual = etapaAtual;
      }
      if (treinoProgresso !== undefined) {
        user.progresso.treinoProgresso = treinoProgresso;
      }
      if (dicasUsadas !== undefined) {
        user.progresso.dicasUsadas = dicasUsadas;
      }

      // Marca como modificado e salva
      user.markModified('progresso');
      await user.save();

      return res.status(200).json({
        sucesso: true,
        mensagem: 'Progresso salvo com sucesso',
        progresso: user.progresso
      });
    }

  } catch (error) {
    console.error('Erro em /api/progress:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: error.message
    });
  }
};
