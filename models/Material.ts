import { Schema, model, models, Document } from 'mongoose'

export interface IMaterial extends Document {
  subject: Schema.Types.ObjectId
  title: string
  type: 'pdf' | 'video' | 'link' | 'doc' | 'upload'
  url: string       // primary url (fileUrl takes priority if both set)
  linkUrl?: string  // optional external URL / link
  fileUrl?: string  // optional Cloudinary uploaded file URL
  topic?: string
  uploadedBy: Schema.Types.ObjectId
  viewedBy: Schema.Types.ObjectId[]
  createdAt: Date
}

const MaterialSchema = new Schema<IMaterial>(
  {
    subject:    { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    title:      { type: String, required: true, trim: true },
    type:       { type: String, enum: ['pdf', 'video', 'link', 'doc', 'upload'], required: true },
    url:        { type: String, required: true },   // primary (for backward compat)
    linkUrl:    { type: String, default: null },     // external URL
    fileUrl:    { type: String, default: null },     // Cloudinary file
    topic:      { type: String, default: '' },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    viewedBy:   [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
)

const Material = models.Material || model<IMaterial>('Material', MaterialSchema)
export default Material