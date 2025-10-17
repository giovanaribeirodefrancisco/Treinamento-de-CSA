const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

module.exports = async (req, res) => {
  // Configurar CORS
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

    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso',
      userId: result.insertedId,
      user: {
        id: result.insertedId,
        name,
        email
      }
    });

  } catch (error) {
    console.error('Erro no cadastro:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  } finally {
    await client.close();
  }
};