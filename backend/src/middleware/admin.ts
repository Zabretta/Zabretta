// backend/src/middleware/admin.ts

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { createErrorResponse } from '../utils/response';
import { isAdminRole, isSuperAdminRole } from '../config/auth';

// Только для админов (полный доступ)
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json(createErrorResponse('Требуется авторизация'));
    return;
  }
  
  if (!isSuperAdminRole(req.user.role)) {
    res.status(403).json(createErrorResponse('Требуются права администратора'));
    return;
  }
  
  next();
};

// Для модераторов и админов (ограниченный доступ)
export const requireModeratorOrAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json(createErrorResponse('Требуется авторизация'));
    return;
  }
  
  if (!isAdminRole(req.user.role)) {
    res.status(403).json(createErrorResponse('Недостаточно прав'));
    return;
  }
  
  next();
};