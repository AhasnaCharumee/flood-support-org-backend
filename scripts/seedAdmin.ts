import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import User from '../models/User'

dotenv.config()

async function run() {
  const mongoUri = process.env.MONGO_URI || ''
  if (!mongoUri) {
    console.error('MONGO_URI is not set in .env')
    process.exit(1)
  }

  try {
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB')

    const email = 'admin@flood.lk'
    const name = 'Admin'
    const passwordPlain = 'admin123'
    const hashed = await bcrypt.hash(passwordPlain, 10)

    const existing = await User.findOne({ email })
    if (existing) {
      existing.name = name
      existing.password = hashed
      existing.role = 'admin'
      await existing.save()
      console.log('Admin user updated:', email)
    } else {
      const admin = new User({ name, email, password: hashed, role: 'admin' })
      await admin.save()
      console.log('Admin user created:', email)
    }
  } catch (err) {
    console.error('Seed error:', err)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    console.log('Disconnected from MongoDB')
    process.exit(0)
  }
}

run()
