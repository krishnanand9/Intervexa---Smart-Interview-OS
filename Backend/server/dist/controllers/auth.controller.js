import { z } from 'zod';
import * as auth from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/jwt.js';
export const registerSchema = z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(8).max(128)
});
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});
export const updateProfileSchema = z.object({
    name: z.string().min(2).max(80).optional(),
    avatar: z.string().url().or(z.literal('')).optional()
});
const setRefreshCookie = (res, token) => res.cookie('intervexa_refresh', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/api/auth'
});
export const register = asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const result = await auth.register(body.name, body.email, body.password);
    setRefreshCookie(res, result.refreshToken);
    res.status(201).json({
        success: true,
        accessToken: result.accessToken,
        user: result.user,
        data: {
            accessToken: result.accessToken,
            user: result.user
        }
    });
});
export const login = asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const result = await auth.login(body.email, body.password);
    setRefreshCookie(res, result.refreshToken);
    res.json({
        success: true,
        accessToken: result.accessToken,
        user: result.user,
        data: {
            accessToken: result.accessToken,
            user: result.user
        }
    });
});
export const refresh = asyncHandler(async (req, res) => {
    const token = req.cookies.intervexa_refresh;
    if (!token) {
        return res.status(401).json({ success: false, message: 'Refresh token missing' });
    }
    const result = await auth.refresh(token);
    setRefreshCookie(res, result.refreshToken);
    res.json({
        success: true,
        accessToken: result.accessToken,
        user: result.user,
        data: {
            accessToken: result.accessToken,
            user: result.user
        }
    });
});
export const logout = asyncHandler(async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            const payload = verifyAccessToken(authHeader.slice(7));
            if (payload?.sub)
                await auth.logout(payload.sub);
        }
        else if (req.user?.id) {
            await auth.logout(req.user.id);
        }
    }
    catch { }
    res.clearCookie('intervexa_refresh', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.COOKIE_SECURE === 'true',
        path: '/api/auth'
    });
    res.json({ success: true, message: 'Logged out' });
});
export const me = asyncHandler(async (req, res) => {
    const user = await auth.me(req.user.id);
    res.json({
        success: true,
        user,
        data: { user }
    });
});
export const updateProfile = asyncHandler(async (req, res) => {
    const body = updateProfileSchema.parse(req.body);
    const user = await auth.updateProfile(req.user.id, body.name, body.avatar);
    res.json({
        success: true,
        user,
        data: { user }
    });
});
