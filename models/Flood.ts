import mongoose from 'mongoose'

const FloodSchema = new mongoose.Schema({
  title: String,
  description: String,
  severity: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'low' 
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  status: {
    type: String,
    enum: ['active', 'resolved'],
    default: 'active',
  },
}, { timestamps: true })

export default mongoose.model('Flood', FloodSchema)
