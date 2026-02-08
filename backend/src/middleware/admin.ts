// backend/src/middleware/admin.ts
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { createErrorResponse } from '../utils/response';
import { isAdminRole } from '../config/auth';

export const requireAdmin = (
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
