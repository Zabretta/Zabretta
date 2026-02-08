// backend/src/utils/response.ts
import { APIResponse } from '../types/api';

export const createSuccessResponse = <T>(data: T): APIResponse<T> => {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
};

export const createErrorResponse = (error: string): APIResponse => {
  return {
    success: false,
    error,
    timestamp: new Date().toISOString()
  };
};

export const handleControllerError = (error: unknown): APIResponse => {
  console.error('Controller error:', error);
  
  if (error instanceof Error) {
    return createErrorResponse(error.message);
  }
  
  return createErrorResponse('Внутренняя ошибка сервера');
};