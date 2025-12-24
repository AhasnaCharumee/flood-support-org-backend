import express, { Request, Response } from 'express'
import { protect, adminOnly } from '../middleware/auth'
import User from '../models/User'
import HelpRequest from '../models/HelpRequest'
import { syncAllGovData, seedMockFloodData } from '../utils/govApi'

interface AuthRequest extends Request {
  user?: {
    id: string
    role: string
  }
}

const router = express.Router()

// Admin: Get all users
router.get('/users', protect, adminOnly, async (_: Request, res: Response) => {
  try {
    const users = await User.find().select('-password')
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Admin: Get dashboard stats
router.get('/stats', protect, adminOnly, async (_: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments()
    const totalRequests = await HelpRequest.countDocuments()
    const pendingRequests = await HelpRequest.countDocuments({ status: 'pending' })
    const resolvedRequests = await HelpRequest.countDocuments({ status: 'resolved' })

    res.json({
      totalUsers,
      totalRequests,
      pendingRequests,
      resolvedRequests,
    })
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Admin: Get all help requests (comprehensive)
router.get('/help-requests', protect, adminOnly, async (_: Request, res: Response) => {
  try {
    const requests = await HelpRequest.find().populate('userId', 'name email phone')
    res.json(requests)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Admin: Update request status
router.patch('/help-requests/:id/status', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body

    if (!['pending', 'in-progress', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }

    const help = await HelpRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )

    res.json(help)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Admin: Assign admin role to user
router.patch('/users/:id/make-admin', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'admin' },
      { new: true }
    ).select('-password')

    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Admin: Trigger government data sync manually
router.post('/sync-gov-data', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    // Allow using mock seed when query param is present
    if (req.query.useMock === '1') {
      const result = await seedMockFloodData()
      return res.json(result)
    }
    const result = await syncAllGovData()
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

export default router
