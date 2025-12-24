import mongoose from 'mongoose'

const MissingPersonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: Number,
  lastSeen: String,
  description: String,
  photoUrl: String,
  contact: String,
  status: {
    type: String,
    enum: ['missing', 'found'],
    default: 'missing',
  },
}, { timestamps: true })

export default mongoose.model('MissingPerson', MissingPersonSchema)
