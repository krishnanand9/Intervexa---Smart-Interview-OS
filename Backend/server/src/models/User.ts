import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  role: 'candidate' | 'admin';
  refreshTokenHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['candidate','admin'], default: 'candidate' },
  refreshTokenHash: { type: String, select: false },
}, { timestamps: true });

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User;
