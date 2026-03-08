// @ts-nocheck
/**
 * StudySync — Complete Seed Script (v3)
 * ──────────────────────────────────────
 * Seeds everything in one run:
 *   1. Drops ALL existing collections (clean slate)
 *   2. Users       — 1 admin · 3 teachers · 50 students
 *   3. Subjects    — Accounting · Computer Science · Visual Art (SPM)
 *   4. Projects    — 1 main + 2 sub per subject (9 total, pre-approved)
 *   5. Materials   — 8–9 per subject
 *   6. Announcements — global (admin) + subject-level (teachers)
 *   7. Submissions — submitted / late / graded with feedback
 *   8. Reports     — monthly reports for each teacher (Jan + Feb 2026)
 *
 * Usage:
 *   npx ts-node scripts/seed.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

/* ═══════════════════════════════════════════════════════════════
   SCHEMAS
═══════════════════════════════════════════════════════════════ */

const UserSchema = new mongoose.Schema({
  name:        { type: String,  required: true },
  email:       { type: String,  required: true, unique: true, lowercase: true },
  password:    { type: String,  required: true },
  role:        { type: String,  enum: ['admin','teacher','student'], required: true },
  isActive:    { type: Boolean, default: true },
  avatarUrl:   { type: String,  default: null },
  lastLoginAt: { type: Date,    default: null },
}, { timestamps: true })

const SubjectSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  code:          { type: String, required: true, unique: true },
  description:   { type: String },
  teacher:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  students:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  materialCount: { type: Number, default: 0 },
}, { timestamps: true })

const ProjectSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  subject:     { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacher:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  deadline:    { type: Date,   required: true },
  maxScore:    { type: Number, default: 100 },
  status:      { type: String, enum: ['pending','approved','rejected'], default: 'approved' },
  adminNote:   { type: String, default: '' },
  fileUrl:     { type: String, default: null },
  fileName:    { type: String, default: null },
}, { timestamps: true })

const MaterialSchema = new mongoose.Schema({
  title:   { type: String, required: true },
  type:    { type: String, default: 'link' },
  url:     { type: String, default: '' },
  fileUrl: { type: String, default: null },
  linkUrl: { type: String, default: null },
  topic:   { type: String, default: 'General' },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

const SubmissionSchema = new mongoose.Schema({
  project:      { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  student:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  fileUrl:      { type: String,  default: '' },
  textResponse: { type: String,  default: '' },
  submittedAt:  Date,
  isLate:       { type: Boolean, default: false },
  grade:        Number,
  feedback:     { type: String,  default: '' },
  gradeVisible: { type: Boolean, default: false },
  status:       { type: String,  enum: ['pending','submitted','graded'], default: 'pending' },
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

const UserModel         = mongoose.models.User         || mongoose.model('User',         UserSchema)
const SubjectModel      = mongoose.models.Subject      || mongoose.model('Subject',      SubjectSchema)
const ProjectModel      = mongoose.models.Project      || mongoose.model('Project',      ProjectSchema)
const MaterialModel     = mongoose.models.Material     || mongoose.model('Material',     MaterialSchema)
const SubmissionModel   = mongoose.models.Submission   || mongoose.model('Submission',   SubmissionSchema)
const AnnouncementModel = mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema)
const ReportModel       = mongoose.models.Report       || mongoose.model('Report',       ReportSchema)

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */

function rInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min }
function pick<T>(arr: T[]): T      { return arr[Math.floor(Math.random() * arr.length)] }
function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }
function daysAgo(n: number): Date  { const d = new Date(); d.setDate(d.getDate() - n); return d }
function daysFromNow(n: number): Date { const d = new Date(); d.setDate(d.getDate() + n); return d }

/* ═══════════════════════════════════════════════════════════════
   CREDENTIALS
═══════════════════════════════════════════════════════════════ */

const ADMIN = { name: 'System Administrator', email: 'admin@studysync.edu.my', password: 'Admin@2025' }

const TEACHERS = [
  { name: 'Norhayati Ramli',    email: 'norhayati.ramli.01@studysync.edu.my',    password: 'Teacher@001', subjectKey: 'ACC' },
  { name: 'Ahmad Nazri Hashim', email: 'ahmad.nazri.hashim.02@studysync.edu.my', password: 'Teacher@002', subjectKey: 'CS'  },
  { name: 'Roslinda Zainol',    email: 'roslinda.zainol.03@studysync.edu.my',     password: 'Teacher@003', subjectKey: 'ART' },
]

const STUDENTS = [
  { name: 'Ahmad Faris Zulkifli',    email: 'ahmad.faris.zulkifli.01@studysync.edu.my',    password: 'Student@001' },
  { name: 'Nur Aisyah Hamdan',       email: 'nur.aisyah.hamdan.02@studysync.edu.my',        password: 'Student@002' },
  { name: 'Muhammad Haziq Roslan',   email: 'muhammad.haziq.roslan.03@studysync.edu.my',    password: 'Student@003' },
  { name: 'Siti Fatimah Azhari',     email: 'siti.fatimah.azhari.04@studysync.edu.my',      password: 'Student@004' },
  { name: 'Mohd Irfan Zakaria',      email: 'mohd.irfan.zakaria.05@studysync.edu.my',       password: 'Student@005' },
  { name: 'Nurul Ain Khalid',        email: 'nurul.ain.khalid.06@studysync.edu.my',         password: 'Student@006' },
  { name: 'Amirul Hafiz Nordin',     email: 'amirul.hafiz.nordin.07@studysync.edu.my',      password: 'Student@007' },
  { name: 'Farah Nabilah Ismail',    email: 'farah.nabilah.ismail.08@studysync.edu.my',     password: 'Student@008' },
  { name: 'Izzatul Husna Jamal',     email: 'izzatul.husna.jamal.09@studysync.edu.my',      password: 'Student@009' },
  { name: 'Hafizuddin Mansor',       email: 'hafizuddin.mansor.10@studysync.edu.my',        password: 'Student@010' },
  { name: 'Nurul Izzati Razali',     email: 'nurul.izzati.razali.11@studysync.edu.my',      password: 'Student@011' },
  { name: 'Ridhwan Salleh',          email: 'ridhwan.salleh.12@studysync.edu.my',           password: 'Student@012' },
  { name: 'Syafiqah Othman',         email: 'syafiqah.othman.13@studysync.edu.my',          password: 'Student@013' },
  { name: 'Zulhilmi Wahab',          email: 'zulhilmi.wahab.14@studysync.edu.my',           password: 'Student@014' },
  { name: 'Nabilah Ramli',           email: 'nabilah.ramli.15@studysync.edu.my',            password: 'Student@015' },
  { name: 'Arif Imran Zainudin',     email: 'arif.imran.zainudin.16@studysync.edu.my',      password: 'Student@016' },
  { name: 'Nur Hidayah Azman',       email: 'nur.hidayah.azman.17@studysync.edu.my',        password: 'Student@017' },
  { name: 'Luqmanul Hakim Daud',     email: 'luqmanul.hakim.daud.18@studysync.edu.my',      password: 'Student@018' },
  { name: 'Farhana Mokhtar',         email: 'farhana.mokhtar.19@studysync.edu.my',          password: 'Student@019' },
  { name: 'Syahmi Abdul Razak',      email: 'syahmi.abdul.razak.20@studysync.edu.my',       password: 'Student@020' },
  { name: 'Lim Wei Xian',            email: 'lim.wei.xian.21@studysync.edu.my',             password: 'Student@021' },
  { name: 'Tan Shu Ying',            email: 'tan.shu.ying.22@studysync.edu.my',             password: 'Student@022' },
  { name: 'Chong Jun Hao',           email: 'chong.jun.hao.23@studysync.edu.my',            password: 'Student@023' },
  { name: 'Wong Mei Ling',           email: 'wong.mei.ling.24@studysync.edu.my',            password: 'Student@024' },
  { name: 'Ng Zhi Yang',             email: 'ng.zhi.yang.25@studysync.edu.my',              password: 'Student@025' },
  { name: 'Lee Hui Shan',            email: 'lee.hui.shan.26@studysync.edu.my',             password: 'Student@026' },
  { name: 'Goh Kah Wei',             email: 'goh.kah.wei.27@studysync.edu.my',              password: 'Student@027' },
  { name: 'Yap Jia Xuan',            email: 'yap.jia.xuan.28@studysync.edu.my',             password: 'Student@028' },
  { name: 'Ong Boon Keat',           email: 'ong.boon.keat.29@studysync.edu.my',            password: 'Student@029' },
  { name: 'Khor Sze Lin',            email: 'khor.sze.lin.30@studysync.edu.my',             password: 'Student@030' },
  { name: 'Teh Chee Wai',            email: 'teh.chee.wai.31@studysync.edu.my',             password: 'Student@031' },
  { name: 'Loh Pei Ying',            email: 'loh.pei.ying.32@studysync.edu.my',             password: 'Student@032' },
  { name: 'Cheah Weng Hong',         email: 'cheah.weng.hong.33@studysync.edu.my',          password: 'Student@033' },
  { name: 'Soo Kai Xin',             email: 'soo.kai.xin.34@studysync.edu.my',              password: 'Student@034' },
  { name: 'Leong Yoke Fong',         email: 'leong.yoke.fong.35@studysync.edu.my',          password: 'Student@035' },
  { name: 'Chan Jing Yi',            email: 'chan.jing.yi.36@studysync.edu.my',              password: 'Student@036' },
  { name: 'Ooi Zi Xuan',             email: 'ooi.zi.xuan.37@studysync.edu.my',              password: 'Student@037' },
  { name: 'Phua Cheng Han',          email: 'phua.cheng.han.38@studysync.edu.my',           password: 'Student@038' },
  { name: 'Quek Mei Yee',            email: 'quek.mei.yee.39@studysync.edu.my',             password: 'Student@039' },
  { name: 'Sim Rui Qi',              email: 'sim.rui.qi.40@studysync.edu.my',               password: 'Student@040' },
  { name: 'Aravind Kumar Krishnan',  email: 'aravind.kumar.krishnan.41@studysync.edu.my',   password: 'Student@041' },
  { name: 'Priya Devi Subramaniam',  email: 'priya.devi.subramaniam.42@studysync.edu.my',   password: 'Student@042' },
  { name: 'Rajan Pillai Chandran',   email: 'rajan.pillai.chandran.43@studysync.edu.my',    password: 'Student@043' },
  { name: 'Lavanya Muthu Krishnan',  email: 'lavanya.muthu.krishnan.44@studysync.edu.my',   password: 'Student@044' },
  { name: 'Vikram Raja Gopal',       email: 'vikram.raja.gopal.45@studysync.edu.my',        password: 'Student@045' },
  { name: 'Nithya Selvam',           email: 'nithya.selvam.46@studysync.edu.my',            password: 'Student@046' },
  { name: 'Dinesh Kumar Raj',        email: 'dinesh.kumar.raj.47@studysync.edu.my',         password: 'Student@047' },
  { name: 'Kavitha Rajan',           email: 'kavitha.rajan.48@studysync.edu.my',            password: 'Student@048' },
  { name: 'Suresh Nadarajan',        email: 'suresh.nadarajan.49@studysync.edu.my',         password: 'Student@049' },
  { name: 'Malathi Velayutham',      email: 'malathi.velayutham.50@studysync.edu.my',       password: 'Student@050' },
]

/* ═══════════════════════════════════════════════════════════════
   SUBJECT DEFINITIONS
   Enrollment:
     ACC  → students index  0–34  (35 students)
     CS   → students index 10–44  (35 students)
     ART  → students index 20–49  (30 students)
═══════════════════════════════════════════════════════════════ */

const SUBJECTS_DATA = [
  {
    key: 'ACC', name: 'Accounting', code: 'ACC101',
    description: 'SPM Accounting covers double-entry bookkeeping, preparation of final accounts, bank reconciliation, and financial statement analysis for sole proprietorships and partnerships.',
    studentRange: [0, 34] as [number, number],
    projects: [
      {
        title: 'Final Accounts Preparation — Sole Proprietorship',
        description: 'Prepare a complete set of final accounts (Trading Account, Profit & Loss Account, and Balance Sheet) for a sole proprietorship business from the given Trial Balance. Show all workings, apply correct accounting treatments for adjustments (accruals, prepayments, depreciation, bad debts), and present neatly formatted financial statements.',
        deadline: daysFromNow(30), maxScore: 100, isMain: true,
      },
      {
        title: 'Bank Reconciliation Statement',
        description: 'Given a bank statement and cash book extract, identify all discrepancies (unpresented cheques, uncredited deposits, bank charges, errors). Prepare the updated cash book and produce a Bank Reconciliation Statement as at the given date. Include a written explanation for each adjusting item.',
        deadline: daysFromNow(14), maxScore: 50, isMain: false,
      },
      {
        title: 'Trial Balance & Error Correction',
        description: 'From the list of ledger balances provided, extract and balance a Trial Balance. Identify and explain the five types of errors not revealed by a Trial Balance. Write corrective journal entries for each error found in the given scenario and show the effect on profit using a Statement of Corrected Profit.',
        deadline: daysFromNow(21), maxScore: 50, isMain: false,
      },
    ],
    materials: [
      { title: 'Introduction to Double-Entry Bookkeeping',               type: 'link',  topic: 'Chapter 1 — Foundations',         linkUrl: 'https://www.accountingcoach.com/debits-and-credits/explanation' },
      { title: 'The Accounting Equation — Assets, Liabilities & Equity', type: 'link',  topic: 'Chapter 1 — Foundations',         linkUrl: 'https://www.accountingcoach.com/accounting-equation/explanation' },
      { title: 'Journal Entries — Step-by-Step Guide',                   type: 'link',  topic: 'Chapter 2 — Journals & Ledger',   linkUrl: 'https://corporatefinanceinstitute.com/resources/accounting/journal-entries-guide/' },
      { title: 'Ledger Accounts & Balancing Off (Video)',                 type: 'video', topic: 'Chapter 2 — Journals & Ledger',   linkUrl: 'https://www.youtube.com/watch?v=G_CjzYnMVnQ' },
      { title: 'Trial Balance Preparation Tutorial (Video)',              type: 'video', topic: 'Chapter 3 — Trial Balance',       linkUrl: 'https://www.youtube.com/watch?v=pGMNEpiO8TE' },
      { title: 'Trading & Profit/Loss Account Explained',                 type: 'link',  topic: 'Chapter 4 — Final Accounts',      linkUrl: 'https://www.accountingcoach.com/income-statement/explanation' },
      { title: 'Balance Sheet — Format & Components',                     type: 'link',  topic: 'Chapter 4 — Final Accounts',      linkUrl: 'https://www.investopedia.com/terms/b/balancesheet.asp' },
      { title: 'Bank Reconciliation Statement Walkthrough (Video)',       type: 'video', topic: 'Chapter 5 — Bank Reconciliation', linkUrl: 'https://www.youtube.com/watch?v=WaW8OBjVVPE' },
      { title: 'Accounting Adjustments — Accruals & Prepayments',        type: 'link',  topic: 'Chapter 4 — Final Accounts',      linkUrl: 'https://www.bbc.co.uk/bitesize/guides/z9kqhbk/revision/1' },
    ],
  },
  {
    key: 'CS', name: 'Computer Science', code: 'CS102',
    description: 'SPM Computer Science covers computational thinking, algorithm design, Python programming, database fundamentals, networking concepts, and cybersecurity awareness.',
    studentRange: [10, 44] as [number, number],
    projects: [
      {
        title: 'Python Console Application — Student Grade Manager',
        description: "Design and build a Python console application allowing a teacher to: add students, record grades per subject, calculate averages, display a ranked leaderboard, and save/load data using text files. Use functions, lists/dictionaries, loops, conditional statements, and file I/O. Submit your .py source file plus a 1-page design report.",
        deadline: daysFromNow(35), maxScore: 100, isMain: true,
      },
      {
        title: 'Algorithm Design & Flowchart',
        description: 'Choose one real-world problem. Write the algorithm in structured pseudocode, draw a detailed flowchart using standard symbols, perform a dry-run trace table with at least 3 test cases, and evaluate your algorithm for correctness and efficiency.',
        deadline: daysFromNow(14), maxScore: 50, isMain: false,
      },
      {
        title: 'Relational Database Design with SQL',
        description: 'Design a relational database for a school library system (minimum 3 related tables). Draw an ER diagram, write CREATE TABLE SQL with constraints, and write 5 SELECT queries demonstrating JOIN, WHERE, ORDER BY, GROUP BY, and an aggregate function. Submit as a .sql file with comments.',
        deadline: daysFromNow(21), maxScore: 50, isMain: false,
      },
    ],
    materials: [
      { title: 'Computational Thinking — The Four Pillars',           type: 'link',  topic: 'Chapter 1 — Foundations',    linkUrl: 'https://www.bbc.co.uk/bitesize/guides/zp92mp3/revision/1' },
      { title: 'Python for Beginners — Official Tutorial',            type: 'link',  topic: 'Chapter 2 — Python Basics',  linkUrl: 'https://docs.python.org/3/tutorial/index.html' },
      { title: 'Variables, Data Types & Operators in Python (Video)', type: 'video', topic: 'Chapter 2 — Python Basics',  linkUrl: 'https://www.youtube.com/watch?v=kqtD5dpn9C8' },
      { title: 'Control Structures — if, while & for Loops',          type: 'link',  topic: 'Chapter 3 — Control Flow',   linkUrl: 'https://realpython.com/python-conditional-statements/' },
      { title: 'Functions & Modular Programming in Python',           type: 'link',  topic: 'Chapter 3 — Control Flow',   linkUrl: 'https://realpython.com/defining-your-own-python-function/' },
      { title: 'Introduction to SQL — W3Schools',                     type: 'link',  topic: 'Chapter 4 — Databases',      linkUrl: 'https://www.w3schools.com/sql/sql_intro.asp' },
      { title: 'How to Draw an ER Diagram (Video)',                   type: 'video', topic: 'Chapter 4 — Databases',      linkUrl: 'https://www.youtube.com/watch?v=QpdhBUYk7Kk' },
      { title: 'OSI Model & Networking Basics',                       type: 'link',  topic: 'Chapter 5 — Networks',       linkUrl: 'https://www.cloudflare.com/en-gb/learning/ddos/glossary/open-systems-interconnection-model-osi/' },
      { title: 'Cybersecurity Fundamentals',                          type: 'link',  topic: 'Chapter 6 — Cybersecurity',  linkUrl: 'https://www.kaspersky.com/resource-center/definitions/what-is-cyber-security' },
    ],
  },
  {
    key: 'ART', name: 'Visual Art', code: 'ART103',
    description: 'SPM Visual Art develops students in drawing, painting, printmaking, and crafts rooted in Malaysian cultural context. Students explore the elements and principles of design to create original artworks and build a personal folio.',
    studentRange: [20, 49] as [number, number],
    projects: [
      {
        title: 'Personal Folio — Malaysian Cultural Identity',
        description: 'Produce a folio of 6 original artworks (minimum A3 size) exploring the theme of Malaysian Cultural Identity. At least one piece must use each of: pencil/charcoal, watercolour or gouache, and one mixed media work. Include a written artist statement (min. 300 words), process sketches for each piece, and work-in-progress photos.',
        deadline: daysFromNow(42), maxScore: 100, isMain: true,
      },
      {
        title: 'Perspective Drawing — Interior Space Study',
        description: 'Produce two perspective drawings of an interior space: one using one-point perspective and one using two-point perspective. Each must include at least 5 pieces of furniture/objects, rendered in pencil with ink line work. Label the horizon line, vanishing point(s), and picture plane on each drawing.',
        deadline: daysFromNow(14), maxScore: 50, isMain: false,
      },
      {
        title: 'Colour Theory — Mixed Media Studies',
        description: 'Create a series of 4 colour studies (min. A4 each) demonstrating: (1) colour wheel with tints & shades, (2) analogous colour harmony, (3) complementary colour contrast, (4) monochromatic composition. Each must include a written explanation (min. 100 words) justifying your colour choices and technique.',
        deadline: daysFromNow(21), maxScore: 50, isMain: false,
      },
    ],
    materials: [
      { title: 'Elements of Art — Line, Shape, Form, Texture, Value, Space', type: 'link',  topic: 'Chapter 1 — Elements of Art',   linkUrl: 'https://www.khanacademy.org/humanities/art-history-basics/tools-art-history/a/formal-analysis' },
      { title: 'Principles of Design — Balance, Contrast, Rhythm',           type: 'link',  topic: 'Chapter 2 — Principles',         linkUrl: 'https://www.getty.edu/education/teachers/building_lessons/principles_design.pdf' },
      { title: 'Pencil Drawing Techniques for Beginners (Video)',             type: 'video', topic: 'Chapter 3 — Drawing',            linkUrl: 'https://www.youtube.com/watch?v=7GeMSNHMDO4' },
      { title: 'Understanding Colour Theory',                                 type: 'link',  topic: 'Chapter 4 — Colour',             linkUrl: 'https://www.colormatters.com/color-and-design/basic-color-theory' },
      { title: 'Watercolour Techniques Step by Step (Video)',                 type: 'video', topic: 'Chapter 4 — Colour',             linkUrl: 'https://www.youtube.com/watch?v=nMqjRJxSEU0' },
      { title: 'One-Point & Two-Point Perspective Drawing Guide',             type: 'link',  topic: 'Chapter 5 — Perspective',        linkUrl: 'https://www.artistsnetwork.com/art-techniques/perspective-drawing/' },
      { title: 'Malaysian Contemporary Art — National Gallery Overview',      type: 'link',  topic: 'Chapter 6 — Malaysian Context',  linkUrl: 'https://www.nationalgallery.org.my/collections' },
      { title: 'Building a Strong Art Portfolio — 7 Tips',                   type: 'link',  topic: 'Chapter 7 — Folio',              linkUrl: 'https://artofed.com/art-ed-now/curriculum/7-tips-for-student-art-portfolios/' },
    ],
  },
]

/* ═══════════════════════════════════════════════════════════════
   SUBMISSION CONTENT POOLS
═══════════════════════════════════════════════════════════════ */

const TEXT_RESPONSES = [
  'I have completed all required tasks as outlined in the project brief. My approach focused on understanding the core concepts before applying them. I referenced the textbook chapters and cross-checked my answers with reliable online sources.',
  'This project helped me understand the topic much better. I started by researching the background, then drafted my response based on what we learned in class. I followed the formatting guidelines throughout.',
  'My submission includes all required components. I worked through each section systematically, ensuring accuracy in calculations and clarity in my written explanations.',
  'After reviewing the project requirements carefully, I structured my response to address each criterion. I spent extra time on the analysis section to make sure my reasoning was clear and well-supported.',
  'I completed this submission to the best of my ability. Some parts were challenging but I consulted reference materials and class notes to address everything asked. Please refer to the attached file for diagrams.',
  'This assignment required applying theoretical knowledge to a practical scenario. I enjoyed the research process and feel I have grown my understanding of the subject significantly.',
  'I have submitted all required parts of this assignment. For the analytical sections, I used the framework discussed in class. My responses are original and I have cited my sources.',
  'Working on this project was a rewarding experience. I applied the concepts from our lessons and tried to go beyond the basic requirements by including additional examples and explanations.',
  'I completed the assignment as instructed with a focus on accuracy and clarity. I double-checked all numerical answers and proofread my written sections before submitting.',
  'I structured my submission by first outlining the key points, then expanding each one with evidence from class notes and the prescribed textbook. I also included real-life examples where applicable.',
]

const FEEDBACKS = [
  'Excellent work! Your analysis was thorough and well-structured. The examples you provided were relevant and clearly supported your arguments. Keep up this standard.',
  'Good effort overall. Your understanding of the core concepts is evident. However, the conclusion section could be more detailed — try to summarise your key findings more explicitly next time.',
  'A solid submission. You demonstrated a clear grasp of the topic. Some minor calculation errors but the methodology was correct. Well done.',
  'Very well done. The quality of your written explanation was impressive. Your diagrams were clearly labelled and your reasoning was logical throughout.',
  'Satisfactory work. You covered the main points but lacked depth in the analysis section. Elaborate more on your reasoning in future assignments.',
  'Great improvement from your previous submission! Structure was much clearer and use of examples was excellent. Minor grammar issues but overall a strong piece of work.',
  'Outstanding submission. Every section was answered completely and correctly. Your presentation was neat and professional — an exemplary piece of work.',
  'Decent attempt. The introduction was strong but the body paragraphs needed more evidence to support your claims. Revisit the class notes on this topic.',
  'Well done! Your problem-solving approach was methodical and easy to follow. Final answers were accurate and you showed your working clearly.',
  'Good work overall. A few points were not fully developed but the core understanding is there. Focus on adding more specific examples and citations next time.',
  'Commendable effort. You tackled a complex topic with confidence. Structure was logical and writing was fluent. Be more consistent with your referencing style.',
  'This submission shows real effort and understanding. Your creative approach to the problem was refreshing. Some sections could be expanded but the foundation is strong.',
]

/* ═══════════════════════════════════════════════════════════════
   ANNOUNCEMENTS DATA
   authorKey: 'admin' | 'ACC' | 'CS' | 'ART'
═══════════════════════════════════════════════════════════════ */

const ANNOUNCEMENTS_DATA = [
  // ── Global / Admin ─────────────────────────────────────────
  {
    title: '📌 System Maintenance — Saturday 1 March 2026, 12:00 AM – 4:00 AM',
    content: `Dear StudySync users,\n\nPlease be informed that our system will undergo scheduled maintenance on Saturday, 1 March 2026 from 12:00 AM to 4:00 AM (MYT).\n\nDuring this period the platform will be temporarily unavailable. Please ensure all pending submissions are completed before the maintenance window.\n\nWe apologise for any inconvenience caused.\n\n— StudySync System Administration`,
    scope: 'global', isPinned: true, authorKey: 'admin', daysAgo: 3,
  },
  {
    title: '🎉 Welcome Back — New Semester Begins!',
    content: `Assalamualaikum and Good Day to all students and teachers,\n\nWe are pleased to welcome everyone back for the new academic semester. All subjects, projects and learning materials have been updated on the platform.\n\nStudents — please log in, check your enrolled subjects, review project deadlines, and download any new materials. Teachers — please ensure your subject details and project briefs are up to date by end of this week.\n\nWishing everyone a productive semester ahead!\n\n— School Administration`,
    scope: 'global', isPinned: true, authorKey: 'admin', daysAgo: 14,
  },
  {
    title: '📅 Public Holiday — Thaipusam (29 January 2026)',
    content: `Dear all,\n\nPlease be informed that 29 January 2026 (Thursday) is a public holiday in conjunction with Thaipusam.\n\nAll classes and school activities are cancelled on this day. Project deadlines that fall on this date will be automatically extended to the next school day.\n\nHave a safe holiday!\n\n— Administration Office`,
    scope: 'global', isPinned: false, authorKey: 'admin', daysAgo: 30,
  },
  {
    title: '🏆 Annual Sports Day — Registration Now Open',
    content: `Attention all students!\n\nRegistrations for the Annual School Sports Day 2026 are now open. This year's event will be held on 15 March 2026 at the school field.\n\nEvents: 100m Sprint · 4×100m Relay · Long Jump · Shot Put · Tug of War\n\nRegistration forms are available at the Student Affairs Office or through your class teacher. Deadline: 7 March 2026.\n\nLet's show our school spirit!\n\n— Sports & Co-curricular Department`,
    scope: 'global', isPinned: false, authorKey: 'admin', daysAgo: 5,
  },
  {
    title: '📝 Mid-Year Examination Schedule Released',
    content: `Dear students and parents,\n\nThe Mid-Year Examination schedule has been finalised. Examinations will be held from 15 April to 25 April 2026.\n\nKey reminders:\n• Bring your student ID on all exam days\n• No electronic devices permitted in the exam hall\n• Absent students must submit a valid MC within 3 working days\n• Results will be released within 3 weeks after the last paper\n\nAll the best!\n\n— Examination Unit`,
    scope: 'global', isPinned: true, authorKey: 'admin', daysAgo: 7,
  },
  {
    title: '💻 StudySync Platform Update — New Features Available',
    content: `Dear users,\n\nStudySync has been updated with several new features:\n\n✅ Notification Bell — Real-time alerts for approvals, grades and announcements\n✅ Monthly Reports — Teachers can generate and submit monthly performance reports\n✅ Improved Search — Find anything on the platform instantly\n✅ Better File Uploads — Materials can be uploaded as files or shared as links\n\nPlease explore the new features and share your feedback with the system administrator.\n\nHappy learning!\n\n— StudySync Development Team`,
    scope: 'global', isPinned: false, authorKey: 'admin', daysAgo: 2,
  },
  // ── Accounting ─────────────────────────────────────────────
  {
    title: '📋 Accounting — Final Accounts Project: Key Reminders',
    content: `Dear Accounting students,\n\nA reminder about the Final Accounts Preparation project:\n\n• Your Trial Balance MUST balance before you proceed to final accounts\n• Show ALL workings clearly — marks are awarded for method, not just final answers\n• Adjustments (accruals, prepayments, depreciation) must be shown in the workings section\n• Present your Trading Account, P&L Account and Balance Sheet on separate pages\n\nIf you are unsure about any adjustment, refer to Chapter 4 in your textbook or approach me during office hours (Monday & Wednesday, 2:00–3:30 PM).\n\nGood luck!\n\n— Cikgu Norhayati`,
    scope: 'subject', isPinned: true, authorKey: 'ACC', daysAgo: 5,
  },
  {
    title: '✅ Accounting — Bank Reconciliation Sub-Project Released',
    content: `Dear students,\n\nThe Bank Reconciliation sub-project has been released on the Projects page. Please review the requirements carefully.\n\nCommon mistakes to avoid:\n• Forgetting to update the Cash Book before preparing the BRS\n• Treating bank charges as unpresented cheques (they are Cash Book entries!)\n• Incorrect treatment of dishonoured cheques\n\nA worked example has been uploaded under Materials → Chapter 5. Please review it before starting.\n\nDeadline is in 2 weeks. Do not leave this to the last minute!\n\n— Cikgu Norhayati`,
    scope: 'subject', isPinned: false, authorKey: 'ACC', daysAgo: 10,
  },
  {
    title: '📅 Accounting — No Class This Friday (Replacement Announced)',
    content: `Dear Accounting class,\n\nThis Friday's Accounting class (7 March 2026) will be cancelled as I will be attending a subject panel meeting.\n\nReplacement class:\n• Date: Tuesday, 11 March 2026\n• Time: 1:00 PM – 2:30 PM\n• Room: Classroom 2B (usual room)\n\nAttendance is compulsory. We will be covering the Error Correction topic which is directly related to your upcoming sub-project. Please read pages 89–104 of your textbook beforehand.\n\n— Cikgu Norhayati`,
    scope: 'subject', isPinned: false, authorKey: 'ACC', daysAgo: 4,
  },
  // ── Computer Science ────────────────────────────────────────
  {
    title: '💻 Computer Science — Python Project Tips & Grading Rubric',
    content: `Dear CS students,\n\nHere are important tips for your Python Grade Manager project:\n\n1. Your program MUST handle invalid inputs (non-numeric grades, empty names)\n2. The search function should be case-insensitive\n3. Include a main menu loop — program stays running until user exits\n4. Add comments — at least one comment per function\n5. Test with at least 5 different students before submitting\n\nBonus marks for file save/load, input validation, and clean formatted output.\n\nThe grading rubric is available under Materials.\n\n— Cikgu Ahmad Nazri`,
    scope: 'subject', isPinned: true, authorKey: 'CS', daysAgo: 8,
  },
  {
    title: '🗃️ Computer Science — SQL Sub-Project: New Reference Materials',
    content: `Hello everyone,\n\nI have uploaded new materials for the SQL sub-project under Materials → Chapter 4:\n\n• SQL Quick Reference Card (PDF)\n• ER Diagram Tutorial Video\n• Sample Library Database Schema (for reference only — do not copy)\n\nYour database must be ORIGINAL. Submissions clearly copied from the sample schema will receive zero marks.\n\nOffice hours: Every Thursday 3:00–4:30 PM, Room C-08.\n\n— Cikgu Ahmad Nazri`,
    scope: 'subject', isPinned: false, authorKey: 'CS', daysAgo: 6,
  },
  {
    title: '🚨 Computer Science — Algorithm Project Deadline Extended',
    content: `Dear students,\n\nAfter reviewing progress during last week's class, I have decided to extend the Algorithm Design & Flowchart sub-project deadline by 5 days.\n\nNew deadline: Please check the updated deadline on the Projects page.\n\nThis extension is to give sufficient time to complete the trace table with 3 full test cases, which many students have not yet attempted. This section carries 20% of the marks.\n\nUse the extra time wisely — no further extensions will be given.\n\n— Cikgu Ahmad Nazri`,
    scope: 'subject', isPinned: false, authorKey: 'CS', daysAgo: 2,
  },
  // ── Visual Art ──────────────────────────────────────────────
  {
    title: '🎨 Visual Art — Personal Folio: Theme Confirmation & Checklist',
    content: `Dear Art students,\n\nYour Personal Folio theme (Malaysian Cultural Identity) has been confirmed. Here is what your folio must contain:\n\n☐ 6 original artworks (minimum A3 each)\n☐ At least 1 pencil/charcoal piece\n☐ At least 1 watercolour or gouache piece\n☐ At least 1 mixed media piece\n☐ Written artist statement (minimum 300 words)\n☐ Process sketches for each final artwork\n☐ Work-in-progress photos (minimum 2 per artwork)\n\nFolios submitted without process documentation will be penalised.\n\nConsultation: Every Tuesday 2:00–4:00 PM in the Art Room.\n\n— Cikgu Roslinda`,
    scope: 'subject', isPinned: true, authorKey: 'ART', daysAgo: 7,
  },
  {
    title: '🖍️ Visual Art — Colour Theory Project: Common Mistakes to Avoid',
    content: `Dear students,\n\nBefore submitting your Colour Theory studies, check for these common mistakes:\n\n❌ Colour wheel missing tertiary colours\n❌ Tints and shades not clearly differentiated\n❌ Analogous study using more than 3–5 adjacent colours\n❌ Written explanation too short or just describing what you see, not why you chose it\n❌ Studies not mounted or presented neatly\n\n✅ Your explanation should discuss the emotional effect of your chosen colours, why they suit the composition, and any challenges you faced.\n\n— Cikgu Roslinda`,
    scope: 'subject', isPinned: false, authorKey: 'ART', daysAgo: 9,
  },
  {
    title: '📅 Visual Art — Art Room Schedule & Hari Raya Holiday Notice',
    content: `Dear Art students,\n\nA few important updates:\n\n1. ART ROOM HOURS\n   Monday–Thursday: 3:30 PM – 5:30 PM\n   Saturday (selected weeks): 9:00 AM – 12:00 PM\n   Please sign the attendance register each time.\n\n2. HARI RAYA AIDILFITRI BREAK — School closes 28 March to 4 April 2026. Classes resume 7 April 2026. The folio deadline has been adjusted to account for this break.\n\n3. MATERIAL SUPPLIES — Basic supplies are on loan from school. Students needing acrylic, canvas or specialty paper must purchase their own.\n\nSelamat Hari Raya in advance to all celebrating!\n\n— Cikgu Roslinda`,
    scope: 'subject', isPinned: false, authorKey: 'ART', daysAgo: 12,
  },
]

/* ═══════════════════════════════════════════════════════════════
   REPORT REMARKS
═══════════════════════════════════════════════════════════════ */

const REPORT_REMARKS: Record<string, string[]> = {
  ACC: [
    'Overall a productive month for Accounting. Student engagement has been high and submission rates are satisfactory. A few students struggled with adjustments in final accounts — additional worked examples have been provided. Late submission rate slightly elevated this month; I will follow up individually with the affected students.',
    'Good progress this month. The majority of students performed well in the Bank Reconciliation sub-project. Detailed written feedback has been provided to all graded submissions. Plan to introduce peer-review sessions next month to further improve the quality of written explanations.',
  ],
  CS: [
    'A strong month for Computer Science. Students showed genuine enthusiasm for the Python project and the quality of submissions was generally above expectations. Several students implemented bonus features such as file I/O and input validation. The SQL sub-project proved more challenging — additional tutorial materials have been uploaded to support weaker students.',
    'Steady progress this month. The Algorithm Design project submissions revealed that a significant number of students still struggle with trace tables — a dedicated remedial session has been scheduled. Python project submissions were strong overall, with most students demonstrating solid understanding of functions and data structures.',
  ],
  ART: [
    'An exciting month for Visual Art. Students have been very engaged with the Malaysian Cultural Identity folio theme, producing some genuinely creative early sketches. The Colour Theory sub-project revealed gaps in understanding of colour harmony principles — a follow-up worksheet has been distributed. Art Room usage has been high and students are making good use of the extended hours.',
    "Good momentum this month. The Perspective Drawing sub-project was completed by most students to a satisfactory standard. Several students produced exceptional two-point perspective drawings. The folio project is progressing well — I have personally reviewed each student's theme proposal and process sketches. Looking forward to seeing final submissions next month.",
  ],
}

/* ═══════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════ */

async function seed() {
  const MONGO_URI = process.env.MONGODB_URI
  if (!MONGO_URI) {
    console.error('❌  MONGODB_URI not found in .env.local')
    process.exit(1)
  }

  console.log('\n' + '═'.repeat(65))
  console.log('  🌱  StudySync Complete Seed (v3)')
  console.log('═'.repeat(65))

  console.log('\n🔌  Connecting to MongoDB…')
  await mongoose.connect(MONGO_URI)
  console.log('✅  Connected.\n')

  // ── Drop all collections ────────────────────────────────────
  console.log('🗑   Dropping all existing collections…')
  const toDrop = ['users','subjects','projects','materials','submissions','announcements','notifications','reports','teacherreports']
  for (const col of toDrop) {
    try   { await mongoose.connection.collection(col).drop(); console.log(`    ✓ dropped  : ${col}`) }
    catch { console.log(`    – skipped  : ${col}`) }
  }

  const hashPw = (pw: string) => bcrypt.hash(pw, 12)

  // ── Admin ───────────────────────────────────────────────────
  console.log('\n🔑  Creating admin…')
  const adminDoc = await UserModel.create({ name: ADMIN.name, email: ADMIN.email, password: await hashPw(ADMIN.password), role: 'admin', isActive: true })
  console.log(`    ✓ ${adminDoc.name}`)

  // ── Teachers ────────────────────────────────────────────────
  console.log('\n🧑‍🏫  Creating 3 teachers…')
  const teacherDocs: Array<{ _id: any; subjectKey: string; name: string; email: string }> = []
  for (const t of TEACHERS) {
    const doc = await UserModel.create({ name: t.name, email: t.email, password: await hashPw(t.password), role: 'teacher', isActive: true })
    teacherDocs.push({ _id: doc._id, subjectKey: t.subjectKey, name: t.name, email: t.email })
    console.log(`    ✓ ${t.name}  →  ${t.subjectKey}`)
  }

  // ── Students ────────────────────────────────────────────────
  console.log('\n🎓  Creating 50 students…')
  const studentDocs: any[] = []
  for (const s of STUDENTS) {
    const doc = await UserModel.create({ name: s.name, email: s.email, password: await hashPw(s.password), role: 'student', isActive: true })
    studentDocs.push(doc)
  }
  console.log(`    ✓ ${studentDocs.length} students created`)

  // ── Subjects + Projects + Materials ─────────────────────────
  const subjectMap: Record<string, any>  = {}
  const projectsAll: any[] = []

  for (const sd of SUBJECTS_DATA) {
    const teacher  = teacherDocs.find(t => t.subjectKey === sd.key)!
    const [lo, hi] = sd.studentRange
    const enrolled = studentDocs.slice(lo, hi + 1)

    console.log(`\n📚  Subject: ${sd.name} (${sd.code}) — ${enrolled.length} students`)

    const subjectDoc = await SubjectModel.create({
      name: sd.name, code: sd.code, description: sd.description,
      teacher: teacher._id,
      students: enrolled.map((s: any) => s._id),
      materialCount: sd.materials.length,
    })
    subjectMap[sd.key] = subjectDoc

    console.log(`    Projects:`)
    for (const p of sd.projects) {
      const proj = await ProjectModel.create({
        title: p.title, description: p.description,
        subject: subjectDoc._id, teacher: teacher._id,
        deadline: p.deadline, maxScore: p.maxScore, status: 'approved',
      })
      projectsAll.push({ ...proj.toObject(), subjectKey: sd.key, enrolledStudents: enrolled })
      console.log(`      ✓ [${p.isMain ? 'MAIN' : 'sub '}] ${p.title.slice(0, 58)}`)
    }

    console.log(`    Materials: ${sd.materials.length} items`)
    for (const m of sd.materials) {
      await MaterialModel.create({
        title: m.title, type: m.type,
        url: m.linkUrl || '', linkUrl: m.linkUrl || null, fileUrl: null,
        topic: m.topic, subject: subjectDoc._id, teacher: teacher._id,
      })
    }
  }

  // ── Announcements ───────────────────────────────────────────
  console.log('\n📢  Creating announcements…')
  const authorMap: Record<string, any> = { admin: adminDoc._id }
  for (const t of teacherDocs) { authorMap[t.subjectKey] = t._id }

  for (const ann of ANNOUNCEMENTS_DATA) {
    const authorId  = authorMap[ann.authorKey] ?? adminDoc._id
    const subjectId = ann.scope === 'subject' ? subjectMap[ann.authorKey]?._id ?? null : null
    const created   = await AnnouncementModel.create({
      title: ann.title, content: ann.content,
      author: authorId, scope: ann.scope, subject: subjectId,
      isPinned: ann.isPinned, readBy: [],
    })
    await AnnouncementModel.findByIdAndUpdate(created._id, {
      createdAt: daysAgo(ann.daysAgo), updatedAt: daysAgo(ann.daysAgo),
    })
    console.log(`    ✓ [${ann.scope.padEnd(7)}] ${ann.title.slice(0, 60)}`)
  }

  // ── Submissions ─────────────────────────────────────────────
  console.log('\n📤  Creating submissions…')
  let subCount = 0

  for (const project of projectsAll) {
    const enrolled    = project.enrolledStudents as any[]
    const submitCount = Math.round(enrolled.length * (rInt(70, 88) / 100))
    const submitters  = shuffle(enrolled).slice(0, submitCount)
    const gradedCount = Math.round(submitters.length * (rInt(55, 75) / 100))

    for (let i = 0; i < submitters.length; i++) {
      const isGraded = i < gradedCount
      const isLate   = Math.random() < 0.12
      const grade    = isGraded ? Math.min(rInt(55, 95) + (Math.random() < 0.15 ? rInt(3, 5) : 0), project.maxScore) : undefined
      await SubmissionModel.create({
        project: project._id, student: submitters[i]._id,
        textResponse: pick(TEXT_RESPONSES),
        fileUrl: Math.random() > 0.4 ? `https://utfs.io/f/seed_file_${rInt(1000, 9999)}.pdf` : '',
        submittedAt: daysAgo(rInt(1, 20)),
        isLate, grade,
        feedback:     isGraded ? pick(FEEDBACKS) : '',
        gradeVisible: false,
        status:       isGraded ? 'graded' : 'submitted',
      })
      subCount++
    }
    console.log(`    ✓ ${project.title.slice(0, 52).padEnd(54)} ${submitters.length} submissions`)
  }

  // ── Monthly Reports (Jan + Feb 2026) ────────────────────────
  console.log('\n📊  Creating monthly reports…')
  const REPORT_PERIODS = [
    { month: 1, year: 2026, status: 'submitted' },
    { month: 2, year: 2026, status: 'submitted' },
  ]

  for (const teacher of teacherDocs) {
    const subjectDoc     = subjectMap[teacher.subjectKey]
    if (!subjectDoc) continue
    const subjectProjects = projectsAll.filter(p => p.subjectKey === teacher.subjectKey)

    for (const period of REPORT_PERIODS) {
      const projSnapshots: any[] = []
      let totalSubmitted = 0, totalGraded = 0, totalLate = 0, gradeSum = 0, gradeCount = 0

      for (const proj of subjectProjects) {
        const subs      = await SubmissionModel.find({ project: proj._id }).lean()
        const submitted = subs.filter((s: any) => s.status !== 'pending')
        const graded    = subs.filter((s: any) => s.status === 'graded')
        const late      = subs.filter((s: any) => s.isLate)
        const grades    = graded.map((s: any) => s.grade ?? 0)
        const avg       = grades.length ? Math.round(grades.reduce((a: number, b: number) => a + b, 0) / grades.length) : null
        totalSubmitted += submitted.length; totalGraded += graded.length; totalLate += late.length
        if (avg !== null) { gradeSum += avg; gradeCount++ }
        projSnapshots.push({
          projectId: proj._id.toString(), title: proj.title,
          deadline: proj.deadline, maxScore: proj.maxScore,
          totalStudents: subjectDoc.students.length,
          submitted: submitted.length, graded: graded.length, late: late.length,
          avgGrade: avg,
          highestGrade: grades.length ? Math.max(...grades) : null,
          lowestGrade:  grades.length ? Math.min(...grades) : null,
        })
      }

      const avgGrade    = gradeCount > 0 ? Math.round(gradeSum / gradeCount) : null
      const remarksPool = REPORT_REMARKS[teacher.subjectKey] ?? ['A productive month overall.']

      await ReportModel.create({
        teacher: teacher._id, month: period.month, year: period.year,
        status: period.status, submittedAt: daysAgo(rInt(1, 5)),
        teacherName: teacher.name, teacherEmail: teacher.email,
        summary: {
          totalSubjects: 1, totalStudents: subjectDoc.students.length,
          totalProjects: projSnapshots.length, approvedProjects: projSnapshots.length,
          totalSubmissions: totalSubmitted, gradedSubmissions: totalGraded,
          lateSubmissions: totalLate, avgGrade,
        },
        subjects: [{
          subjectId: subjectDoc._id.toString(), name: subjectDoc.name,
          code: subjectDoc.code, studentCount: subjectDoc.students.length,
          projects: projSnapshots,
        }],
        remarks: remarksPool[period.month % remarksPool.length],
      })
      console.log(`    ✓ ${teacher.name.padEnd(22)} ${period.month}/${period.year} [${period.status}]`)
    }
  }

  // ── Summary ─────────────────────────────────────────────────
  const [uC, sC, pC, mC, subC, annC, repC] = await Promise.all([
    UserModel.countDocuments(), SubjectModel.countDocuments(), ProjectModel.countDocuments(),
    MaterialModel.countDocuments(), SubmissionModel.countDocuments(),
    AnnouncementModel.countDocuments(), ReportModel.countDocuments(),
  ])

  console.log('\n' + '═'.repeat(65))
  console.log('  ✅  SEED COMPLETE')
  console.log('─────────────────────────────────────────────────────────────')
  console.log(`   Users          : ${uC}  (1 admin + 3 teachers + 50 students)`)
  console.log(`   Subjects       : ${sC}`)
  console.log(`   Projects       : ${pC}  (1 main + 2 sub per subject)`)
  console.log(`   Materials      : ${mC}`)
  console.log(`   Submissions    : ${subC}  (mix of submitted / late / graded)`)
  console.log(`   Announcements  : ${annC}  (global + subject-level)`)
  console.log(`   Reports        : ${repC}  (Jan + Feb 2026 per teacher)`)
  console.log('─────────────────────────────────────────────────────────────')
  console.log(`   Admin login    : ${ADMIN.email}  /  ${ADMIN.password}`)
  console.log('─────────────────────────────────────────────────────────────')
  console.log('   Enrollment:')
  console.log('   Accounting       → students 01–35')
  console.log('   Computer Science → students 11–45')
  console.log('   Visual Art       → students 21–50')
  console.log('   ⚠️  All grades hidden from students (gradeVisible: false)')
  console.log('═'.repeat(65) + '\n')

  await mongoose.disconnect()
  console.log('🔌  Disconnected. Done!')
}

seed().catch(err => {
  console.error('❌  Seed failed:', err.message)
  process.exit(1)
})