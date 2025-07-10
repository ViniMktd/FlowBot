import { Router } from 'express';
import { logger } from '@/config/simple-logger';

const router = Router();

// Mock user storage (em produção seria o banco de dados)
const users: any[] = [];

// Rota de teste para autenticação
router.post('/register', (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validação básica
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email e senha são obrigatórios'
      });
    }

    // Verificar se o usuário já existe
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email já cadastrado'
      });
    }

    // Criar usuário mock
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password, // Em produção seria hash
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    logger.info('Usuário registrado com sucesso (MOCK)', {
      userId: newUser.id,
      email: newUser.email
    });

    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          createdAt: newUser.createdAt
        }
      }
    });

  } catch (error) {
    logger.error('Erro ao registrar usuário', {
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });

    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Rota de teste para login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    // Validação básica
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    // Buscar usuário
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    logger.info('Login realizado com sucesso (MOCK)', {
      userId: user.id,
      email: user.email
    });

    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        },
        token: `mock-token-${user.id}`
      }
    });

  } catch (error) {
    logger.error('Erro ao fazer login', {
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });

    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Rota para listar usuários (apenas para teste)
router.get('/users', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Usuários listados com sucesso',
    data: {
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }))
    }
  });
});

export default router;
