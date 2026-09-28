import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export function signAccessToken(payload) {
    return jwt.sign({ ...payload, type: 'access' }, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES });
}
export function signRefreshToken(payload) {
    return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES });
}
export function verifyAccessToken(token) {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
}
export function verifyRefreshToken(token) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
}
