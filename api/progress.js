// api/progress.js
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

    // Extrai token
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token não fornecido'
      });
    }

    // Valida token
    let verified;
    try {
      verified = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    } catch (err) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Token inválido'
      });
    }

    // GET - Buscar progresso
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

      if (progresso.etapaAtual === 0) {
        progresso.etapaAtual = 1;
      }

      if (progresso.dicasUsadas instanceof Map) {
        progresso.dicasUsadas = Object.fromEntries(progresso.dicasUsadas);
      }

      return res.status(200).json({
        sucesso: true,
        progresso: progresso
      });
    }

    // POST - Salvar progresso
    if (req.method === 'POST') {
      const { etapaAtual, treinoProgresso, dicasUsadas } = req.body;

      const user = await User.findById(verified.id);

      if (!user) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Usuário não encontrado'
        });
      }

      if (!user.progresso) {
        user.progresso = {
          etapaAtual: 0,
          treinoProgresso: 0,
          dicasUsadas: {}
        };
      }

      if (etapaAtual !== undefined) user.progresso.etapaAtual = etapaAtual;
      if (treinoProgresso !== undefined) user.progresso.treinoProgresso = treinoProgresso;
      if (dicasUsadas !== undefined) user.progresso.dicasUsadas = dicasUsadas;

      user.markModified('progresso');
      await user.save();

      return res.status(200).json({
        sucesso: true,
        mensagem: 'Progresso salvo com sucesso',
        progresso: user.progresso
      });
    }

    return res.status(405).json({
      sucesso: false,
      mensagem: 'Método não permitido'
    });

  } catch (error) {
    console.error('❌ Erro em /api/progress:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: error.message
    });
  }
};
