import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';

export class AppError extends Error { constructor(public statusCode: number, message: string) { super(message); this.name='AppError'; } }
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  if (err instanceof mongoose.Error.ValidationError) return res.status(400).json({ success:false, message:'Validation failed', errors:Object.values(err.errors).map(e=>e.message) });
  if (err instanceof AppError) return res.status(err.statusCode).json({ success:false, message:err.message });
  return res.status(500).json({ success:false, message:'Internal server error' });
}
