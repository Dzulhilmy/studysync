import { Schema, model, models, Document } from 'mongoose'

export type ReportStatus = 'draft' | 'submitted'

export interface IReport extends Document {
  teacher:     Schema.Types.ObjectId
  month:       number   // 1-12
  year:        number
  status:      ReportStatus
  submittedAt?: Date

  // Snapshot data (denormalized so report is stable even if DB changes)
  teacherName:  string
  teacherEmail: string
  summary: {
    totalSubjects:    number
    totalStudents:    number
    totalProjects:    number
    approvedProjects: number
    totalSubmissions: number
    gradedSubmissions:number
    lateSubmissions:  number
    avgGrade:         number | null
  }
  subjects: {
    subjectId:   string
    name:        string
    code:        string
    studentCount:number
    projects: {
      projectId:     string
      title:         string
      deadline:      string
      maxScore:      number
      status:        string
      totalStudents: number
      submitted:     number
      graded:        number
      late:          number
      avgGrade:      number | null
      highestGrade:  number | null
      lowestGrade:   number | null
    }[]
  }[]
  remarks?: string
  createdAt: Date
  updatedAt: Date
}

const ReportSchema = new Schema<IReport>(
  {
    teacher:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    month:        { type: Number, required: true, min: 1, max: 12 },
    year:         { type: Number, required: true },
    status:       { type: String, enum: ['draft', 'submitted'], default: 'draft' },
    submittedAt:  { type: Date },
    teacherName:  { type: String, required: true },
    teacherEmail: { type: String, required: true },
    summary:      { type: Schema.Types.Mixed, default: {} },
    subjects:     [{ type: Schema.Types.Mixed }],
    remarks:      { type: String, default: '' },
  },
  { timestamps: true }
)

// One report per teacher per month/year
ReportSchema.index({ teacher: 1, month: 1, year: 1 }, { unique: true })

const Report = models.Report || model<IReport>('Report', ReportSchema)
export default Report