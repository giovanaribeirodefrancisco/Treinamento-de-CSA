const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!uri) {
    return res.status(500).json({
      success: false,
      error: 'MONGODB_URI não configurado'
    });
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('treinamento-professores');
    const users = database.collection('users');

    // GET - Buscar status do vídeo
    if (req.method === 'GET') {
      const userId = req.query.userId || req.headers['user-id'];

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId não fornecido'
        });
      }

      const user = await users.findOne({ _id: new ObjectId(userId) });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        });
      }

      return res.status(200).json({
        success: true,
        videoWatched: user.videoWatched || false
      });
    }

    // POST - Marcar vídeo como assistido
    if (req.method === 'POST') {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId não fornecido'
        });
      }

      const result = await users.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { videoWatched: true, videoWatchedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Status do vídeo atualizado'
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });

  } catch (error) {
    console.error('Erro:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  } finally {
    await client.close();
  }
};
