// server.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const bcrypt = require('bcrypt');
const User = require('./models/user');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');

const app = express();
const usuariosRoutes = require('./routes/item.routes'); // ajuste o caminho se necessário


// Middleware
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));

app.use('/api/usuarios', usuariosRoutes);

// Conecta ao MongoDB
connectDB();

const mongoose = require('mongoose');
mongoose.set('debug', true); // -> vai logar as queries no console


// Função de validação
const validateUserData = (userData) => {
  const errors = [];

  if (!userData.username || userData.username.trim().length < 3) {
      errors.push('Nome de usuário deve ter pelo menos 3 caracteres');
  }

  if (!userData.email || !userData.email.includes('@')) {
      errors.push('Email inválido');
  }

  if (!userData.password || userData.password.length < 6) {
      errors.push('Senha deve ter pelo menos 6 caracteres');
  }

  return errors;
};

// Rota para criar usuário
app.post('/api/users', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validação dos dados
        const validationErrors = validateUserData({ username, email, password });
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: validationErrors.join(', ')
            });
        }

        // Verifica se o usuário já existe
        const existingUser = await User.findOne({
          $or: [{ email }, { username }]
        });

        if (existingUser) {
          return res.status(400).json({
              success: false,
              message: 'Email ou nome de usuário já cadastrado'
          });
        }

        // Hash da senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();

        // Gerando um token JWT
        const token = jwt.sign(
          { id: user._id, username: user.username },
          'secretkey', // Use uma chave secreta mais segura em produção
          { expiresIn: '1h' }
        );

        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            user: {
                username: user.username,
                email: user.email,
                id: user._id,
                token: token
            }
        });
    } catch (error) {
        console.error('Erro no servidor:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Rota de login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verifica se o usuário existe
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Compara a senha
    const senhaValida = await bcrypt.compare(password, user.password);

    if (!senhaValida) {
      return res.status(400).json({
        success: false,
        message: 'Senha incorreta'
      });
    }

    // Gera o token JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      'secretkey', // mesma chave usada na criação da conta
      { expiresIn: '1h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fotoPerfil: user.fotoPerfil,
        token: token
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno no servidor'
    });
  }
});

// ########################### NOVAS ROTAS PARA CONTROLE DO VIDEO INTRODUTÓRIO ###########################

// Verificar se o usuário já assistiu ao vídeo introdutório
app.get('/api/user/video-status', auth, async (req, res) => {
    try {
        console.log('Verificando status do vídeo para usuário', req.user.id);

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Usuário não encontrado'
            });
        }

        // Verifica se o campo videoIntroducaoAssistido existe
        // Se não existir, considera como false (não assistiu)
        const videoAssistido = user.videoIntroducaoAssistido || false;

        console.log('Status do vídeo para usuário:', {
            userId: req.user.id,
            videoAssistido: videoAssistido,
            dataAssistiu: user.dataVideoAssistido || 'Nunca assistiu'
        });

        return res.json({
            sucesso: true,
            videoAssistido: videoAssistido,
            dataAssistiu: user.dataVideoAssistido || null
        });

    } catch (error) {
        console.error('Erro ao verificar status do vídeo:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: error.message
        });
    }
});

// Marcar vídeo como assistido
app.post('/api/user/marcar-video-assistido', auth, async (req, res) => {
    try {
        console.log('Marcando vídeo como assistido para usuário', req.user.id);

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Usuário não encontrado'
            });
        }

        // Marca o vídeo como assistido e salva a data
        user.videoIntroducaoAssistido = true;
        user.dataVideoAssistido = new Date();

        // Marca o campo como modificado para garantir que seja salvo
        user.markModified('videoIntroducaoAssistido');
        user.markModified('dataVideoAssistido');

        await user.save();

        console.log('Vídeo marcado como assistido:', {
            userId: req.user.id,
            dataAssistiu: user.dataVideoAssistido
        });

        return res.json({
            sucesso: true,
            mensagem: 'Vídeo marcado como assistido',
            dataAssistiu: user.dataVideoAssistido
        });

    } catch (error) {
        console.error('Erro ao marcar vídeo como assistido:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});


// Recuperar progresso
/*app.get('/api/user/progresso', auth, async (req, res) => {
    try {
        console.log('Buscando progresso do usuário', req.user.id);
        const user = await User.findById(req.user.id);
        if(!user){
          return res.status(404).json({ sucesso: false, mensagem: 'Usuário não encontrado' });
        }

        const progresso = user.progresso || {};
        if (progresso.etapaAtual === undefined && user.etapaAtual !== undefined) progresso.etapaAtual = user.etapaAtual;
        if (progresso.treinoProgresso === undefined && user.treinoProgresso !== undefined) progresso.treinoProgresso = user.treinoProgresso;
        if ((!progresso.dicasUsadas || Object.keys(progresso.dicasUsadas).length === 0) && user.dicasUsadas) progresso.dicasUsadas = user.dicasUsadas;

        /*let update = false;
        if (user.dicasUsadas === undefined) {
          user.dicasUsadas = 0;
          update = true;
        }
        if (user.etapaAtual === undefined) {
          user.etapaAtual = 1;
          update = true;
        }
        if (update) {
          await user.save();
        }*/

        /*return res.json({
          sucesso: true,
          progresso: user.progresso /*{treinoProgresso: user.treinoProgresso, dicasUsadas: user.dicasUsadas, etapaAtual: user.etapaAtual} */
        /*});
    } catch (error) {
        console.error('Erro ao buscar progresso:', error);
        return res.status(500).json({ sucesso: false, mensagem: error.message });
    }
});

// Salvar progresso
app.post('/api/user/progresso', auth, async (req, res) => {
    try {
        console.log('Salvando progresso para o usuário', req.user.id, req.body);
        const { etapaAtual, treinoProgresso, dicasUsadas } = req.body;
        //const user = await User.findById(req.user.id);

        const update = {};
        // Atualiza progresso
        if (etapaAtual !== undefined) update['user.etapaAtual'] = etapaAtual;
        if (treinoProgresso !== undefined) update['user.treinoProgresso'] = treinoProgresso;
        if (dicasUsadas != undefined) update['user.dicasUsadas'] = dicasUsadas;


        console.log('--------------------------------------------------------------------');
        await user.save();
        console.log('*********************************************************************');

        if (Object.keys(update).length === 0) {
          return res.status(400).json({ sucesso: false, mensagem: 'Nenhum campo para atualizar' });
        }

        const user = await User.findByIdAndUpdate(
          req.user.id,
          { $set: update },
          { new: true, runValidators: true, context: 'query' }
        ).lean();

        console.log('Resultado do update (user.progresso):', user ? user.progresso : null);

        if (!user) return res.status(404).json({ sucesso: false, mensagem: 'Usuário não encontrado' });


        return res.json({
          sucesso: true,
          progresso: user.progresso /*{treinoProgresso: user.treinoProgresso, dicasUsadas: user.dicasUsadas, etapaAtual: user.etapaAtual}*/
        /*});
    } catch (error) {
        res.status(500).json({ sucesso: false, mensagem: error.message });
    }
});*/

/*app.post('/api/user/progresso', auth, async (req, res) => {
  try {
    console.log('Salvando progresso para usuário', req.user.id, req.body);
    const { progresso } = req.body;
    await ProgressoModel.updateOne(
      { userId: req.user.id },
      { $set: progresso },
      { upsert: true }
    );
    res.json({ sucesso: true });
  } catch (err) {
    console.error('Erro ao salvar progresso:', err);
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});
*/

// Salvar progresso - VERSÃO CORRIGIDA
app.post('/api/user/progresso', auth, async (req, res) => {
    try {
        console.log('Salvando progresso para o usuário', req.user.id, req.body);
        const { etapaAtual, treinoProgresso, dicasUsadas } = req.body;

        // Busca o usuário atual
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Usuário não encontrado'
            });
        }

        // Inicializa o progresso se não existir
        if (!user.progresso) {
            user.progresso = {
                etapaAtual: 0,
                treinoProgresso: 0,
                dicasUsadas: new Map()
            };
        }

        // Atualiza os campos que foram enviados
        if (etapaAtual !== undefined) {
            user.progresso.etapaAtual = etapaAtual;
            console.log('Atualizando etapaAtual para:', etapaAtual);
        }

        if (treinoProgresso !== undefined) {
            user.progresso.treinoProgresso = treinoProgresso;
            console.log('Atualizando treinoProgresso para:', treinoProgresso);
        }

        if (dicasUsadas !== undefined) {
            // Se dicasUsadas for um objeto, converte para Map
            if (typeof dicasUsadas === 'object' && !Array.isArray(dicasUsadas)) {
                user.progresso.dicasUsadas = new Map(Object.entries(dicasUsadas));
            } else {
                user.progresso.dicasUsadas = dicasUsadas;
            }
            console.log('Atualizando dicasUsadas para:', dicasUsadas);
        }

        // Marca o campo progresso como modificado (importante para nested objects)
        user.markModified('progresso');

        // Salva o usuário
        await user.save();

        console.log('Progresso salvo com sucesso:', user.progresso);

        return res.json({
            sucesso: true,
            progresso: user.progresso
        });

    } catch (error) {
        console.error('Erro ao salvar progresso:', error);
        res.status(500).json({
            sucesso: false,
            mensagem: error.message
        });
    }
});

// Recuperar progresso - VERSÃO CORRIGIDA
app.get('/api/user/progresso', auth, async (req, res) => {
    try {
        console.log('Buscando progresso do usuário', req.user.id);

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Usuário não encontrado'
            });
        }

        // Inicializa progresso com valores padrão se não existir
        let progresso = user.progresso || {
            etapaAtual: 1, // Começa da primeira questão
            treinoProgresso: 0,
            dicasUsadas: {}
        };

        // Se etapaAtual for 0, ajusta para 1 (primeira questão)
        if (progresso.etapaAtual === 0) {
            progresso.etapaAtual = 1;
        }

        // Converte Map para Object se necessário (para facilitar o uso no frontend)
        if (progresso.dicasUsadas instanceof Map) {
            progresso.dicasUsadas = Object.fromEntries(progresso.dicasUsadas);
        }

        console.log('Progresso encontrado:', progresso);

        return res.json({
            sucesso: true,
            progresso: progresso
        });

    } catch (error) {
        console.error('Erro ao buscar progresso:', error);
        return res.status(500).json({
            sucesso: false,
            mensagem: error.message
        });
    }
});


// Rota para atualizar perfil do usuário
/*app.put('/api/user/perfil', auth, async (req, res) => {
    try {
        const { username, email } = req.body;
        const userId = req.user.id;

        console.log('Atualizando perfil do usuário:', userId, { username, email });

        // Validação dos dados
        const validationErrors = [];

        if (!username || username.trim().length < 3) {
            validationErrors.push('Nome de usuário deve ter pelo menos 3 caracteres');
        }

        if (!email || !email.includes('@')) {
            validationErrors.push('Email inválido');
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: validationErrors.join(', ')
            });
        }

        // Busca o usuário atual
        const usuario = await User.findById(userId);

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Verifica se o novo username já existe (se for diferente do atual)
        if (username.trim() !== usuario.username) {
            const usernameExistente = await User.findOne({
                username: username.trim(),
                _id: { $ne: userId } // Exclui o próprio usuário da busca
            });

            if (usernameExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Nome de usuário já está em uso'
                });
            }
        }

        // Verifica se o novo email já existe (se for diferente do atual)
        if (email.trim() !== usuario.email) {
            const emailExistente = await User.findOne({
                email: email.trim(),
                _id: { $ne: userId } // Exclui o próprio usuário da busca
            });

            if (emailExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Email já está em uso'
                });
            }
        }

        // Atualiza os dados do usuário
        usuario.username = username.trim();
        usuario.email = email.trim();

        await usuario.save();

        // Gera um novo token com os dados atualizados
        const novoToken = jwt.sign(
            { id: usuario._id, username: usuario.username },
            'secretkey', // Use a mesma chave secreta
            { expiresIn: '1h' }
        );

        res.status(200).json({
            success: true,
            message: 'Perfil atualizado com sucesso',
            user: {
                id: usuario._id,
                username: usuario.username,
                email: usuario.email,
                token: novoToken
            }
        });

    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno no servidor'
        });
    }
});
*/
