import { Request, Response, NextFunction } from 'express';
import { AppError, isAppError } from '@tradenest/common';
import { config } from '../config';
import { logger } from '../utils/logger';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  logger.error({ err, path: req.path, method: req.method }, 'Request error');

  if (isAppError(err)) {
    res.status(err.statusCode).json({ code: err.code, message: err.message, details: err.details });
    return;
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      res.status(409).json({ code: 'CONFLICT', message: 'Record already exists' });
      return;
    }
    if (prismaErr.code === 'P2025') {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Record not found' });
      return;
    }
  }

  if (err.name === 'ZodError') {
    const zodErr = err as any;
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: zodErr.errors.map((e: any) => ({ field: e.path.join('.'), message: e.message })),
    });
    return;
  }

  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: config.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` });
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch(next);
}