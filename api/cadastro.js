const { MongoClient } = require('mongodb');

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
      error: `Método ${req.method} não permitido` 
    });
  }

  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    return res.status(500).json({
      success: false,
      error: 'MONGODB_URI não configurado'
    });
  }

  const client = new MongoClient(uri);

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Todos os campos são obrigatórios' 
      });
    }

    await client.connect();
    const database = client.db('treinamento-professores');
    const users = database.collection('users');

    const existingUser = await users.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'Email já cadastrado' 
      });
    }

    const result = await users.insertOne({
      name,
      email,
      password,
      createdAt: new Date()
    });

    return res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso',
      userId: result.insertedId.toString(),
      user: {
        id: result.insertedId.toString(),
        name,
        email
      }
    });

  } catch (error) {
    console.error('Erro no cadastro:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  } finally {
    await client.close();
  }
};