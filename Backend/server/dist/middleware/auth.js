import User from '../models/User.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from './error.js';
export async function requireAuth(req, _res, next) {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer '))
            throw new AppError(401, 'Authentication required');
        const payload = verifyAccessToken(header.slice(7));
        const user = await User.findById(payload.sub).select('_id email role');
        if (!user)
            throw new AppError(401, 'User no longer exists');
        req.user = { id: user.id, email: user.email, role: user.role };
        next();
    }
    catch (e) {
        next(e instanceof AppError ? e : new AppError(401, 'Invalid or expired access token'));
    }
}
