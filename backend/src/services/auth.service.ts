import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { cache } from '@/config/redis';
import { AppError } from '@/utils/errors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

interface ILoginData {
  email: string;
  password: string;
}

interface IRegisterData {
  name: string;
  email: string;
  password: string;
}

interface ITokens {
  accessToken: string;
  refreshToken: string;
}

interface IUserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthService {
  private generateTokens(userId: string): ITokens {
    const accessToken = jwt.sign(
      { userId, type: 'access' },
      process.env['JWT_SECRET']!,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      process.env['JWT_SECRET']!,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  private formatUser(user: any): IUserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  async register(userData: IRegisterData): Promise<{ user: IUserResponse; tokens: ITokens }> {
    try {
      // Verificar se o usuário já existe
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new AppError('Email já está em uso', 400);
      }

      // Hash da senha
      const hashedPassword = await this.hashPassword(userData.password);

      // Criar usuário
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: 'USER',
          active: true
        }
      });

      // Gerar tokens
      const tokens = this.generateTokens(user.id);

      // Armazenar refresh token no Redis
      await cache.set(`refresh_token:${user.id}`, tokens.refreshToken, 60 * 60 * 24 * 7); // 7 dias

      logger.info(`Usuário registrado com sucesso: ${user.email}`, {
        userId: user.id,
        email: user.email,
        action: 'register'
      });

      return {
        user: this.formatUser(user),
        tokens
      };
    } catch (error) {
      logger.error('Erro ao registrar usuário', {
        email: userData.email,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  async login(loginData: ILoginData): Promise<{ user: IUserResponse; tokens: ITokens }> {
    try {
      // Buscar usuário por email
      const user = await prisma.user.findUnique({
        where: { email: loginData.email }
      });

      if (!user) {
        throw new AppError('Credenciais inválidas', 401);
      }

      if (!user.active) {
        throw new AppError('Conta desativada. Entre em contato com o suporte', 401);
      }

      // Verificar senha
      const isPasswordValid = await this.verifyPassword(loginData.password, user.password);

      if (!isPasswordValid) {
        throw new AppError('Credenciais inválidas', 401);
      }

      // Gerar tokens
      const tokens = this.generateTokens(user.id);

      // Armazenar refresh token no Redis
      await cache.set(`refresh_token:${user.id}`, tokens.refreshToken, 60 * 60 * 24 * 7); // 7 dias

      // Atualizar último login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      logger.info(`Login realizado com sucesso: ${user.email}`, {
        userId: user.id,
        email: user.email,
        action: 'login'
      });

      return {
        user: this.formatUser(user),
        tokens
      };
    } catch (error) {
      logger.error('Erro ao fazer login', {
        email: loginData.email,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<ITokens> {
    try {
      // Verificar se o token é válido
      const decoded = jwt.verify(refreshToken, process.env['JWT_SECRET']!) as any;

      if (decoded.type !== 'refresh') {
        throw new AppError('Token inválido', 401);
      }

      // Verificar se o token está no Redis
      const storedToken = await cache.get(`refresh_token:${decoded.userId}`);

      if (!storedToken || storedToken !== refreshToken) {
        throw new AppError('Token inválido ou expirado', 401);
      }

      // Verificar se o usuário ainda existe e está ativo
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || !user.active) {
        throw new AppError('Usuário não encontrado ou inativo', 401);
      }

      // Gerar novos tokens
      const tokens = this.generateTokens(user.id);

      // Atualizar refresh token no Redis
      await cache.set(`refresh_token:${user.id}`, tokens.refreshToken, 60 * 60 * 24 * 7); // 7 dias

      logger.info(`Token renovado com sucesso: ${user.email}`, {
        userId: user.id,
        email: user.email,
        action: 'refresh_token'
      });

      return tokens;
    } catch (error) {
      logger.error('Erro ao renovar token', {
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  async logout(userId: string): Promise<void> {
    try {
      // Remover refresh token do Redis
      await cache.del(`refresh_token:${userId}`);

      // Buscar informações do usuário para log
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });

      logger.info(`Logout realizado com sucesso: ${user?.email}`, {
        userId,
        email: user?.email,
        action: 'logout'
      });
    } catch (error) {
      logger.error('Erro ao fazer logout', {
        userId,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      // Verificar se o usuário existe
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Por segurança, não revelar se o email existe ou não
        logger.warn(`Tentativa de recuperação de senha para email não existente: ${email}`);
        return;
      }

      // Gerar token de recuperação
      const resetToken = uuidv4();
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Salvar token no banco
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry
        }
      });

      // Armazenar token temporário no Redis (backup)
      await cache.set(`reset_token:${resetToken}`, user.id, 60 * 60); // 1 hora

      // TODO: Enviar email de recuperação
      // await emailService.sendPasswordResetEmail(user.email, resetToken);

      logger.info(`Token de recuperação gerado para: ${email}`, {
        userId: user.id,
        email: user.email,
        action: 'forgot_password'
      });
    } catch (error) {
      logger.error('Erro ao gerar token de recuperação', {
        email,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Buscar usuário pelo token
      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        throw new AppError('Token inválido ou expirado', 400);
      }

      // Hash da nova senha
      const hashedPassword = await this.hashPassword(newPassword);

      // Atualizar senha e limpar tokens
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null
        }
      });

      // Remover token do Redis
      await cache.del(`reset_token:${token}`);

      // Remover refresh token para forçar novo login
      await cache.del(`refresh_token:${user.id}`);

      logger.info(`Senha redefinida com sucesso para: ${user.email}`, {
        userId: user.id,
        email: user.email,
        action: 'reset_password'
      });
    } catch (error) {
      logger.error('Erro ao redefinir senha', {
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  async getUserById(userId: string): Promise<IUserResponse> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new AppError('Usuário não encontrado', 404);
      }

      return this.formatUser(user);
    } catch (error) {
      logger.error('Erro ao buscar usuário', {
        userId,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  async updateProfile(userId: string, updateData: Partial<IRegisterData>): Promise<IUserResponse> {
    try {
      const updateFields: any = {};

      if (updateData.name) {
        updateFields.name = updateData.name;
      }

      if (updateData.email) {
        // Verificar se o email já não está em uso por outro usuário
        const existingUser = await prisma.user.findUnique({
          where: { email: updateData.email }
        });

        if (existingUser && existingUser.id !== userId) {
          throw new AppError('Email já está em uso', 400);
        }

        updateFields.email = updateData.email;
      }

      if (updateData.password) {
        updateFields.password = await this.hashPassword(updateData.password);
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateFields
      });

      logger.info(`Perfil atualizado com sucesso: ${user.email}`, {
        userId: user.id,
        email: user.email,
        action: 'update_profile'
      });

      return this.formatUser(user);
    } catch (error) {
      logger.error('Erro ao atualizar perfil', {
        userId,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new AppError('Usuário não encontrado', 404);
      }

      // Verificar senha atual
      const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.password);

      if (!isCurrentPasswordValid) {
        throw new AppError('Senha atual incorreta', 400);
      }

      // Hash da nova senha
      const hashedPassword = await this.hashPassword(newPassword);

      // Atualizar senha
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      logger.info(`Senha alterada com sucesso para: ${user.email}`, {
        userId: user.id,
        email: user.email,
        action: 'change_password'
      });
    } catch (error) {
      logger.error('Erro ao alterar senha', {
        userId,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }
}
