import { logger } from '@/config/logger';
import { AuthService } from '@/services/auth.service';
import { AppError } from '@/utils/errors';
import { Request, Response } from 'express';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Registrar novo usuário
   */
  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password } = req.body;

      const result = await this.authService.register({
        name,
        email,
        password
      });

      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso',
        data: {
          user: result.user,
          tokens: result.tokens
        }
      });
    } catch (error) {
      logger.error('Erro no registro de usuário', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        body: req.body
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Login de usuário
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      const result = await this.authService.login({
        email,
        password
      });

      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: result.user,
          tokens: result.tokens
        }
      });
    } catch (error) {
      logger.error('Erro no login', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        email: req.body.email
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Renovar token de acesso
   */
  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token é obrigatório'
        });
        return;
      }

      const tokens = await this.authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token renovado com sucesso',
        data: { tokens }
      });
    } catch (error) {
      logger.error('Erro ao renovar token', {
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Logout do usuário
   */
  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
        return;
      }

      await this.authService.logout(userId);

      res.status(200).json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error) {
      logger.error('Erro no logout', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Solicitar redefinição de senha
   */
  public forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      await this.authService.forgotPassword(email);

      res.status(200).json({
        success: true,
        message: 'Se o email existir, você receberá instruções para redefinir sua senha'
      });
    } catch (error) {
      logger.error('Erro ao solicitar redefinição de senha', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        email: req.body.email
      });

      // Sempre retornar sucesso por segurança
      res.status(200).json({
        success: true,
        message: 'Se o email existir, você receberá instruções para redefinir sua senha'
      });
    }
  };

  /**
   * Redefinir senha
   */
  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, password } = req.body;

      await this.authService.resetPassword(token, password);

      res.status(200).json({
        success: true,
        message: 'Senha redefinida com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao redefinir senha', {
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Obter perfil do usuário logado
   */
  public getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
        return;
      }

      const user = await this.authService.getUserById(userId);

      res.status(200).json({
        success: true,
        message: 'Perfil obtido com sucesso',
        data: { user }
      });
    } catch (error) {
      logger.error('Erro ao obter perfil', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        userId: req.user?.id
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Atualizar perfil do usuário
   */
  public updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { name, email } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
        return;
      }

      const user = await this.authService.updateProfile(userId, {
        name,
        email
      });

      res.status(200).json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: { user }
      });
    } catch (error) {
      logger.error('Erro ao atualizar perfil', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        userId: req.user?.id
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Alterar senha do usuário
   */
  public changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
        return;
      }

      await this.authService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao alterar senha', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        userId: req.user?.id
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };
}
