import express, { Request, Response } from 'express'
import Shelter from '../models/Shelter'
import { protect, adminOnly } from '../middleware/auth'

const router = express.Router()

// Get all shelters (public)
router.get('/', async (_: Request, res: Response) => {
  try {
    const shelters = await Shelter.find().sort({ createdAt: -1 })
    res.json(shelters)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Get available shelters only (public)
router.get('/available', async (_: Request, res: Response) => {
  try {
    const shelters = await Shelter.find({ status: 'available' }).sort({ createdAt: -1 })
    res.json(shelters)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Get shelters with capacity (public)
router.get('/with-capacity', async (_: Request, res: Response) => {
  try {
    const shelters = await Shelter.find({
      $expr: { $lt: ['$currentOccupancy', '$capacity'] }
    }).sort({ createdAt: -1 })
    res.json(shelters)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Get single shelter
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const shelter = await Shelter.findById(req.params.id)
    if (!shelter) {
      return res.status(404).json({ message: 'Not found' })
    }
    res.json(shelter)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Add new shelter (Admin only)
router.post('/', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    const { name, capacity, currentOccupancy, facilities, contact, location } = req.body

    if (!name) {
      return res.status(400).json({ message: 'Shelter name required' })
    }

    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({ message: 'Location coordinates required' })
    }

    const shelter = new Shelter({
      name,
      capacity,
      currentOccupancy: currentOccupancy || 0,
      facilities,
      contact,
      location,
    })

    await shelter.save()
    res.status(201).json(shelter)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Update shelter (Admin only)
router.patch('/:id', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    const shelter = await Shelter.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!shelter) {
      return res.status(404).json({ message: 'Not found' })
    }

    // Auto-update status based on capacity
    if (shelter.capacity && shelter.currentOccupancy >= shelter.capacity) {
      shelter.status = 'full'
      await shelter.save()
    }

    res.json(shelter)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Update shelter occupancy (Admin only)
router.patch('/:id/occupancy', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    const { currentOccupancy } = req.body

    if (typeof currentOccupancy !== 'number') {
      return res.status(400).json({ message: 'Valid occupancy number required' })
    }

    const shelter = await Shelter.findById(req.params.id)
    if (!shelter) {
      return res.status(404).json({ message: 'Not found' })
    }

    shelter.currentOccupancy = currentOccupancy

    // Auto-update status
    if (shelter.capacity && currentOccupancy >= shelter.capacity) {
      shelter.status = 'full'
    } else if (shelter.status === 'full') {
      shelter.status = 'available'
    }

    await shelter.save()
    res.json(shelter)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Mark shelter as closed (Admin only)
router.put('/:id/close', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    const shelter = await Shelter.findByIdAndUpdate(
      req.params.id,
      { status: 'closed' },
      { new: true }
    )
    if (!shelter) {
      return res.status(404).json({ message: 'Not found' })
    }
    res.json(shelter)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Reopen shelter (Admin only)
router.put('/:id/open', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    const shelter = await Shelter.findByIdAndUpdate(
      req.params.id,
      { status: 'available' },
      { new: true }
    )
    if (!shelter) {
      return res.status(404).json({ message: 'Not found' })
    }
    res.json(shelter)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Delete shelter (Admin only)
router.delete('/:id', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    await Shelter.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// Get shelter statistics (Admin)
router.get('/admin/stats', protect, adminOnly, async (_: Request, res: Response) => {
  try {
    const total = await Shelter.countDocuments()
    const available = await Shelter.countDocuments({ status: 'available' })
    const full = await Shelter.countDocuments({ status: 'full' })
    const closed = await Shelter.countDocuments({ status: 'closed' })

    const shelters = await Shelter.find()
    const totalCapacity = shelters.reduce((sum, s) => sum + (s.capacity || 0), 0)
    const totalOccupancy = shelters.reduce((sum, s) => sum + (s.currentOccupancy || 0), 0)

    res.json({
      total,
      available,
      full,
      closed,
      totalCapacity,
      totalOccupancy,
      availableSpaces: totalCapacity - totalOccupancy
    })
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

export default router
