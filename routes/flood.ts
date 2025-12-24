import express, { Request, Response } from 'express'
import Flood from '../models/Flood'
import { protect, adminOnly } from '../middleware/auth'

const router = express.Router()

// Get all flood markers (public)
router.get('/', async (_: Request, res: Response) => {
  try {
    const floods = await Flood.find().sort({ createdAt: -1 })
    res.json(floods)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Get active floods only (public)
router.get('/active', async (_: Request, res: Response) => {
  try {
    const floods = await Flood.find({ status: 'active' }).sort({ createdAt: -1 })
    res.json(floods)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Get floods by severity (public)
router.get('/severity/:level', async (req: Request, res: Response) => {
  try {
    const { level } = req.params
    if (!['low', 'medium', 'high'].includes(level)) {
      return res.status(400).json({ message: 'Invalid severity level' })
    }
    const floods = await Flood.find({ severity: level, status: 'active' })
    res.json(floods)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Get single flood
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const flood = await Flood.findById(req.params.id)
    if (!flood) {
      return res.status(404).json({ message: 'Not found' })
    }
    res.json(flood)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Add new flood marker (Admin only)
router.post('/', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    const { title, description, severity, location } = req.body

    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({ message: 'Location coordinates required' })
    }

    const flood = new Flood({
      title,
      description,
      severity,
      location,
    })

    await flood.save()
    res.status(201).json(flood)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Update flood (Admin only)
router.patch('/:id', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    const flood = await Flood.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!flood) {
      return res.status(404).json({ message: 'Not found' })
    }
    res.json(flood)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Mark flood as resolved (Admin only)
router.put('/:id/resolve', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    const flood = await Flood.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved' },
      { new: true }
    )
    if (!flood) {
      return res.status(404).json({ message: 'Not found' })
    }
    res.json(flood)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Delete flood (Admin only)
router.delete('/:id', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    await Flood.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Get flood statistics (Admin)
router.get('/admin/stats', protect, adminOnly, async (_: Request, res: Response) => {
  try {
    const total = await Flood.countDocuments()
    const active = await Flood.countDocuments({ status: 'active' })
    const resolved = await Flood.countDocuments({ status: 'resolved' })
    const high = await Flood.countDocuments({ severity: 'high', status: 'active' })
    const medium = await Flood.countDocuments({ severity: 'medium', status: 'active' })
    const low = await Flood.countDocuments({ severity: 'low', status: 'active' })

    res.json({
      total,
      active,
      resolved,
      bySeverity: { high, medium, low }
    })
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

export default router
