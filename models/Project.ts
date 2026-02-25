import { Schema, model, models, Document } from 'mongoose'

export type ProjectStatus = 'pending' | 'approved' | 'rejected'

export interface IProject extends Document {
  title: string
  description?: string
  subject: Schema.Types.ObjectId
  deadline: Date
  maxScore: number
  attachments: string[]
  createdBy: Schema.Types.ObjectId
  status: ProjectStatus
  adminNote?: string
  createdAt: Date
  updatedAt: Date
}

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    deadline: { type: Date, required: true },
    maxScore: { type: Number, default: 100 },
    attachments: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminNote: { type: String, default: '' },
  },
  { timestamps: true }
)

const Project = models.Project || model<IProject>('Project', ProjectSchema)
export default Project
