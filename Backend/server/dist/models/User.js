import mongoose, { Schema } from 'mongoose';
const userSchema = new Schema({
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['candidate', 'admin'], default: 'candidate' },
    refreshTokenHash: { type: String, select: false },
}, { timestamps: true });
const User = mongoose.model('User', userSchema);
export default User;
