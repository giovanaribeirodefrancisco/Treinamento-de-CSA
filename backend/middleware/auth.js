//auth.js
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // Pega o token do cabeçalho Authorization
    const token = req.header('Authorization')?.split(' ')[1]; // formato: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
    }

    try {
        // Verifica se o token é válido
        const verified = jwt.verify(token, 'secretkey'); // mesma chave usada no login
        req.user = { id: verified.id, username: verified.username };
        //req.userId = verified.id; salva o id do usuário no request
        next(); // continua para a próxima função da rota
    } catch (err) {
        res.status(400).json({ message: 'Token inválido' });
    }
};
