import { Schema, model, models, Document } from 'mongoose'

export type SubmissionStatus = 'pending' | 'submitted' | 'graded' | 'draft'

// ── Sub-document types ────────────────────────────────────────────────────────

export interface ISubmissionVersion {
  version:      number
  fileUrl:      string
  textResponse: string
  submittedAt:  Date | null
  isLate:       boolean
  grade:        number | null
  feedback:     string
  status:       string
}

export interface ISubmissionMessage {
  _id?:       Schema.Types.ObjectId
  sender:     Schema.Types.ObjectId
  senderName: string
  senderRole: 'teacher' | 'student'
  content:    string
  createdAt:  Date
}

// ── Main document type ────────────────────────────────────────────────────────

export interface ISubmission extends Document {
  project:        Schema.Types.ObjectId
  student:        Schema.Types.ObjectId
  fileUrl?:       string
  textResponse?:  string
  submittedAt?:   Date
  isLate:         boolean
  grade?:         number
  feedback?:      string
  gradeVisible:   boolean
  status:         SubmissionStatus
  // ── Versioning ──────────────────────────────────────────────────────────────
  currentVersion: number
  versions:       ISubmissionVersion[]
  // ── Redo ────────────────────────────────────────────────────────────────────
  redoRequested:  boolean
  redoReason:     string
  // ── Messages ────────────────────────────────────────────────────────────────
  messages:       ISubmissionMessage[]
  createdAt:      Date
  updatedAt:      Date
}

// ── Schema ────────────────────────────────────────────────────────────────────

const VersionSchema = new Schema<ISubmissionVersion>(
  {
    version:      { type: Number,  required: true },
    fileUrl:      { type: String,  default: '' },
    textResponse: { type: String,  default: '' },
    submittedAt:  { type: Date,    default: null },
    isLate:       { type: Boolean, default: false },
    grade:        { type: Number,  default: null },
    feedback:     { type: String,  default: '' },
    status:       { type: String,  default: 'submitted' },
  },
  { _id: false }
)

const MessageSchema = new Schema<ISubmissionMessage>(
  {
    sender:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String,  required: true },
    senderRole: { type: String,  enum: ['teacher', 'student'], required: true },
    content:    { type: String,  required: true },
    createdAt:  { type: Date,    default: Date.now },
  },
  { _id: true }
)

const SubmissionSchema = new Schema<ISubmission>(
  {
    project:      { type: Schema.Types.ObjectId, ref: 'Project',  required: true },
    student:      { type: Schema.Types.ObjectId, ref: 'User',     required: true },
    fileUrl:      { type: String,  default: '' },
    textResponse: { type: String,  default: '' },
    submittedAt:  { type: Date },
    isLate:       { type: Boolean, default: false },
    grade:        { type: Number },
    feedback:     { type: String,  default: '' },
    gradeVisible: { type: Boolean, default: false },
    status:       { type: String,  enum: ['pending', 'draft', 'submitted', 'graded'], default: 'pending' },
    // ── Versioning ────────────────────────────────────────────────────────────
    currentVersion: { type: Number,  default: 0 },
    versions:       { type: [VersionSchema], default: [] },
    // ── Redo ──────────────────────────────────────────────────────────────────
    redoRequested:  { type: Boolean, default: false },
    redoReason:     { type: String,  default: '' },
    // ── Messages ──────────────────────────────────────────────────────────────
    messages:       { type: [MessageSchema], default: [] },
  },
  { timestamps: true }
)

const Submission = models.Submission || model<ISubmission>('Submission', SubmissionSchema)
export default Submission