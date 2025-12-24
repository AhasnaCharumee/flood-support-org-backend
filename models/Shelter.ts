import mongoose from 'mongoose'

const ShelterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  capacity: Number,
  currentOccupancy: { type: Number, default: 0 },
  facilities: String,
  contact: String,
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  status: {
    type: String,
    enum: ['available', 'full', 'closed'],
    default: 'available',
  },
}, { timestamps: true })

export default mongoose.model('Shelter', ShelterSchema)
