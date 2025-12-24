import express, { Request, Response } from 'express'
import HelpRequest from '../models/HelpRequest'
import { protect, adminOnly } from '../middleware/auth'

const router = express.Router()

router.get('/', protect, adminOnly, async (_: Request, res: Response) => {
  try {
    const total = await HelpRequest.countDocuments()
    const resolved = await HelpRequest.countDocuments({ status: 'resolved' })
    const pending = await HelpRequest.countDocuments({ status: 'pending' })
    const inProgress = await HelpRequest.countDocuments({ status: 'in-progress' })

    const byType = await HelpRequest.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ])

    const byStatus = await HelpRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    res.json({
      total,
      resolved,
      pending,
      inProgress,
      byType,
      byStatus
    })
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

export default router
