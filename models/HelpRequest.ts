import mongoose from 'mongoose'

const HelpRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  name: String,
  phone: String,
  type: String,
  description: String,
  location: {
    lat: Number,
    lng: Number,
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'in-progress', 'resolved'],
  },
}, { timestamps: true })

export default mongoose.model('HelpRequest', HelpRequestSchema)
