import mongoose, { Schema, Document, model, models } from 'mongoose'

export type UserRole = 'admin' | 'teacher' | 'student'

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: UserRole
  avatar?: string
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['admin', 'teacher', 'student'], required: true, default: 'student' },
    avatar: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
)

// Prevent model re-compilation during hot reload
const User = models.User || model<IUser>('User', UserSchema)
export default User
