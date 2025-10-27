const { put } = require('@vercel/blob');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  try {
    const { buffer, filename } = req.body;

    if (!buffer || !filename) {
      return res.status(400).json({
        erro: 'Buffer e filename são obrigatórios'
      });
    }

    // Converter buffer base64 para Buffer
    const fileBuffer = Buffer.from(buffer, 'base64');

    // Fazer upload para Vercel Blob
    const blob = await put(filename, fileBuffer, {
      access: 'public', // Público para que o vídeo possa ser acessado
    });

    return res.status(200).json({
      sucesso: true,
      url: blob.url,
      mensagem: 'Vídeo enviado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao fazer upload:', error);
    return res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
};
