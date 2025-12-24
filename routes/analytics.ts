import express, { Request, Response } from 'express'
import Flood from '../models/Flood'
import Shelter from '../models/Shelter'
import HelpRequest from '../models/HelpRequest'
import MissingPerson from '../models/MissingPerson'
import { protect, adminOnly } from '../middleware/auth'

const router = express.Router()

// GET /api/analytics/flood-severity (public)
router.get('/flood-severity', async (_: Request, res: Response) => {
  try {
    // Aggregate counts by severity
    const result = await Flood.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ])

    // Format data as { severity: count }
    const data = {
      low: 0,
      medium: 0,
      high: 0,
    }
    result.forEach(item => {
      if (item._id) {
        data[item._id as 'low' | 'medium' | 'high'] = item.count
      }
    })

    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/analytics/help-requests-by-type (public)
router.get('/help-requests-by-type', async (_: Request, res: Response) => {
  try {
    const result = await HelpRequest.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ])

    const data = result.map(item => ({
      type: item._id,
      count: item.count
    }))

    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/analytics/help-requests-by-status (admin only)
router.get('/help-requests-by-status', protect, adminOnly, async (_: Request, res: Response) => {
  try {
    const result = await HelpRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    const data = result.map(item => ({
      status: item._id,
      count: item.count
    }))

    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/analytics/shelter-capacity (public)
router.get('/shelter-capacity', async (_: Request, res: Response) => {
  try {
    const shelters = await Shelter.find()

    const totalCapacity = shelters.reduce((sum, s) => sum + (s.capacity || 0), 0)
    const totalOccupancy = shelters.reduce((sum, s) => sum + (s.currentOccupancy || 0), 0)
    const availableSpaces = totalCapacity - totalOccupancy

    res.json({
      totalCapacity,
      totalOccupancy,
      availableSpaces,
      occupancyRate: totalCapacity > 0 ? ((totalOccupancy / totalCapacity) * 100).toFixed(1) : 0
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/analytics/missing-persons-status (public)
router.get('/missing-persons-status', async (_: Request, res: Response) => {
  try {
    const result = await MissingPerson.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    const data = {
      missing: 0,
      found: 0,
    }
    result.forEach(item => {
      if (item._id) {
        data[item._id as 'missing' | 'found'] = item.count
      }
    })

    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/analytics/overview (admin only)
router.get('/overview', protect, adminOnly, async (_: Request, res: Response) => {
  try {
    const totalFloods = await Flood.countDocuments()
    const activeFloods = await Flood.countDocuments({ status: 'active' })
    const totalShelters = await Shelter.countDocuments()
    const availableShelters = await Shelter.countDocuments({ status: 'available' })
    const totalHelpRequests = await HelpRequest.countDocuments()
    const pendingRequests = await HelpRequest.countDocuments({ status: 'pending' })
    const totalMissing = await MissingPerson.countDocuments()
    const stillMissing = await MissingPerson.countDocuments({ status: 'missing' })

    res.json({
      floods: { total: totalFloods, active: activeFloods },
      shelters: { total: totalShelters, available: availableShelters },
      helpRequests: { total: totalHelpRequests, pending: pendingRequests },
      missingPersons: { total: totalMissing, stillMissing }
    })
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/analytics/timeline (admin only)
router.get('/timeline', protect, adminOnly, async (_: Request, res: Response) => {
  try {
    // Get help requests created per day for last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const result = await HelpRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ])

    const data = result.map(item => ({
      date: item._id,
      count: item.count
    }))

    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
