// @ts-nocheck
/**
 * StudySync — Seed Script #2
 * Seeds: Submissions, Announcements, Materials, Reports
 *
 * ⚠️  Run AFTER seed.ts (requires existing Users, Subjects, Projects)
 *
 * Usage:
 *   node seed2.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

require('dotenv').config()
const mongoose = require('mongoose')

const uri = process.env.MONGODB_URI || 'YOUR_MONGODB_ATLAS_URI_HERE'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema({
  name: String, email: String, role: String,
}, { timestamps: true })

const SubjectSchema = new mongoose.Schema({
  name: String, code: String,
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true })

const ProjectSchema = new mongoose.Schema({
  title: String, description: String, maxScore: Number, status: String,
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deadline: Date,
}, { timestamps: true })

const SubmissionSchema = new mongoose.Schema({
  project:      { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  student:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  fileUrl:      { type: String, default: '' },
  textResponse: { type: String, default: '' },
  submittedAt:  Date,
  isLate:       { type: Boolean, default: false },
  grade:        Number,
  feedback:     { type: String, default: '' },
  // gradeVisible: false = grade hidden from students (only teachers/admins see)
  gradeVisible: { type: Boolean, default: false },
  status:       { type: String, enum: ['pending','submitted','graded'], default: 'pending' },
}, { timestamps: true })

const AnnouncementSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  content:  { type: String, required: true },
  author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scope:    { type: String, enum: ['global','subject'], default: 'global' },
  subject:  { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
  isPinned: { type: Boolean, default: false },
  readBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true })

const MaterialSchema = new mongoose.Schema({
  subject:    { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  title:      { type: String, required: true },
  type:       { type: String, enum: ['pdf','video','link','doc','upload'], required: true },
  url:        { type: String, required: true },
  linkUrl:    { type: String, default: null },
  fileUrl:    { type: String, default: null },
  topic:      { type: String, default: '' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  viewedBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true })

const ReportSchema = new mongoose.Schema({
  teacher:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month:        { type: Number, required: true },
  year:         { type: Number, required: true },
  status:       { type: String, enum: ['draft','submitted'], default: 'draft' },
  submittedAt:  Date,
  teacherName:  String,
  teacherEmail: String,
  summary:      mongoose.Schema.Types.Mixed,
  subjects:     [mongoose.Schema.Types.Mixed],
  remarks:      { type: String, default: '' },
}, { timestamps: true })

const User         = mongoose.models.User         || mongoose.model('User',         UserSchema)
const Subject      = mongoose.models.Subject      || mongoose.model('Subject',      SubjectSchema)
const Project      = mongoose.models.Project      || mongoose.model('Project',      ProjectSchema)
const Submission   = mongoose.models.Submission   || mongoose.model('Submission',   SubmissionSchema)
const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema)
const Material     = mongoose.models.Material     || mongoose.model('Material',     MaterialSchema)
const Report       = mongoose.models.Report       || mongoose.model('Report',       ReportSchema)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5) }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d }
function daysFromNow(n) { const d = new Date(); d.setDate(d.getDate() + n); return d }

// ─── Text responses (realistic student answers) ───────────────────────────────

const TEXT_RESPONSES = [
  'I have completed all the required tasks as outlined in the project brief. My approach focused on understanding the core concepts before applying them to the given problems. I referenced the textbook chapters covered in class and cross-checked my answers with reliable online sources.',
  'This project helped me understand the topic better. I started by researching the background, then drafted my response based on what we learned in class. I made sure to follow the formatting guidelines provided.',
  'My submission includes all the required components. I worked through each section systematically, ensuring accuracy in my calculations and clarity in my written explanations. I hope this meets the expected standard.',
  'I approached this assignment by first outlining the key points, then expanding each one with evidence from our class notes and the prescribed textbook. I also included real-life examples where applicable.',
  'After reviewing the project requirements carefully, I structured my response to address each criterion. I spent extra time on the analysis section to make sure my reasoning was clear and well-supported.',
  'I completed this submission to the best of my ability. Some parts were challenging, but I consulted the reference materials and my notes to ensure I addressed everything asked. Please see my attached file for the diagrams.',
  'This assignment required me to apply theoretical knowledge to a practical scenario. I enjoyed the research process and feel I have grown my understanding of the subject significantly through this project.',
  'I have submitted all required parts of this assignment. For the analytical sections, I used the framework discussed in class. My written responses are original and I have cited my sources at the end.',
  'Working on this project was a rewarding experience. I collaborated with the concepts discussed in our lessons and tried to go beyond the basic requirements by including additional examples and explanations.',
  'I have completed the assignment as instructed. My focus was on accuracy and clarity. I double-checked all numerical answers and proofread my written sections before submitting.',
]

const FEEDBACKS = [
  'Excellent work! Your analysis was thorough and well-structured. The examples you provided were relevant and clearly supported your arguments. Keep up this standard.',
  'Good effort overall. Your understanding of the core concepts is evident. However, the conclusion section could be more detailed — try to summarise your key findings more explicitly next time.',
  'A solid submission. You demonstrated a clear grasp of the topic. Some minor errors in calculation on question 3, but the methodology was correct. Well done.',
  'Very well done. The quality of your written explanation was impressive. Your diagrams were clearly labelled and your reasoning was logical throughout.',
  'Satisfactory work. You covered the main points but lacked depth in the analysis section. I encourage you to elaborate more on your reasoning in future assignments.',
  'Great improvement from your previous submission! The structure was much clearer and your use of examples was excellent. Minor grammar issues, but overall a strong piece of work.',
  'Outstanding submission. Every section was answered completely and correctly. Your presentation was neat and professional. This is an exemplary piece of work.',
  'Decent attempt. The introduction was strong, but the body paragraphs needed more evidence to support your claims. Revisit the class notes on this topic for your next submission.',
  'Well done! Your problem-solving approach was methodical and easy to follow. The final answers were accurate and you showed your working clearly. Excellent.',
  'Good work overall. A few points were not fully developed, but the core understanding is there. Focus on adding more specific examples and citations in your next assignment.',
  'Commendable effort. You tackled a complex topic with confidence. The structure was logical and the writing was fluent. One suggestion: be more consistent with your referencing style.',
  'This submission shows real effort and understanding. Your creative approach to the problem was refreshing. Some sections could be expanded, but the foundation is strong.',
]

// ─── UploadThing-style file URLs (simulated realistic URLs) ───────────────────
// In production these would be real utfs.io URLs from UploadThing.
// Format matches what UploadThing generates: https://utfs.io/f/{fileKey}

const UPLOADTHING_FILES = {
  pdf: [
    { url: 'https://utfs.io/f/abc123def456_chapter1_notes.pdf',        name: 'Chapter 1 Notes.pdf' },
    { url: 'https://utfs.io/f/bcd234efg567_lecture_slides_week3.pdf',  name: 'Lecture Slides Week 3.pdf' },
    { url: 'https://utfs.io/f/cde345fgh678_reference_textbook_ch5.pdf',name: 'Reference Textbook Ch.5.pdf' },
    { url: 'https://utfs.io/f/def456ghi789_past_year_questions.pdf',   name: 'Past Year Questions.pdf' },
    { url: 'https://utfs.io/f/efg567hij890_formula_sheet.pdf',         name: 'Formula Sheet.pdf' },
    { url: 'https://utfs.io/f/fgh678ijk901_lab_manual.pdf',            name: 'Lab Manual.pdf' },
    { url: 'https://utfs.io/f/ghi789jkl012_study_guide.pdf',           name: 'Study Guide.pdf' },
    { url: 'https://utfs.io/f/hij890klm123_essay_template.pdf',        name: 'Essay Template.pdf' },
    { url: 'https://utfs.io/f/ijk901lmn234_revision_notes.pdf',        name: 'Revision Notes.pdf' },
    { url: 'https://utfs.io/f/jkl012mno345_project_rubric.pdf',        name: 'Project Rubric.pdf' },
  ],
  doc: [
    { url: 'https://utfs.io/f/klm123nop456_assignment_template.docx',  name: 'Assignment Template.docx' },
    { url: 'https://utfs.io/f/lmn234opq567_report_format.docx',        name: 'Report Format.docx' },
    { url: 'https://utfs.io/f/mno345pqr678_worksheet_week4.docx',      name: 'Worksheet Week 4.docx' },
    { url: 'https://utfs.io/f/nop456qrs789_class_notes.docx',          name: 'Class Notes.docx' },
  ],
  video: [
    { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', name: 'Introduction Video' },
    { url: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ', name: 'Tutorial: Key Concepts' },
    { url: 'https://www.youtube.com/watch?v=9bZkp7q19f0', name: 'Revision Lecture Recording' },
  ],
  link: [
    { url: 'https://www.khanacademy.org',     name: 'Khan Academy — Free Resources' },
    { url: 'https://www.britannica.com',      name: 'Encyclopaedia Britannica' },
    { url: 'https://www.wolframalpha.com',    name: 'Wolfram Alpha — Math Solver' },
    { url: 'https://www.desmos.com',          name: 'Desmos — Graphing Calculator' },
    { url: 'https://phet.colorado.edu',       name: 'PhET Interactive Simulations' },
    { url: 'https://www.mathway.com',         name: 'Mathway — Step-by-step Solutions' },
    { url: 'https://quizlet.com',             name: 'Quizlet — Flashcards & Study Sets' },
    { url: 'https://www.coursera.org',        name: 'Coursera — Online Courses' },
  ],
}

// ─── Material data per subject ────────────────────────────────────────────────

const MATERIALS_BY_SUBJECT = {
  BM101: [
    { title: 'Panduan Penulisan Karangan',          type: 'pdf',   topic: 'Karangan',       file: UPLOADTHING_FILES.pdf[0] },
    { title: 'Nota Tatabahasa Bahasa Melayu',       type: 'pdf',   topic: 'Tatabahasa',     file: UPLOADTHING_FILES.pdf[8] },
    { title: 'Senarai Peribahasa Penting SPM',      type: 'doc',   topic: 'Peribahasa',     file: UPLOADTHING_FILES.doc[2] },
    { title: 'Teknik Menjawab Soalan Pemahaman',    type: 'link',  topic: 'Pemahaman',      file: UPLOADTHING_FILES.link[6] },
  ],
  ENG101: [
    { title: 'Essay Writing Guide — Structures',    type: 'pdf',   topic: 'Essay Writing',  file: UPLOADTHING_FILES.pdf[7] },
    { title: 'Grammar Reference Sheet',             type: 'pdf',   topic: 'Grammar',        file: UPLOADTHING_FILES.pdf[4] },
    { title: 'BBC Learning English — Online',       type: 'link',  topic: 'Listening',      file: UPLOADTHING_FILES.link[0] },
    { title: 'SPM Literature — Short Story Notes',  type: 'doc',   topic: 'Literature',     file: UPLOADTHING_FILES.doc[3] },
  ],
  ARB101: [
    { title: 'Arabic Alphabet & Pronunciation',     type: 'pdf',   topic: 'Asas Huruf',     file: UPLOADTHING_FILES.pdf[1] },
    { title: 'Kosakata Asas Bahasa Arab',           type: 'doc',   topic: 'Kosakata',       file: UPLOADTHING_FILES.doc[0] },
  ],
  MAN101: [
    { title: '汉语拼音完整指南',                     type: 'pdf',   topic: 'Pinyin',         file: UPLOADTHING_FILES.pdf[2] },
    { title: '常用汉字500字练习册',                   type: 'pdf',   topic: '汉字',           file: UPLOADTHING_FILES.pdf[8] },
    { title: 'Mandarin Tutorial Videos',            type: 'video', topic: 'Listening',      file: UPLOADTHING_FILES.video[0] },
  ],
  MATH101: [
    { title: 'Formula Reference Sheet — SPM',       type: 'pdf',   topic: 'Formulas',       file: UPLOADTHING_FILES.pdf[4] },
    { title: 'Algebra & Functions Notes',           type: 'pdf',   topic: 'Algebra',        file: UPLOADTHING_FILES.pdf[0] },
    { title: 'Desmos Graphing Calculator',          type: 'link',  topic: 'Tools',          file: UPLOADTHING_FILES.link[3] },
    { title: 'Statistics Worksheet Week 5',         type: 'doc',   topic: 'Statistics',     file: UPLOADTHING_FILES.doc[2] },
    { title: 'SPM Past Year Papers 2019–2023',      type: 'pdf',   topic: 'Past Papers',    file: UPLOADTHING_FILES.pdf[3] },
  ],
  AMATH101: [
    { title: 'Calculus — Differentiation Notes',    type: 'pdf',   topic: 'Calculus',       file: UPLOADTHING_FILES.pdf[1] },
    { title: 'Wolfram Alpha — Math Solver',         type: 'link',  topic: 'Tools',          file: UPLOADTHING_FILES.link[2] },
    { title: 'Integration Techniques Worksheet',    type: 'doc',   topic: 'Integration',    file: UPLOADTHING_FILES.doc[2] },
  ],
  SCI101: [
    { title: 'Scientific Method — Lab Guide',       type: 'pdf',   topic: 'Lab Skills',     file: UPLOADTHING_FILES.pdf[5] },
    { title: 'PhET Interactive Simulations',        type: 'link',  topic: 'Experiments',    file: UPLOADTHING_FILES.link[4] },
    { title: 'Chapter 3 — Forces & Motion Notes',   type: 'pdf',   topic: 'Forces',         file: UPLOADTHING_FILES.pdf[8] },
    { title: 'Science Revision Video Series',       type: 'video', topic: 'Revision',       file: UPLOADTHING_FILES.video[2] },
  ],
  PHY101: [
    { title: 'Physics Formula Booklet',             type: 'pdf',   topic: 'Formulas',       file: UPLOADTHING_FILES.pdf[4] },
    { title: 'Hooke\'s Law — Lab Manual',            type: 'pdf',   topic: 'Mechanics',      file: UPLOADTHING_FILES.pdf[5] },
    { title: 'Wave & Sound Tutorial Video',         type: 'video', topic: 'Waves',          file: UPLOADTHING_FILES.video[1] },
  ],
  BIO101: [
    { title: 'Cell Biology — Diagrams & Notes',     type: 'pdf',   topic: 'Cell Biology',   file: UPLOADTHING_FILES.pdf[0] },
    { title: 'Genetics — Punnett Square Guide',     type: 'doc',   topic: 'Genetics',       file: UPLOADTHING_FILES.doc[3] },
    { title: 'Ecosystem Field Study Template',      type: 'doc',   topic: 'Ecology',        file: UPLOADTHING_FILES.doc[0] },
    { title: 'Biology Encyclopedia — Britannica',   type: 'link',  topic: 'Reference',      file: UPLOADTHING_FILES.link[1] },
  ],
  CHEM101: [
    { title: 'Periodic Table & Element Properties', type: 'pdf',   topic: 'Elements',       file: UPLOADTHING_FILES.pdf[4] },
    { title: 'Titration Lab Report Template',       type: 'doc',   topic: 'Lab Work',       file: UPLOADTHING_FILES.doc[1] },
    { title: 'Organic Chemistry Reaction Guide',    type: 'pdf',   topic: 'Organic Chem',   file: UPLOADTHING_FILES.pdf[2] },
  ],
  PI101: [
    { title: 'Panduan Solat Lengkap',               type: 'pdf',   topic: 'Fiqh',           file: UPLOADTHING_FILES.pdf[6] },
    { title: 'Hafazan Surah — Audio References',    type: 'link',  topic: 'Hafazan',        file: UPLOADTHING_FILES.link[7] },
    { title: 'Sirah Nabawi — Ringkasan',            type: 'pdf',   topic: 'Sirah',          file: UPLOADTHING_FILES.pdf[8] },
  ],
  CS101: [
    { title: 'Python Beginner\'s Cheat Sheet',       type: 'pdf',   topic: 'Programming',   file: UPLOADTHING_FILES.pdf[0] },
    { title: 'HTML & CSS Quick Reference',          type: 'pdf',   topic: 'Web Dev',        file: UPLOADTHING_FILES.pdf[7] },
    { title: 'Algorithm Design — Lecture Slides',   type: 'pdf',   topic: 'Algorithms',     file: UPLOADTHING_FILES.pdf[1] },
    { title: 'Khan Academy — Computing',            type: 'link',  topic: 'Reference',      file: UPLOADTHING_FILES.link[0] },
    { title: 'Flowchart Worksheet Template',        type: 'doc',   topic: 'Algorithms',     file: UPLOADTHING_FILES.doc[2] },
  ],
  ART101: [
    { title: 'Elements of Art — Visual Guide',      type: 'pdf',   topic: 'Theory',         file: UPLOADTHING_FILES.pdf[6] },
    { title: 'Batik Techniques Reference Sheet',    type: 'pdf',   topic: 'Batik',          file: UPLOADTHING_FILES.pdf[2] },
    { title: 'Art Appreciation — Video Series',     type: 'video', topic: 'Appreciation',   file: UPLOADTHING_FILES.video[1] },
  ],
  HIST101: [
    { title: 'Timeline — Malaysia Independence',    type: 'pdf',   topic: 'Local History',  file: UPLOADTHING_FILES.pdf[0] },
    { title: 'WWII in Malaya — Key Events Chart',   type: 'doc',   topic: 'World War II',   file: UPLOADTHING_FILES.doc[3] },
    { title: 'History Essay Writing Framework',     type: 'pdf',   topic: 'Essay Skills',   file: UPLOADTHING_FILES.pdf[7] },
    { title: 'Encyclopaedia Britannica — History',  type: 'link',  topic: 'Reference',      file: UPLOADTHING_FILES.link[1] },
  ],
  GEO101: [
    { title: 'Topographic Map Reading Guide',       type: 'pdf',   topic: 'Map Skills',     file: UPLOADTHING_FILES.pdf[5] },
    { title: 'Field Study Report Template',         type: 'doc',   topic: 'Field Study',    file: UPLOADTHING_FILES.doc[1] },
    { title: 'Natural Disasters — Case Studies',    type: 'pdf',   topic: 'Disasters',      file: UPLOADTHING_FILES.pdf[3] },
  ],
  MUS101: [
    { title: 'Music Theory Fundamentals — Notes',   type: 'pdf',   topic: 'Music Theory',   file: UPLOADTHING_FILES.pdf[1] },
    { title: 'Traditional Malaysian Instruments',   type: 'pdf',   topic: 'Traditional',    file: UPLOADTHING_FILES.pdf[6] },
    { title: 'Ensemble Performance Guide',          type: 'pdf',   topic: 'Performance',    file: UPLOADTHING_FILES.pdf[9] },
    { title: 'Music Tutorial Video Series',         type: 'video', topic: 'Practice',       file: UPLOADTHING_FILES.video[2] },
  ],
}

// ─── Announcements ────────────────────────────────────────────────────────────

const ANNOUNCEMENT_DATA = [
  // ── Global / Admin pinned ───────────────────────────────────────────────
  {
    title: '📌 System Maintenance — Saturday 1 March 2026, 12:00 AM – 4:00 AM',
    content: `Dear StudySync users,\n\nPlease be informed that our system will undergo scheduled maintenance on Saturday, 1 March 2026 from 12:00 AM to 4:00 AM (MYT).\n\nDuring this period, the platform will be temporarily unavailable. Please ensure all pending submissions and announcements are completed before the maintenance window.\n\nWe apologise for any inconvenience caused. The system will resume normal operations by 4:00 AM.\n\nThank you for your understanding.\n\n— StudySync System Administration`,
    scope: 'global', isPinned: true, authorRole: 'admin', daysAgo: 3,
  },
  {
    title: '🎉 Welcome Back — New Semester Begins!',
    content: `Assalamualaikum and Good Day to all students and teachers,\n\nWe are pleased to welcome everyone back for the new academic semester. All subjects, projects and learning materials have been updated on the platform.\n\nStudents are encouraged to log in and check their enrolled subjects, review project deadlines, and download any new materials uploaded by their teachers.\n\nTeachers, please ensure your subject details, project briefs and materials are up to date by the end of this week.\n\nWishing everyone a productive and fulfilling semester ahead!\n\n— School Administration`,
    scope: 'global', isPinned: true, authorRole: 'admin', daysAgo: 14,
  },
  {
    title: '📅 Public Holiday — Thaipusam (29 January 2026)',
    content: `Dear all,\n\nPlease be informed that 29 January 2026 (Thursday) is a public holiday in conjunction with Thaipusam.\n\nAll classes and school activities are cancelled on this day. Project deadlines that fall on this date will be automatically extended to the next school day.\n\nHave a safe holiday!\n\n— Administration Office`,
    scope: 'global', isPinned: false, authorRole: 'admin', daysAgo: 30,
  },
  {
    title: '🏆 Annual Sports Day — Registration Now Open',
    content: `Attention all students!\n\nRegistrations for the Annual School Sports Day 2026 are now open. This year's event will be held on 15 March 2026 at the school field.\n\nStudents may register for the following events:\n• 100m Sprint\n• 4×100m Relay\n• Long Jump\n• Shot Put\n• Tug of War (team event)\n\nRegistration forms are available at the Student Affairs Office or can be submitted through your class teacher. Deadline for registration: 7 March 2026.\n\nLet's show our school spirit and participate enthusiastically!\n\n— Sports & Co-curricular Department`,
    scope: 'global', isPinned: false, authorRole: 'admin', daysAgo: 5,
  },
  {
    title: '📝 Mid-Year Examination Schedule Released',
    content: `Dear students and parents,\n\nThe Mid-Year Examination schedule has been finalised and is now available. Examinations will be held from 15 April to 25 April 2026.\n\nKey reminders:\n• Students must bring their student identification card on all examination days\n• No electronic devices are permitted in the examination hall\n• Students who are absent must submit a valid medical certificate within 3 working days\n• Results will be released within 3 weeks after the last paper\n\nPlease review the schedule carefully and plan your revision accordingly. Teachers will provide revision sessions in the weeks leading up to the examinations.\n\nAll the best!\n\n— Examination Unit`,
    scope: 'global', isPinned: true, authorRole: 'admin', daysAgo: 7,
  },
  {
    title: '💻 StudySync Platform Update — New Features Available',
    content: `Dear users,\n\nWe are excited to announce that StudySync has been updated with several new features to improve your learning experience:\n\n✅ Notification Bell — Receive real-time alerts for project approvals, submission grades and announcements\n✅ Monthly Reports — Teachers can now generate and submit monthly performance reports\n✅ Improved Search — Find anything on the platform instantly using the new search feature\n✅ Better File Uploads — Materials can now be uploaded directly as files or shared as links\n\nPlease explore the new features and share your feedback with the system administrator.\n\nHappy learning!\n\n— StudySync Development Team`,
    scope: 'global', isPinned: false, authorRole: 'admin', daysAgo: 2,
  },

  // ── Subject-specific — Teacher announcements ────────────────────────────
  {
    title: '📋 Mathematics — Project Submission Reminder',
    content: `Dear Mathematics students,\n\nThis is a reminder that the Statistics Project (School Survey Analysis) submission deadline is approaching.\n\nDeadline: Please refer to your project details on the Projects page.\n\nReminders:\n• Your survey must include responses from at least 30 people\n• Present your data using frequency tables and bar charts\n• Calculate mean, mode and median for your dataset\n• Submit as a PDF or Word document\n\nIf you are facing difficulties, please approach me during class or office hours. Do not leave your submission to the last minute!\n\n— Cikgu Shahrul Nizam`,
    scope: 'subject', subjectCode: 'MATH101', isPinned: true, authorRole: 'teacher', teacherIdx: 3, daysAgo: 4,
  },
  {
    title: '🧪 Science — Lab Session This Friday',
    content: `Dear Science students,\n\nPlease be reminded that we will be conducting our Photosynthesis Lab experiment this Friday.\n\nWhat to bring:\n• Lab coat or old shirt (mandatory)\n• Safety goggles\n• Your lab notebook\n• The pre-lab worksheet (completed)\n\nStudents who have not completed the pre-lab worksheet will NOT be permitted to participate in the experiment and will receive a zero for the lab session.\n\nLet's be safe and make this a productive experiment!\n\n— Cikgu Fauziah`,
    scope: 'subject', subjectCode: 'SCI101', isPinned: false, authorRole: 'teacher', teacherIdx: 4, daysAgo: 6,
  },
  {
    title: '📖 English — Novel Study Resources Uploaded',
    content: `Hello English class,\n\nI have uploaded new resources for our Short Story Analysis project under the Materials section. Please make sure to download and read through:\n\n1. Character Analysis Framework (PDF)\n2. Sample Essay with Model Answers (PDF)\n3. Key Literary Terms Reference Sheet (DOC)\n\nYour analysis should be at least 600 words and must address: character motivation, development arc, and relationship with the theme of the story.\n\nOffice hours are available every Tuesday and Thursday 2:00–3:00 PM if you need guidance.\n\n— Cikgu Ahmad Nazri`,
    scope: 'subject', subjectCode: 'ENG101', isPinned: false, authorRole: 'teacher', teacherIdx: 1, daysAgo: 8,
  },
  {
    title: '💻 Computer Science — Python Assignment Tips',
    content: `Dear CS students,\n\nA few important tips for your Python Assignment (Student Grade System):\n\n1. Your program MUST handle invalid inputs (e.g., non-numeric grades, empty names)\n2. The search function should be case-insensitive\n3. Include a main menu loop so the program stays running until the user chooses to exit\n4. Add comments to your code — at least one comment per function\n5. Test your program with at least 5 different students before submitting\n\nBonus marks will be awarded for:\n• File saving/loading functionality\n• Input validation with helpful error messages\n• Clean and well-formatted output\n\nGood luck!\n\n— Cikgu Hafizudin`,
    scope: 'subject', subjectCode: 'CS101', isPinned: true, authorRole: 'teacher', teacherIdx: 9, daysAgo: 9,
  },
  {
    title: '🎨 Visual Arts — Batik Project Materials Available',
    content: `Dear Arts students,\n\nAll required materials for the Batik Design Project are now available in the school's Art Room (Room B-12).\n\nAvailable materials:\n• Batik fabric (white cotton) — 1 piece per student\n• Tjanting tools for wax application\n• Fabric dye (multiple colours)\n• Wax and heating equipment (teacher-supervised only)\n\nStudents are welcome to work on their projects during free periods or after school (3:30–5:00 PM, Monday to Thursday). Please sign the attendance sheet when using the Art Room.\n\nRemember: Your design sketch must be approved by me before you begin the wax application.\n\n— Cikgu Santhosh Kumar`,
    scope: 'subject', subjectCode: 'ART101', isPinned: false, authorRole: 'teacher', teacherIdx: 16, daysAgo: 11,
  },
  {
    title: '📅 Holiday Notice — Thaipusam & Class Replacement',
    content: `Dear Physics students,\n\nAs announced, 29 January 2026 is a public holiday. The Physics class scheduled for that day will be replaced as follows:\n\nReplacement Class: Wednesday, 4 February 2026\nTime: 2:00 PM – 3:30 PM\nRoom: Physics Lab (Block C)\n\nAttendance is compulsory. Please update your timetables accordingly. We will be covering the chapter on Electromagnetic Waves during this session — please read pages 142–158 of your textbook beforehand.\n\nSee you then!\n\n— Cikgu Lim Choon Hock`,
    scope: 'subject', subjectCode: 'PHY101', isPinned: false, authorRole: 'teacher', teacherIdx: 5, daysAgo: 25,
  },
  {
    title: '🕌 Pendidikan Islam — Jadual Hafazan Dikemaskini',
    content: `Assalamualaikum w.b.t. pelajar-pelajar PI,\n\nJadual sesi hafazan individu telah dikemaskini. Sila semak jadual yang telah ditampalkan di papan kenyataan kelas dan dalam bahagian Bahan Pembelajaran di bawah mata pelajaran Pendidikan Islam.\n\nSetiap pelajar akan diberikan masa 5 minit untuk membacakan hafazan mereka. Penilaian akan dilakukan berdasarkan:\n• Kelancaran bacaan\n• Ketepatan tajwid\n• Kefahaman makna ayat (soalan lisan)\n\nPelajar yang tidak hadir pada slot yang ditetapkan tanpa sebab yang munasabah akan diberikan markah sifar.\n\nMohon kerjasama semua pihak.\n\nJazakallah Khayran.\n\n— Cikgu Siti Hajar`,
    scope: 'subject', subjectCode: 'PI101', isPinned: true, authorRole: 'teacher', teacherIdx: 8, daysAgo: 12,
  },
  {
    title: '🌍 Geography — Field Trip Confirmation',
    content: `Dear Geography students,\n\nI am pleased to confirm that our Geography Field Trip to Sungai Klang for the River Morphology study has been approved!\n\nDate: Saturday, 14 March 2026\nDeparture: 7:30 AM from school main entrance\nReturn: Approximately 2:00 PM\n\nWhat to bring:\n• Field study worksheet (will be distributed this week)\n• Camera or phone for photographs\n• Waterproof footwear (compulsory)\n• Extra change of clothes\n• Water bottle and light snacks\n\nParental consent forms must be returned by 10 March 2026. Students without consent forms will NOT be allowed to participate.\n\nThis field trip will be directly assessed as part of your Field Study Report project.\n\n— Cikgu Nurul Huda`,
    scope: 'subject', subjectCode: 'GEO101', isPinned: false, authorRole: 'teacher', teacherIdx: 13, daysAgo: 1,
  },
]

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n' + '═'.repeat(65))
  console.log('  🌱  StudySync Seed Script #2 — Submissions, Announcements,')
  console.log('       Materials & Reports')
  console.log('═'.repeat(65))

  await mongoose.connect(uri)
  console.log('\n✅  Connected to MongoDB Atlas')

  // ── Load existing data ────────────────────────────────────────────────────
  const students  = await User.find({ role: 'student' }).lean()
  const teachers  = await User.find({ role: 'teacher' }).lean()
  const admin     = await User.findOne({ role: 'admin' }).lean()
  const subjects  = await Subject.find({}).populate('teacher').lean()
  const projects  = await Project.find({ status: 'approved' }).lean()

  if (!students.length || !teachers.length || !projects.length) {
    console.error('\n❌  No existing data found. Please run seed.js first!\n')
    process.exit(1)
  }

  console.log(`\n   Found: ${students.length} students, ${teachers.length} teachers, ${projects.length} projects, ${subjects.length} subjects`)

  // Wipe existing seeded data
  console.log('\n🗑   Clearing Submissions, Announcements, Materials, Reports...')
  await Promise.all([
    Submission.deleteMany({}),
    Announcement.deleteMany({}),
    Material.deleteMany({}),
    Report.deleteMany({}),
  ])

  // Build lookup maps
  const subjectByCode = {}
  subjects.forEach(s => { subjectByCode[s.code] = s })

  const teacherByIdx = {}
  teachers.forEach((t, i) => { teacherByIdx[i] = t })

  // ── 1. SUBMISSIONS ────────────────────────────────────────────────────────
  console.log('\n📤  Creating submissions...')
  let totalSubmissions = 0

  for (const project of projects) {
    const subject = subjects.find(s => s._id.toString() === project.subject.toString())
    if (!subject) continue

    const enrolledStudents = subject.students || []
    if (!enrolledStudents.length) continue

    // 70–90% of enrolled students submit
    const submitCount  = Math.round(enrolledStudents.length * (rInt(70, 90) / 100))
    const submitters   = shuffle(enrolledStudents).slice(0, submitCount)

    // 60% of submitters are graded, rest just submitted
    const gradedCount  = Math.round(submitters.length * (rInt(55, 75) / 100))

    for (let i = 0; i < submitters.length; i++) {
      const studentId = submitters[i]
      const isGraded  = i < gradedCount
      const isLate    = Math.random() < 0.12  // 12% late rate
      const daysBack  = rInt(1, 20)

      // Grade: realistic bell-curve-ish distribution
      let grade = null
      if (isGraded) {
        const base  = rInt(55, 95)
        const bonus = Math.random() < 0.15 ? rInt(3, 5) : 0
        grade = Math.min(base + bonus, project.maxScore)
      }

      await Submission.create({
        project:      project._id,
        student:      studentId,
        textResponse: pick(TEXT_RESPONSES),
        fileUrl:      Math.random() > 0.4
          ? pick(UPLOADTHING_FILES.pdf).url
          : '',
        submittedAt:  daysAgo(daysBack),
        isLate,
        grade:        isGraded ? grade : undefined,
        feedback:     isGraded ? pick(FEEDBACKS) : '',
        gradeVisible: false,   // ← grades hidden from students by default
        status:       isGraded ? 'graded' : 'submitted',
      })
      totalSubmissions++
    }

    process.stdout.write(`   ✓ ${project.title.substring(0, 50).padEnd(52)} ${submitters.length} submissions\n`)
  }

  // ── 2. ANNOUNCEMENTS ─────────────────────────────────────────────────────
  console.log('\n📢  Creating announcements...')
  let totalAnn = 0

  for (const ann of ANNOUNCEMENT_DATA) {
    let authorId
    if (ann.authorRole === 'admin') {
      authorId = admin._id
    } else {
      authorId = teacherByIdx[ann.teacherIdx]?._id ?? teachers[0]._id
    }

    let subjectId = null
    if (ann.scope === 'subject' && ann.subjectCode) {
      subjectId = subjectByCode[ann.subjectCode]?._id ?? null
    }

    const created = await Announcement.create({
      title:    ann.title,
      content:  ann.content,
      author:   authorId,
      scope:    ann.scope,
      subject:  subjectId,
      isPinned: ann.isPinned,
      readBy:   [],
    })

    // Backdate to match daysAgo
    await Announcement.findByIdAndUpdate(created._id, {
      createdAt: daysAgo(ann.daysAgo),
      updatedAt: daysAgo(ann.daysAgo),
    })

    totalAnn++
    console.log(`   ✓ [${ann.scope.toUpperCase().padEnd(7)}] ${ann.title.substring(0, 60)}`)
  }

  // ── 3. MATERIALS ─────────────────────────────────────────────────────────
  console.log('\n📎  Creating materials...')
  let totalMaterials = 0

  for (const [code, materials] of Object.entries(MATERIALS_BY_SUBJECT)) {
    const subject = subjectByCode[code]
    if (!subject) { console.log(`   ⚠️  Subject ${code} not found, skipping`); continue }

    const teacher = subject.teacher

    for (const m of materials) {
      const fileUrl = m.type === 'link' || m.type === 'video'
        ? null
        : m.file.url

      const linkUrl = m.type === 'link' || m.type === 'video'
        ? m.file.url
        : null

      await Material.create({
        subject:    subject._id,
        title:      m.title,
        type:       m.type,
        url:        m.file.url,         // primary url (backward compat)
        fileUrl,                        // uploadthing file (null for links)
        linkUrl,                        // external url (null for files)
        topic:      m.topic,
        uploadedBy: teacher?._id ?? teachers[0]._id,
        viewedBy:   [],
      })
      totalMaterials++
    }
    console.log(`   ✓ ${code.padEnd(10)} ${materials.length} material(s)`)
  }

  // ── 4. REPORTS ───────────────────────────────────────────────────────────
  console.log('\n📊  Creating monthly reports...')

  // Teachers who have subjects assigned
  const REPORT_TEACHERS = [
    { idx: 0,  codes: ['BM101'],           name: 'Norhayati Ramli',      email: 'norhayati.ramli.01@studysync.edu.my' },
    { idx: 1,  codes: ['ENG101'],          name: 'Ahmad Nazri Hashim',   email: 'ahmad.nazri.hashim.02@studysync.edu.my' },
    { idx: 3,  codes: ['MATH101','AMATH101'], name: 'Shahrul Nizam Isa', email: 'shahrul.nizam.isa.04@studysync.edu.my' },
    { idx: 4,  codes: ['SCI101','BIO101'], name: 'Fauziah Yusuf',        email: 'fauziah.yusuf.05@studysync.edu.my' },
    { idx: 5,  codes: ['PHY101','CHEM101'],name: 'Lim Choon Hock',       email: 'lim.choon.hock.06@studysync.edu.my' },
    { idx: 9,  codes: ['CS101'],           name: 'Hafizudin Kamal',      email: 'hafizudin.kamal.10@studysync.edu.my' },
  ]

  // Current month = February 2026 (month=2), also do January (month=1)
  const REPORT_PERIODS = [
    { month: 1, year: 2026, status: 'submitted' },
    { month: 2, year: 2026, status: 'submitted' },
  ]

  let totalReports = 0

  for (const rt of REPORT_TEACHERS) {
    const teacher = teacherByIdx[rt.idx]
    if (!teacher) continue

    for (const period of REPORT_PERIODS) {
      // Build subject snapshot
      const subjSnapshots = []
      let totalStudentsAll = 0
      let totalProjectsAll = 0
      let totalSubAll      = 0
      let totalGradedAll   = 0
      let totalLateAll     = 0
      let gradeSum         = 0
      let gradeCount       = 0

      for (const code of rt.codes) {
        const subj     = subjectByCode[code]
        if (!subj) continue
        const subjProj = projects.filter(p => p.subject.toString() === subj._id.toString())

        const projSnapshots = []
        for (const proj of subjProj) {
          const subs       = await Submission.find({ project: proj._id }).lean()
          const submitted  = subs.filter(s => s.status !== 'pending')
          const graded     = subs.filter(s => s.status === 'graded')
          const late       = subs.filter(s => s.isLate)
          const grades     = graded.map(s => s.grade ?? 0)
          const avg        = grades.length ? Math.round(grades.reduce((a,b) => a+b,0) / grades.length) : null
          const highest    = grades.length ? Math.max(...grades) : null
          const lowest     = grades.length ? Math.min(...grades) : null

          totalSubAll   += submitted.length
          totalGradedAll+= graded.length
          totalLateAll  += late.length
          if (avg !== null) { gradeSum += avg; gradeCount++ }

          projSnapshots.push({
            projectId:    proj._id.toString(),
            title:        proj.title,
            deadline:     proj.deadline.toISOString(),
            maxScore:     proj.maxScore,
            status:       proj.status,
            totalStudents:subj.students.length,
            submitted:    submitted.length,
            graded:       graded.length,
            late:         late.length,
            avgGrade:     avg,
            highestGrade: highest,
            lowestGrade:  lowest,
          })
          totalProjectsAll++
        }

        totalStudentsAll += subj.students.length
        subjSnapshots.push({
          subjectId:    subj._id.toString(),
          name:         subj.name,
          code:         subj.code,
          studentCount: subj.students.length,
          projects:     projSnapshots,
        })
      }

      const avgGrade = gradeCount > 0 ? Math.round(gradeSum / gradeCount) : null

      const REMARKS = [
        `Overall a productive month for ${rt.codes.join(' and ')}. Student engagement has been high and submission rates are satisfactory. A few students struggled with late submissions which will be addressed in the coming weeks.`,
        `This month focused on consolidating foundational concepts. The majority of students performed well in their project submissions. I have provided detailed feedback to support weaker students.`,
        `Good progress this month. Students have responded positively to the new project structure. I plan to introduce more collaborative tasks next month to further improve engagement.`,
        `A challenging but rewarding month. Project deadlines were tight but students rose to the occasion. Graded work shows clear improvement from last semester's results.`,
      ]

      await Report.create({
        teacher:      teacher._id,
        month:        period.month,
        year:         period.year,
        status:       period.status,
        submittedAt:  period.status === 'submitted' ? daysAgo(rInt(1, 5)) : undefined,
        teacherName:  rt.name,
        teacherEmail: rt.email,
        summary: {
          totalSubjects:    rt.codes.length,
          totalStudents:    totalStudentsAll,
          totalProjects:    totalProjectsAll,
          approvedProjects: totalProjectsAll,
          totalSubmissions: totalSubAll,
          gradedSubmissions:totalGradedAll,
          lateSubmissions:  totalLateAll,
          avgGrade,
        },
        subjects: subjSnapshots,
        remarks:  pick(REMARKS),
      })

      totalReports++
      console.log(`   ✓ ${rt.name.padEnd(25)} ${period.month}/${period.year} [${period.status}]`)
    }
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(65))
  console.log('  ✅  SEED #2 COMPLETE')
  console.log('═'.repeat(65))
  console.log(`\n  📤 Submissions   : ${totalSubmissions}`)
  console.log(`  📢 Announcements : ${totalAnn}`)
  console.log(`  📎 Materials     : ${totalMaterials}`)
  console.log(`  📊 Reports       : ${totalReports}`)
  console.log('\n  ⚠️  Note: All grades are hidden from students (gradeVisible: false)')
  console.log('      Teachers/admins can toggle visibility per submission.')
  console.log('═'.repeat(65) + '\n')

  await mongoose.disconnect()
}

seed().catch(err => {
  console.error('\n❌  Seed failed:', err.message)
  process.exit(1)
})