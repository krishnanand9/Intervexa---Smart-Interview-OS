import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { AppError } from '../middleware/error.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
const SALT_ROUNDS = 12;
const publicUser = (u) => ({ id: u._id.toString(), name: u.name, email: u.email, avatar: u.avatar || '', role: u.role, createdAt: u.createdAt });
export async function register(name, email, password) {
    const normalized = email.trim().toLowerCase();
    if (await User.exists({ email: normalized }))
        throw new AppError(409, 'An account with this email already exists');
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ name: name.trim(), email: normalized, passwordHash });
    return issueTokens(user);
}
export async function login(email, password) {
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash +refreshTokenHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
        throw new AppError(401, 'Invalid email or password');
    return issueTokens(user);
}
async function issueTokens(user) {
    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id });
    user.refreshTokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken, user: publicUser(user) };
}
export async function refresh(refreshToken) {
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub).select('+refreshTokenHash');
    if (!user?.refreshTokenHash || !(await bcrypt.compare(refreshToken, user.refreshTokenHash)))
        throw new AppError(401, 'Invalid refresh token');
    return issueTokens(user);
}
export async function logout(userId) { await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } }); }
export async function me(userId) { const user = await User.findById(userId); if (!user)
    throw new AppError(404, 'User not found'); return publicUser(user); }
export async function updateProfile(userId, name, avatar) { const user = await User.findByIdAndUpdate(userId, { ...(name !== undefined ? { name: name.trim() } : {}), ...(avatar !== undefined ? { avatar } : {}) }, { new: true, runValidators: true }); if (!user)
    throw new AppError(404, 'User not found'); return publicUser(user); }
