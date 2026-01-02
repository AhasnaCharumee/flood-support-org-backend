import express, { Request, Response } from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import helpRoutes from './routes/help'
import authRoutes from './routes/auth'
import adminRoutes from './routes/admin'
import statsRoutes from './routes/stats'
import missingRoutes from './routes/missing'
import floodRoutes from './routes/flood'
import shelterRoutes from './routes/shelter'
import analyticsRoutes from './routes/analytics'
import { initScheduledTasks } from './utils/scheduler'

dotenv.config()

const app = express()
// Restrict CORS to known frontends; if unset, allow all origins (useful for health checks/pings)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

const corsOptions: cors.CorsOptions = {
  origin: allowedOrigins.length ? allowedOrigins : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
// Ensure preflight requests always get CORS headers
app.options('*', cors(corsOptions))
app.use(express.json())

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || '')
  .then(() => {
    console.log('MongoDB connected')
    // Initialize scheduled tasks after DB connection
    initScheduledTasks()
  })
  .catch(err => console.error('MongoDB connection error:', err))

// Routes
app.get('/api/health', (_: Request, res: Response) => res.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)
app.use('/api/help', helpRoutes)
app.use('/api/missing', missingRoutes)
app.use('/api/floods', floodRoutes)
app.use('/api/shelters', shelterRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/analytics', analyticsRoutes)


const PORT = Number(process.env.PORT) || 3000;
const server = app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(async () => {
    await mongoose.connection.close()
    process.exit(0)
  })
})
