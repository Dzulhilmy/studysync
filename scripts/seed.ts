/**
 * StudySync — Database Seed Script
 * Run with: npx tsx scripts/seed.ts
 * Creates the first admin user so you can log in.
 */

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function seed() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env.local')
    process.exit(1)
  }

  console.log('🔌 Connecting to MongoDB...')
  await mongoose.connect(uri)
  console.log('✅ Connected!')

  // Define a simple inline schema to avoid import issues
  const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: String,
    avatar: String,
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
  }, { timestamps: true })

  const User = mongoose.models.User || mongoose.model('User', UserSchema)

  // Seed users
  const users = [
    { name: 'Administrator', email: 'admin@studysync.com', password: 'admin123', role: 'admin' },
    { name: 'Teacher Aisha', email: 'teacher@studysync.com', password: 'teacher123', role: 'teacher' },
    { name: 'Student Ali', email: 'student@studysync.com', password: 'student123', role: 'student' },
  ]

  for (const userData of users) {
    const exists = await User.findOne({ email: userData.email })
    if (exists) {
      console.log(`⚠️  Skipping ${userData.email} — already exists`)
      continue
    }
    const hashed = await bcrypt.hash(userData.password, 12)
    await User.create({ ...userData, password: hashed })
    console.log(`✅ Created ${userData.role}: ${userData.email}`)
  }

  console.log('\n🎉 Seed complete! Login credentials:')
  console.log('   Admin:   admin@studysync.com   / admin123')
  console.log('   Teacher: teacher@studysync.com / teacher123')
  console.log('   Student: student@studysync.com / student123')

  await mongoose.disconnect()
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
