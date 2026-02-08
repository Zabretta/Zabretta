// backend/src/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { JWT_CONFIG } from '../config/auth';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { LoginRequest, RegisterRequest } from '../types/admin';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { login, email, password, name }: RegisterRequest = req.body;
      
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { login },
            { email }
          ]
        }
      });
      
      if (existingUser) {
        res.status(400).json(createErrorResponse('Пользователь с таким логином или email уже существует'));
        return;
      }
      
      const passwordHash = await bcrypt.hash(password, 10);
      
      const user = await prisma.user.create({
        data: {
          login,
          email,
          name,
          passwordHash,
          role: 'USER',
          isActive: true,
          rating: 15,
          activityPoints: 0,
          totalPosts: 0,
          violations: 0
        },
        select: {
          id: true,
          login: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          rating: true,
          activityPoints: true,
          totalPosts: true,
          violations: true
        }
      });
      
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_CONFIG.secret,
        { expiresIn: JWT_CONFIG.expiresIn as jwt.SignOptions['expiresIn'] }
      );
      
      const refreshToken = jwt.sign(
        { userId: user.id },
        JWT_CONFIG.refreshSecret,
        { expiresIn: JWT_CONFIG.refreshExpiresIn as jwt.SignOptions['expiresIn'] }
      );
      
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken, lastLogin: new Date() }
      });
      
      res.json(createSuccessResponse({
        token,
        refreshToken,
        user: {
          ...user,
          createdAt: user.createdAt.toISOString(),
          lastLogin: user.lastLogin?.toISOString()
        }
      }));
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json(createErrorResponse('Ошибка при регистрации'));
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { login, password }: LoginRequest = req.body;
      
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { login },
            { email: login }
          ]
        }
      });
      
      if (!user) {
        res.status(401).json(createErrorResponse('Неверный логин или пароль'));
        return;
      }
      
      if (!user.isActive) {
        res.status(403).json(createErrorResponse('Аккаунт заблокирован'));
        return;
      }
      
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        res.status(401).json(createErrorResponse('Неверный логин или пароль'));
        return;
      }
      
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_CONFIG.secret,
        { expiresIn: JWT_CONFIG.expiresIn as jwt.SignOptions['expiresIn'] }
      );
      
      const refreshToken = jwt.sign(
        { userId: user.id },
        JWT_CONFIG.refreshSecret,
        { expiresIn: JWT_CONFIG.refreshExpiresIn as jwt.SignOptions['expiresIn'] }
      );
      
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken, lastLogin: new Date() }
      });
      
      const userData = {
        id: user.id,
        login: user.login,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        lastLogin: new Date().toISOString(),
        rating: user.rating,
        activityPoints: user.activityPoints,
        totalPosts: user.totalPosts,
        violations: user.violations
      };
      
      res.json(createSuccessResponse({
        token,
        refreshToken,
        user: userData
      }));
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json(createErrorResponse('Ошибка при входе в систему'));
    }
  }

  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json(createErrorResponse('Refresh token обязателен'));
        return;
      }
      
      const decoded = jwt.verify(refreshToken, JWT_CONFIG.refreshSecret) as { userId: string };
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId, refreshToken }
      });
      
      if (!user) {
        res.status(401).json(createErrorResponse('Недействительный refresh token'));
        return;
      }
      
      if (!user.isActive) {
        res.status(403).json(createErrorResponse('Аккаунт заблокирован'));
        return;
      }
      
      const newToken = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_CONFIG.secret,
        { expiresIn: JWT_CONFIG.expiresIn as jwt.SignOptions['expiresIn'] }
      );
      
      res.json(createSuccessResponse({
        token: newToken,
        refreshToken
      }));
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json(createErrorResponse('Недействительный refresh token'));
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;
      
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { refreshToken: null }
        });
      }
      
      res.json(createSuccessResponse({ success: true }));
    } catch (error) {
      res.status(500).json(createErrorResponse('Ошибка при выходе из системы'));
    }
  }

  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }
      
      const decoded = jwt.verify(token, JWT_CONFIG.secret) as { userId: string };
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          login: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          rating: true,
          activityPoints: true,
          totalPosts: true,
          violations: true
        }
      });
      
      if (!user) {
        res.status(404).json(createErrorResponse('Пользователь не найден'));
        return;
      }
      
      res.json(createSuccessResponse({
        ...user,
        createdAt: user.createdAt.toISOString(),
        lastLogin: user.lastLogin?.toISOString()
      }));
    } catch (error) {
      res.status(401).json(createErrorResponse('Недействительный токен'));
    }
  }

  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        res.status(401).json(createErrorResponse('Требуется авторизация'));
        return;
      }
      
      const decoded = jwt.verify(token, JWT_CONFIG.secret) as { userId: string };
      const { name, email, avatar } = req.body;
      
      const user = await prisma.user.update({
        where: { id: decoded.userId },
        data: { name, email, avatar },
        select: {
          id: true,
          login: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          rating: true,
          activityPoints: true,
          totalPosts: true,
          violations: true
        }
      });
      
      res.json(createSuccessResponse({
        ...user,
        createdAt: user.createdAt.toISOString(),
        lastLogin: user.lastLogin?.toISOString()
      }));
    } catch (error) {
      res.status(500).json(createErrorResponse('Ошибка при обновлении профиля'));
    }
  }
}
