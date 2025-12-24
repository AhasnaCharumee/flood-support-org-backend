import express, { Request, Response } from 'express'
import MissingPerson from '../models/MissingPerson'
import { protect, adminOnly } from '../middleware/auth'

const router = express.Router()

// REPORT missing person (public)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, age, lastSeen, description, photoUrl, contact } = req.body

    if (!name) {
      return res.status(400).json({ message: 'Name is required' })
    }

    const person = new MissingPerson({
      name,
      age,
      lastSeen,
      description,
      photoUrl,
      contact,
    })

    await person.save()
    res.status(201).json(person)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// VIEW all (public – for searching)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { name } = req.query

    const filter: any = {}
    if (name) {
      filter.name = { $regex: name, $options: 'i' }
    }

    const persons = await MissingPerson.find(filter).sort({ createdAt: -1 })
    res.json(persons)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// GET single missing person
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const person = await MissingPerson.findById(req.params.id)
    if (!person) {
      return res.status(404).json({ message: 'Not found' })
    }
    res.json(person)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// MARK as found (admin)
router.put('/:id/found', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    const person = await MissingPerson.findByIdAndUpdate(
      req.params.id,
      { status: 'found' },
      { new: true }
    )

    if (!person) {
      return res.status(404).json({ message: 'Not found' })
    }

    res.json(person)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// UPDATE missing person report (admin)
router.patch('/:id', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    const person = await MissingPerson.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )

    if (!person) {
      return res.status(404).json({ message: 'Not found' })
    }

    res.json(person)
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// DELETE missing person report (admin)
router.delete('/:id', protect, adminOnly, async (req: Request, res: Response) => {
  try {
    await MissingPerson.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

// GET statistics (admin)
router.get('/admin/stats', protect, adminOnly, async (_: Request, res: Response) => {
  try {
    const total = await MissingPerson.countDocuments()
    const missing = await MissingPerson.countDocuments({ status: 'missing' })
    const found = await MissingPerson.countDocuments({ status: 'found' })

    res.json({
      total,
      missing,
      found,
    })
  } catch (error) {
    res.status(500).json({ error: error })
  }
})

export default router
