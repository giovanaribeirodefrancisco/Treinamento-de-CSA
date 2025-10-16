import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const client = new MongoClient(uri);

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email e senha são obrigatórios' 
      });
    }

    await client.connect();
    const database = client.db('treinamento-professores');
    const users = database.collection('users');

    const user = await users.findOne({ email });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Email não encontrado' 
      });
    }

    if (user.password !== password) {
      return res.status(401).json({ 
        success: false,
        error: 'Senha incorreta' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor' 
    });
  } finally {
    await client.close();
  }
}