import express, { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User'

const router = express.Router()

// REGISTER
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields required' })
    }

    const normalizedEmail = String(email).toLowerCase().trim()

    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    const hashed = await bcrypt.hash(password, 10)

    const user = new User({
      name,
      email: normalizedEmail,
      password: hashed,
    })

    await user.save()
    res.json({ message: 'User registered successfully' })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Registration error' })
  }
})

// LOGIN
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' })
    }

    const normalizedEmail = String(email).toLowerCase().trim()

    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      console.warn('Login failed: user not found for email', normalizedEmail)
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    if (!user.password) {
      console.warn('Login failed: no password set for user', normalizedEmail)
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      console.warn('Login failed: password mismatch for user', normalizedEmail)
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'supersecret',
      { expiresIn: '1d' }
    )

    res.json({ 
      message: 'Login successful',
      token, 
      role: user.role,
      userId: user._id 
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Login error' })
  }
})

export default router

// Development-only: Seed admin user quickly
// POST /api/auth/seed-admin
// Only allowed in development to avoid security risk
router.post('/seed-admin', async (req: Request, res: Response) => {
  try {
    if ((process.env.NODE_ENV || '').toLowerCase() !== 'development') {
      return res.status(403).json({ message: 'Forbidden in production' })
    }

    // Allow custom credentials via body in development
    const email = (req.body?.email as string) || 'admin@flood.lk'
    const name = (req.body?.name as string) || 'Admin'
    const passwordPlain = (req.body?.password as string) || 'admin123'
    const role = (req.body?.role as string) || 'admin'

    if (!email || !passwordPlain) {
      return res.status(400).json({ message: 'email and password are required' })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const hashed = await bcrypt.hash(passwordPlain, 10)

    const existing = await User.findOne({ email: normalizedEmail })
    if (existing) {
      existing.name = name
      existing.password = hashed
      existing.role = role === 'admin' ? 'admin' : 'user'
      await existing.save()
      return res.json({ message: 'Admin updated', email: normalizedEmail })
    }

    const admin = new User({ name, email: normalizedEmail, password: hashed, role })
    await admin.save()
    return res.json({ message: 'Admin created', email: normalizedEmail })
  } catch (error) {
    console.error('Seed admin error:', error)
    res.status(500).json({ message: 'Seed admin failed' })
  }
})
