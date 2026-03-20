import { Schema, model, models, Document } from 'mongoose'

// ── All notification types ────────────────────────────────────────────────────
// Student-facing
export type NotifType =
  | 'submission_graded'        // teacher graded your submission
  | 'redo_requested'           // teacher asked for revision
  | 'new_message'              // new chat message on a submission
  | 'project_published'        // new project available in your subject
  // Teacher-facing
  | 'new_submission'           // a student submitted work for grading
  | 'project_approved'         // admin approved your project
  | 'project_rejected'         // admin rejected your project
  // Admin-facing
  | 'project_pending_approval' // teacher created a project, awaiting admin review
  | 'profile_updated'          // a user changed their profile details
  | 'new_report'               // a new performance report is available

// ── Schema ────────────────────────────────────────────────────────────────────
interface INotification extends Document {
  recipient: Schema.Types.ObjectId
  type:      NotifType
  title:     string
  message:   string
  link:      string
  read:      boolean
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type:      { type: String, required: true },
    title:     { type: String, required: true },
    message:   { type: String, required: true },
    link:      { type: String, default: '/' },
    read:      { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// Index for fast unread count queries
NotificationSchema.index({ recipient: 1, read: 1 })

export default models.Notification ?? model<INotification>('Notification', NotificationSchema)