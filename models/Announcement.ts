import { Schema, model, models, Document } from 'mongoose'

export interface IAnnouncement extends Document {
  title: string
  content: string
  author: Schema.Types.ObjectId
  scope: 'global' | 'subject'
  subject?: Schema.Types.ObjectId
  isPinned: boolean
  readBy: Schema.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title:   { type: String, required: true, trim: true },
    content: { type: String, required: true },
    author:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    scope:   { type: String, enum: ['global', 'subject'], default: 'subject' },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', default: null },
    isPinned:{ type: Boolean, default: false },
    readBy:  [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
)

const Announcement = models.Announcement || model<IAnnouncement>('Announcement', AnnouncementSchema)
export default Announcement
