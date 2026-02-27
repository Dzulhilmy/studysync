/**
 * StudySync — Complete Database Seed Script
 *
 * Usage:
 *   1. npm install mongoose bcryptjs dotenv
 *   2. Add your MONGODB_URI to .env  OR  replace the uri variable below
 *   3. node seed.js
 *
 * ⚠️  WARNING: This script wipes all Users, Subjects and Projects before seeding.
 */
import { config } from "dotenv";
config({ path: ".env.local" }); 
// This forces it to read .env.local instead of .env, 
// which is important for Vercel deployments where .env is reserved for runtime env vars. 
// If you want to use .env instead, just change the path or remove it entirely.

require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')
const fs       = require('fs')

const uri = process.env.MONGODB_URI || 'YOUR_MONGODB_ATLAS_URI_HERE'

// ─── Schemas (mirrors your existing models) ───────────────────────────────────

const UserSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ['admin','teacher','student'], default: 'student' },
  avatar:    { type: String, default: '' },
  isActive:  { type: Boolean, default: true },
  lastLogin: Date,
}, { timestamps: true })

const SubjectSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  code:        { type: String, required: true, unique: true, uppercase: true },
  description: { type: String, default: '' },
  teacher:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  students:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  coverImage:  { type: String, default: '' },
}, { timestamps: true })

const ProjectSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  subject:     { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  deadline:    { type: Date, required: true },
  maxScore:    { type: Number, default: 100 },
  attachments: [String],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:      { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  adminNote:   { type: String, default: '' },
}, { timestamps: true })

const User    = mongoose.models.User    || mongoose.model('User',    UserSchema)
const Subject = mongoose.models.Subject || mongoose.model('Subject', SubjectSchema)
const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema)

// ─── 60 STUDENTS ─────────────────────────────────────────────────────────────

const STUDENTS = [
  // Malay
  'Ahmad Faris Zulkifli',     'Nur Aisyah Hamdan',        'Muhammad Haziq Roslan',
  'Siti Fatimah Azhari',      'Mohd Irfan Zakaria',        'Nurul Ain Khalid',
  'Amirul Hafiz Nordin',      'Farah Nabilah Ismail',      'Izzatul Husna Jamal',
  'Hafizuddin Mansor',        'Nurul Izzati Razali',       'Ridhwan Salleh',
  'Syafiqah Othman',          'Zulhilmi Wahab',            'Nabilah Ramli',
  'Arif Imran Zainudin',      'Nur Hidayah Azman',         'Luqmanul Hakim Daud',
  'Farhana Mokhtar',          'Syahmi Abdul Razak',
  // Chinese
  'Lim Wei Xian',             'Tan Shu Ying',              'Chong Jun Hao',
  'Wong Mei Ling',            'Ng Zhi Yang',               'Lee Hui Shan',
  'Goh Kah Wei',              'Yap Jia Xuan',              'Ong Boon Keat',
  'Khor Sze Lin',             'Teh Chee Wai',              'Loh Pei Ying',
  'Cheah Weng Hong',          'Soo Kai Xin',               'Leong Yoke Fong',
  'Chan Jing Yi',             'Ooi Zi Xuan',               'Phua Cheng Han',
  'Quek Mei Yee',             'Sim Rui Qi',
  // Indian
  'Aravind Kumar Krishnan',   'Priya Devi Subramaniam',    'Rajan Pillai Chandran',
  'Lavanya Muthu Krishnan',   'Vikram Raja Gopal',         'Nithya Selvam',
  'Dinesh Kumar Raj',         'Kavitha Rajan',             'Suresh Nadarajan',
  'Malathi Velayutham',
  // Mixed
  'Nik Amirul Nik Aziz',      'Tengku Alia Tengku Razif',  'Muhammad Azri Hassan',
  'Alicia Tan Shu Min',       'Darshini Arumugam',         'Afiqah Saifullizan',
  'Jason Lim Jia Hao',        'Sharveen Rajasekaran',      'Nurul Nadiah Ghazali',
  'Elisha Wong Hui Min',
]

// ─── 20 TEACHERS ─────────────────────────────────────────────────────────────

const TEACHERS = [
  'Norhayati Ramli',        // [0]  BM101
  'Ahmad Nazri Hashim',     // [1]  ENG101
  'Roslinda Zainol',        // [2]  ARB101
  'Shahrul Nizam Isa',      // [3]  MATH101 + AMATH101
  'Fauziah Yusuf',          // [4]  SCI101 + BIO101
  'Lim Choon Hock',         // [5]  PHY101 + CHEM101
  'Tan Ai Ling',            // [6]  MAN101
  'Krishnan Subramaniam',   // [7]  MUS101
  'Siti Hajar Othman',      // [8]  PI101
  'Hafizudin Kamal',        // [9]  CS101
  'Wong Kok Wai',           // [10] no subject (admin duty)
  'Anita Zulkarnain',       // [11] no subject (admin duty)
  'Rajendran Pillai',       // [12] HIST101
  'Nurul Huda Ariffin',     // [13] GEO101
  'Mohd Fadzli Nordin',     // [14] no subject (admin duty)
  'Yeoh Bee Lian',          // [15] no subject (admin duty)
  'Santhosh Kumar Nair',    // [16] ART101
  'Azlina Abdul Ghani',     // [17] — spare
  'Chia Chee Keong',        // [18] — spare
  'Rodziah Mat Zin',        // [19] — spare
]

// ─── 16 SUBJECTS ─────────────────────────────────────────────────────────────

const SUBJECTS = [
  { name: 'Malay Language',         code: 'BM101',    teacher: 0,  desc: 'Bahasa Melayu — national language proficiency, literature and communication.' },
  { name: 'English Language',       code: 'ENG101',   teacher: 1,  desc: 'Reading comprehension, essay writing, grammar and communication skills.' },
  { name: 'Arabic Language',        code: 'ARB101',   teacher: 2,  desc: 'Reading, writing and conversational Arabic for intermediate learners.' },
  { name: 'Mandarin Language',      code: 'MAN101',   teacher: 6,  desc: 'Mandarin Chinese — reading, writing, listening and speaking.' },
  { name: 'Mathematics',            code: 'MATH101',  teacher: 3,  desc: 'Core Mathematics — algebra, geometry, statistics and probability.' },
  { name: 'Additional Mathematics', code: 'AMATH101', teacher: 3,  desc: 'Advanced Mathematics — calculus, vectors and linear programming.' },
  { name: 'Science',                code: 'SCI101',   teacher: 4,  desc: 'Integrated Science — scientific method, forces, matter and living things.' },
  { name: 'Physics',                code: 'PHY101',   teacher: 5,  desc: 'Mechanics, waves, thermodynamics, electricity and modern physics.' },
  { name: 'Biology',                code: 'BIO101',   teacher: 4,  desc: 'Cell biology, genetics, ecology and human physiology.' },
  { name: 'Chemistry',              code: 'CHEM101',  teacher: 5,  desc: 'Atomic structure, chemical bonding, reactions and organic chemistry.' },
  { name: 'Islamic Education',      code: 'PI101',    teacher: 8,  desc: 'Aqidah, fiqh, sirah and Quran recitation for Muslim students.' },
  { name: 'Computer Science',       code: 'CS101',    teacher: 9,  desc: 'Programming, algorithms, networks and data management.' },
  { name: 'Visual Arts',            code: 'ART101',   teacher: 16, desc: 'Drawing, painting, design principles and Malaysian art appreciation.' },
  { name: 'History',                code: 'HIST101',  teacher: 12, desc: 'Malaysian history, world history and critical historical thinking.' },
  { name: 'Geography',              code: 'GEO101',   teacher: 13, desc: 'Physical geography, human geography, maps and environmental studies.' },
  { name: 'Music',                  code: 'MUS101',   teacher: 7,  desc: 'Music theory, ensemble, vocal training and Malaysian traditional music.' },
]

// ─── PROJECTS (2–3 per subject) ───────────────────────────────────────────────

const PROJECTS = {
  BM101: [
    { title: 'Karangan Argumentatif — Cabaran Remaja Masa Kini',    days: 30, max: 100, desc: 'Tulis karangan argumentatif tidak kurang 500 patah perkataan membincangkan cabaran remaja pada hari ini.' },
    { title: 'Analisis Sajak Tradisional',                          days: 45, max: 80,  desc: 'Pilih dua sajak daripada antologi yang diberikan dan buat analisis berdasarkan tema, persoalan dan teknik.' },
    { title: 'Folio Peribahasa Melayu',                             days: 60, max: 100, desc: 'Sediakan folio mengandungi 30 peribahasa Melayu beserta maksud, contoh ayat dan ilustrasi.' },
  ],
  ENG101: [
    { title: 'Persuasive Essay — Technology in Education',          days: 28, max: 100, desc: 'Write a 600-word persuasive essay arguing for or against the use of AI in classrooms.' },
    { title: 'Short Story Analysis',                                days: 35, max: 80,  desc: 'Read the assigned short story and submit a character analysis examining the protagonist\'s development.' },
    { title: 'Oral Presentation — Current Global Issues',           days: 21, max: 60,  desc: 'Prepare a 5-minute presentation on a current global issue. Submit your script and slide deck.' },
  ],
  ARB101: [
    { title: 'تعبير كتابي — الحياة اليومية',                        days: 30, max: 100, desc: 'اكتب تعبيراً عن حياتك اليومية في المدرسة بما لا يقل عن 200 كلمة.' },
    { title: 'قراءة النصوص وتحليلها',                               days: 20, max: 80,  desc: 'اقرأ النص المرفق وأجب عن الأسئلة المتعلقة بالفهم والمفردات.' },
  ],
  MAN101: [
    { title: '汉字书写练习 — 笔顺与结构',                            days: 14, max: 50,  desc: '完成汉字书写练习册第三章，每个汉字写五遍，注意笔顺和字形结构。' },
    { title: '作文 — 我的家庭',                                      days: 28, max: 100, desc: '写一篇关于你家庭的作文，字数不少于150字，并附上家庭成员简单介绍。' },
  ],
  MATH101: [
    { title: 'Problem Set — Quadratic Equations & Functions',       days: 14, max: 100, desc: 'Solve 25 problems covering factorisation, completing the square and the quadratic formula. Show full working.' },
    { title: 'Statistics Project — School Survey Analysis',         days: 42, max: 100, desc: 'Survey at least 30 respondents on a topic of your choice. Present using frequency tables, bar charts, mean, mode and median.' },
    { title: 'Geometry Portfolio — Circle Theorems',                days: 35, max: 80,  desc: 'Compile a portfolio demonstrating all 8 circle theorems with proofs and 3 real-world applications each.' },
  ],
  AMATH101: [
    { title: 'Differentiation & Integration Assignment',            days: 21, max: 100, desc: 'Complete 30 problems covering first principles, chain rule, product rule and definite integrals.' },
    { title: 'Vectors & Linear Programming Project',                days: 45, max: 100, desc: 'Model a real-world optimisation problem using linear programming. Submit formulation, graph and solution.' },
  ],
  SCI101: [
    { title: 'Lab Report — Photosynthesis Experiment',              days: 21, max: 100, desc: 'Document the effect of light intensity on photosynthesis. Include hypothesis, method, results and conclusion.' },
    { title: 'Science Fair Project Proposal',                       days: 28, max: 60,  desc: 'Submit a detailed proposal including research question, hypothesis, variables, materials and expected outcomes.' },
    { title: 'Research Report — Climate Change in Malaysia',        days: 50, max: 100, desc: 'Write a 1000-word report on how climate change is affecting Malaysia\'s ecosystems, citing 5 credible sources.' },
  ],
  PHY101: [
    { title: 'Lab Report — Hooke\'s Law Investigation',              days: 20, max: 100, desc: 'Write a complete report on Hooke\'s Law using lab data. Include graphs, error analysis and conclusion.' },
    { title: 'Physics Concept Poster — Electromagnetic Waves',      days: 35, max: 80,  desc: 'Create an A2 digital or physical poster explaining the electromagnetic spectrum and its applications.' },
  ],
  BIO101: [
    { title: 'Cell Biology Lab Report — Osmosis',                   days: 18, max: 100, desc: 'Submit a complete lab report from the osmosis experiment using potato cells. Include hypothesis, data and analysis.' },
    { title: 'Genetics Problem Set',                                days: 30, max: 100, desc: 'Complete 20 genetics problems covering monohybrid and dihybrid crosses, incomplete dominance and sex-linked traits.' },
    { title: 'Ecosystem Field Study Report',                        days: 40, max: 80,  desc: 'Document biodiversity observed during the school garden field study. Include food web diagram and ecological notes.' },
  ],
  CHEM101: [
    { title: 'Titration Lab Report',                                days: 22, max: 100, desc: 'Write a formal lab report for the acid-base titration experiment. Include mole calculations and error percentage.' },
    { title: 'Organic Chemistry — Reaction Mechanisms',             days: 35, max: 80,  desc: 'Complete worksheet covering substitution, addition and elimination reactions with full mechanism arrows.' },
  ],
  PI101: [
    { title: 'Folio Fiqh — Bab Solat',                             days: 30, max: 100, desc: 'Sediakan folio lengkap berkaitan bab solat merangkumi syarat sah, rukun, perkara yang membatalkan solat dan dalilnya.' },
    { title: 'Hafazan Surah Al-Mulk',                               days: 45, max: 100, desc: 'Hafaz Surah Al-Mulk (30 ayat) dan rakam video bacaan. Penilaian berdasarkan tajwid dan kelancaran.' },
    { title: 'Kajian Sirah — Peristiwa Hijrah',                     days: 40, max: 80,  desc: 'Tulis esei 600 patah perkataan tentang peristiwa hijrah Nabi Muhammad SAW dan pengajarannya untuk kehidupan moden.' },
  ],
  CS101: [
    { title: 'Python Assignment — Student Grade System',            days: 25, max: 100, desc: 'Build a student grade management system in Python using lists and dictionaries. Include add, remove, search and display.' },
    { title: 'Web Project — Personal Portfolio Website',            days: 45, max: 100, desc: 'Build a portfolio website using HTML, CSS and JavaScript with About, Skills and Projects sections.' },
    { title: 'Algorithm Design — Flowcharts & Pseudocode',          days: 18, max: 60,  desc: 'Design algorithms for 5 given problems using flowcharts and pseudocode. Include trace tables for each.' },
  ],
  ART101: [
    { title: 'Observational Drawing — Still Life',                  days: 21, max: 100, desc: 'Produce a shaded pencil drawing of the still life arrangement. Minimum A3 size. Focus on proportion, tone and texture.' },
    { title: 'Batik Design Project',                                days: 42, max: 100, desc: 'Design and produce a batik-inspired pattern incorporating Malaysian cultural motifs. Submit sketch and final artwork.' },
  ],
  HIST101: [
    { title: 'Essay — Perjuangan Kemerdekaan Malaysia',             days: 30, max: 100, desc: 'Write a 1000-word essay on key figures in Malaysia\'s independence movement, supported by historical evidence.' },
    { title: 'Timeline Project — World War II in Malaya',           days: 40, max: 80,  desc: 'Create an illustrated timeline of WWII in Malaya 1941–1945. Include key battles, turning points and civilian impact.' },
  ],
  GEO101: [
    { title: 'Map Skills Assessment',                               days: 14, max: 100, desc: 'Using the provided topographic map, answer 25 questions on contour interpretation, grid references and scale.' },
    { title: 'Field Study Report — River Morphology',               days: 35, max: 100, desc: 'Submit a complete report on the river visited during our field trip. Include data, photographs and conclusions.' },
    { title: 'Report — Natural Disasters in Southeast Asia',        days: 50, max: 80,  desc: 'Write an 800-word report on a recent natural disaster in SEA. Analyse causes, impacts and disaster responses.' },
  ],
  MUS101: [
    { title: 'Music Theory Assessment — Scales & Notation',         days: 14, max: 100, desc: 'Written assessment covering major/minor scales, chord construction and sight-reading notation.' },
    { title: 'Ensemble Performance — Traditional Malaysian Music',  days: 45, max: 100, desc: 'Rehearse and record a 3–5 minute traditional Malaysian piece with your ensemble group.' },
  ],
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function toEmail(name: string, index: number, role: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '.')
    .substring(0, 28)
  return `${slug}.${String(index + 1).padStart(2, '0')}@studysync.edu.my`
}

function futureDate(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

function shuffle(arr: any[]) {
  return [...arr].sort(() => Math.random() - 0.5)
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n' + '═'.repeat(60))
  console.log('  🌱  StudySync — Database Seed Script')
  console.log('═'.repeat(60))

  await mongoose.connect(uri)
  console.log('\n✅  Connected to MongoDB Atlas')

  // Wipe
  console.log('\n🗑   Clearing existing collections...')
  await Promise.all([User.deleteMany({}), Subject.deleteMany({}), Project.deleteMany({})])
  console.log('    Cleared: Users, Subjects, Projects')

  const SALT = 10
  const creds: { admin: { name: string; email: string; password: string }; teachers: Array<{ no: number; name: string; email: string; password: string }>; students: Array<{ no: number; name: string; email: string; password: string }> } = { admin: { name: '', email: '', password: '' }, teachers: [], students: [] }

  // ── Admin ───────────────────────────────────────────────────────────────
  console.log('\n🔑  Creating admin...')
  const adminPass = 'Admin@2025'
  await User.create({
    name: 'System Administrator',
    email: 'admin@studysync.edu.my',
    password: await bcrypt.hash(adminPass, SALT),
    role: 'admin',
  })
  creds.admin = { name: 'System Administrator', email: 'admin@studysync.edu.my', password: adminPass }
  console.log('    ✓ admin@studysync.edu.my  /  Admin@2025')

  // ── Teachers ────────────────────────────────────────────────────────────
  console.log('\n👨‍🏫  Creating 20 teachers...')
  const teacherDocs = []
  for (let i = 0; i < TEACHERS.length; i++) {
    const name     = TEACHERS[i]
    const email    = toEmail(name, i, 'teacher')
    const password = `Teacher@${String(i + 1).padStart(3, '0')}`
    teacherDocs.push({ name, email, password: await bcrypt.hash(password, SALT), role: 'teacher' })
    creds.teachers.push({ no: i + 1, name, email, password })
    console.log(`    [${String(i+1).padStart(2,'0')}] ${name.padEnd(30)} ${email}  /  ${password}`)
  }
  const teachers = await User.insertMany(teacherDocs)

  // ── Students ────────────────────────────────────────────────────────────
  console.log('\n🎒  Creating 60 students...')
  const studentDocs = []
  for (let i = 0; i < STUDENTS.length; i++) {
    const name     = STUDENTS[i]
    const email    = toEmail(name, i, 'student')
    const password = `Student@${String(i + 1).padStart(3, '0')}`
    studentDocs.push({ name, email, password: await bcrypt.hash(password, SALT), role: 'student' })
    creds.students.push({ no: i + 1, name, email, password })
    console.log(`    [${String(i+1).padStart(2,'0')}] ${name.padEnd(35)} ${email}  /  ${password}`)
  }
  const students = await User.insertMany(studentDocs)
  const studentIds = students.map((s: any) => s._id)

  // ── Subjects ────────────────────────────────────────────────────────────
  console.log('\n📚  Creating 16 subjects...')
  const subjectMap: { [key: string]: any } = {}

  for (const s of SUBJECTS) {
    // Each subject enrolls 35–50 random students
    const count    = Math.floor(Math.random() * 16) + 35
    const enrolled = shuffle(studentIds).slice(0, count)
    const teacher  = teachers[s.teacher]

    const subj = await Subject.create({
      name:        s.name,
      code:        s.code,
      description: s.desc,
      teacher:     teacher._id,
      students:    enrolled,
    })
    subjectMap[s.code] = subj
    console.log(`    ✓ ${s.code.padEnd(10)} ${s.name.padEnd(25)} ${enrolled.length} students  →  ${teacher.name}`)
  }

  // ── Projects ────────────────────────────────────────────────────────────
  console.log('\n📋  Creating projects...')
  let totalProjects = 0

  for (const [code, projects] of Object.entries(PROJECTS)) {
    const subj = subjectMap[code]
    for (const p of projects) {
      await Project.create({
        title:       p.title,
        description: p.desc,
        subject:     subj._id,
        deadline:    futureDate(p.days),
        maxScore:    p.max,
        createdBy:   subj.teacher,
        status:      'approved',
      })
      totalProjects++
    }
    console.log(`    ✓ ${code.padEnd(10)} ${projects.length} project(s)`)
  }

  // ── Save credentials to JSON ─────────────────────────────────────────────
  fs.writeFileSync('seed-credentials.json', JSON.stringify(creds, null, 2), 'utf8')

  // ── Done ─────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60))
  console.log('  ✅  SEED COMPLETE')
  console.log('═'.repeat(60))
  console.log(`\n  👑 Admin      : admin@studysync.edu.my  /  Admin@2025`)
  console.log(`  👨‍🏫 Teachers   : 20  (Teacher@001 … Teacher@020)`)
  console.log(`  🎒 Students   : 60  (Student@001 … Student@060)`)
  console.log(`  📚 Subjects   : ${Object.keys(subjectMap).length}`)
  console.log(`  📋 Projects   : ${totalProjects}`)
  console.log(`\n  💾 All credentials saved → seed-credentials.json`)
  console.log('═'.repeat(60) + '\n')

  await mongoose.disconnect()
}

seed().catch(err => {
  console.error('\n❌  Seed failed:', err.message)
  process.exit(1)
})