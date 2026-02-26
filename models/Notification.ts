import { Schema, model, models, Document } from 'mongoose'

export type NotifType =
  | 'project_approved'    // admin approved teacher's project → notify teacher
  | 'project_rejected'    // admin rejected teacher's project → notify teacher
  | 'project_published'   // project approved → notify enrolled students
  | 'submission_received' // student submitted → notify teacher
  | 'submission_graded'   // teacher graded → notify student
  | 'deadline_warning'    // 5 days left + not submitted → notify student
  | 'announcement_posted' // new announcement → notify relevant students

export interface INotification extends Document {
  recipient:  Schema.Types.ObjectId  // who receives this
  type:       NotifType
  title:      string
  message:    string
  link:       string                 // redirect URL when clicked
  isRead:     boolean
  createdAt:  Date
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type:      { type: String, required: true },
    title:     { type: String, required: true },
    message:   { type: String, required: true },
    link:      { type: String, required: true },
    isRead:    { type: Boolean, default: false },
  },
  { timestamps: true }
)

// Index for fast per-user queries
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })

const Notification = models.Notification || model<INotification>('Notification', NotificationSchema)
export default Notification