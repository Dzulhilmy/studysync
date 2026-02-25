import { Schema, model, models, Document } from 'mongoose'

export type SubmissionStatus = 'pending' | 'submitted' | 'graded'

export interface ISubmission extends Document {
  project: Schema.Types.ObjectId
  student: Schema.Types.ObjectId
  fileUrl?: string
  textResponse?: string
  submittedAt?: Date
  isLate: boolean
  grade?: number
  feedback?: string
  status: SubmissionStatus
  createdAt: Date
  updatedAt: Date
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    project:      { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    student:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fileUrl:      { type: String, default: '' },
    textResponse: { type: String, default: '' },
    submittedAt:  { type: Date },
    isLate:       { type: Boolean, default: false },
    grade:        { type: Number },
    feedback:     { type: String, default: '' },
    status:       { type: String, enum: ['pending', 'submitted', 'graded'], default: 'pending' },
  },
  { timestamps: true }
)

const Submission = models.Submission || model<ISubmission>('Submission', SubmissionSchema)
export default Submission