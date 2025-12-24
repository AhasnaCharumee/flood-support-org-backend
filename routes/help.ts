import express, { Request, Response } from 'express'
import HelpRequest from '../models/HelpRequest'
import { protect, adminOnly } from '../middleware/auth'

interface AuthRequest extends Request {
  user?: {
    id: string
    role: string
  }
}

const router = express.Router()

// CREATE (public)
router.post('/', async (req: Request, res: Response) => {
  try {
    const help = new HelpRequest(req.body)
    await help.save()
    res.json(help)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// READ all (admin only)
router.get('/', protect, adminOnly, async (_: Request, res: Response) => {
  try {
    const helps = await HelpRequest.find().sort({ createdAt: -1 })
    res.json(helps)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Get single help request
router.get('/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const help = await HelpRequest.findById(req.params.id)
    if (!help) return res.status(404).json({ message: 'Not found' })
    
    // User can only see their own requests, admin can see all
    if (req.user?.role !== 'admin' && (help as any).userId !== req.user?.id) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    
    res.json(help)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Update help request (admin only)
router.patch('/:id', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    const help = await HelpRequest.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(help)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Mark as RESOLVED (admin only)
router.put('/:id/resolve', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    const help = await HelpRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved' },
      { new: true }
    )
    res.json(help)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Delete help request (admin only)
router.delete('/:id', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    await HelpRequest.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Admin: Get statistics (admin only)
router.get('/admin/stats', protect, adminOnly, async (_: Request, res: Response) => {
  try {
    const total = await HelpRequest.countDocuments()
    const pending = await HelpRequest.countDocuments({ status: 'pending' })
    const inProgress = await HelpRequest.countDocuments({ status: 'in-progress' })
    const resolved = await HelpRequest.countDocuments({ status: 'resolved' })

    res.json({
      total,
      pending,
      inProgress,
      resolved,
    })
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Admin: Get requests by status (admin only)
router.get('/admin/by-status/:status', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    const helps = await HelpRequest.find({ status: req.params.status })
    res.json(helps)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

export default router
