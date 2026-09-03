export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, any>,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super('AUTHENTICATION_ERROR', message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super('AUTHORIZATION_ERROR', message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super('NOT_FOUND', `${resource}${id ? ` with id ${id}` : ''} not found`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super('RATE_LIMIT_EXCEEDED', message, 429, { retryAfter });
  }
}

export class PaymentError extends AppError {
  constructor(message: string, provider?: string) {
    super('PAYMENT_ERROR', message, 402, { provider });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super('EXTERNAL_SERVICE_ERROR', `${service}: ${message}`, 502, { service });
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super('DATABASE_ERROR', message, 500);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isOperationalError(error: unknown): boolean {
  return isAppError(error) && error.isOperational;
}