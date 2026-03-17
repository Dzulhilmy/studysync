const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function createNewAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  const User = mongoose.models.User || mongoose.model('User', userSchema);
  
  const rawPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);
  
  const newEmail = 'admin1@studysync.edu.my';
  
  await User.create({
    name: 'New Administrator',
    email: newEmail,
    password: hashedPassword,
    role: 'admin',
    isActive: true
  });
  
  console.log('✅ Created new admin:');
  console.log('Email:', newEmail);
  console.log('Password:', rawPassword);
  
  process.exit(0);
}

createNewAdmin().catch(console.error);
