import { Schema, model, models, Document } from 'mongoose'

export interface ISubject extends Document {
  name: string
  code: string
  description?: string
  teacher?: Schema.Types.ObjectId
  students: Schema.Types.ObjectId[]
  coverImage?: string
  createdAt: Date
  updatedAt: Date
}

const SubjectSchema = new Schema<ISubject>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    teacher: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    coverImage: { type: String, default: '' },
  },
  { timestamps: true }
)

const Subject = models.Subject || model<ISubject>('Subject', SubjectSchema)
export default Subject
