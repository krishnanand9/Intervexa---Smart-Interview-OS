import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AccessPayload { sub: string; email: string; role: string; type: 'access'; }
export interface RefreshPayload { sub: string; type: 'refresh'; }

export function signAccessToken(payload: Omit<AccessPayload,'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES as SignOptions['expiresIn'] });
}
export function signRefreshToken(payload: Omit<RefreshPayload,'type'>): string {
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES as SignOptions['expiresIn'] });
}
export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
}
export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;
}
