const { MongoClient } = require('mongodb');

module.exports = async (req, res) => {
  const uri = process.env.MONGODB_URI;
  
  // Verificar se a variável existe
  if (!uri) {
    return res.status(500).json({
      error: 'MONGODB_URI não está configurada',
      env: process.env
    });
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('treinamento-professores');
    const collections = await database.listCollections().toArray();
    
    return res.status(200).json({
      success: true,
      message: 'Conexão com MongoDB bem-sucedida!',
      database: 'treinamento-professores',
      collections: collections.map(c => c.name)
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Erro ao conectar ao MongoDB',
      message: error.message,
      stack: error.stack
    });
  } finally {
    await client.close();
  }
};