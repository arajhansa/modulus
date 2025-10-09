import { Request, Response, NextFunction, RequestHandler } from 'express';

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const asyncHandler = (fn: RequestHandler): RequestHandler => 
  (req: Request, res: Response, next: NextFunction) => 
    Promise.resolve(fn(req, res, next)).catch(next);

export const globalErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.details && { details: err.details })
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
};

