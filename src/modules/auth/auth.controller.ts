import type { Request, Response } from 'express';
import { authService } from './auth.service';
import type { LoginRequest, RegisterRequest } from './auth.types';
import { successResponse } from '../../shared/utils/response';

export const register = async (req: Request, res: Response): Promise<void> => {
  const data = req.body as RegisterRequest;
  const user = await authService.registerUser(data);
  successResponse(res, user, 201);
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const data = req.body as LoginRequest;
  const result = await authService.loginUser(data);
  successResponse(res, result);
};
