import axios from 'axios'
import Flood from '../models/Flood'
import Shelter from '../models/Shelter'
import dotenv from 'dotenv'

dotenv.config()

// Government API configuration
const GOV_API_URL = process.env.GOV_FLOOD_API_URL || 'https://gov-api.example.com/floods'
const GOV_API_KEY = process.env.GOV_FLOOD_API_KEY || ''

interface GovFloodData {
  title: string
  description: string
  severity: 'low' | 'medium' | 'high'
  lat: number
  lng: number
  status?: 'active' | 'resolved'
}

/**
 * Fetch government flood data and update database
 * Call this function periodically (via cron job) to sync with government API
 */
export async function fetchGovFloodData(): Promise<void> {
  try {
    console.log('Fetching government flood data...')

    // Make request to government API
    const response = await axios.get(GOV_API_URL, {
      headers: {
        'Authorization': `Bearer ${GOV_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    })

    const govFloods: GovFloodData[] = response.data

    if (!Array.isArray(govFloods)) {
      console.error('Invalid data format from government API')
      return
    }

    console.log(`Received ${govFloods.length} flood records from government API`)

    // Option 1: Clear old data and replace (use with caution)
    // await Flood.deleteMany({ source: 'government' })

    // Option 2: Update existing or create new (recommended)
    for (const f of govFloods) {
      try {
        // Validate required fields
        if (!f.title || !f.lat || !f.lng) {
          console.warn('Skipping invalid flood record:', f)
          continue
        }

        // Check if flood already exists (by location and title)
        const existing = await Flood.findOne({
          title: f.title,
          'location.lat': f.lat,
          'location.lng': f.lng
        })

        if (existing) {
          // Update existing record
          existing.description = f.description || existing.description
          existing.severity = f.severity || existing.severity
          existing.status = f.status || existing.status
          await existing.save()
          console.log(`Updated flood: ${f.title}`)
        } else {
          // Create new record
          const newFlood = new Flood({
            title: f.title,
            description: f.description || '',
            severity: f.severity || 'low',
            location: {
              lat: f.lat,
              lng: f.lng,
            },
            status: f.status || 'active',
          })
          await newFlood.save()
          console.log(`Created new flood: ${f.title}`)
        }
      } catch (error) {
        console.error(`Error processing flood record:`, error)
      }
    }

    console.log('Government flood data sync completed successfully')
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Government API request failed:', error.message)
      if (error.response) {
        console.error('Response status:', error.response.status)
        console.error('Response data:', error.response.data)
      }
    } else {
      console.error('Error fetching government flood data:', error)
    }
  }
}

/**
 * Fetch government shelter data (optional)
 */
export async function fetchGovShelterData(): Promise<void> {
  const GOV_SHELTER_API_URL = process.env.GOV_SHELTER_API_URL

  if (!GOV_SHELTER_API_URL) {
    console.log('Government shelter API URL not configured')
    return
  }

  try {
    console.log('Fetching government shelter data...')

    const response = await axios.get(GOV_SHELTER_API_URL, {
      headers: {
        'Authorization': `Bearer ${GOV_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })

    const govShelters: any[] = response.data

    if (!Array.isArray(govShelters)) {
      console.error('Invalid data format from government shelter API')
      return
    }

    console.log(`Received ${govShelters.length} shelter records from government API`)

    for (const s of govShelters) {
      try {
        if (!s.name || !s.location?.lat || !s.location?.lng) {
          console.warn('Skipping invalid shelter record:', s)
          continue
        }

        const existing = await Shelter.findOne({
          name: s.name,
          'location.lat': s.location.lat,
          'location.lng': s.location.lng
        })

        if (existing) {
          existing.capacity = s.capacity || existing.capacity
          existing.facilities = s.facilities || existing.facilities
          existing.contact = s.contact || existing.contact
          existing.status = s.status || existing.status
          await existing.save()
          console.log(`Updated shelter: ${s.name}`)
        } else {
          const newShelter = new Shelter({
            name: s.name,
            capacity: s.capacity || 0,
            facilities: s.facilities || '',
            contact: s.contact || '',
            location: {
              lat: s.location.lat,
              lng: s.location.lng,
            },
            status: s.status || 'available',
          })
          await newShelter.save()
          console.log(`Created new shelter: ${s.name}`)
        }
      } catch (error) {
        console.error(`Error processing shelter record:`, error)
      }
    }

    console.log('Government shelter data sync completed successfully')
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Government shelter API request failed:', error.message)
      if (error.response) {
        console.error('Response status:', error.response.status)
        console.error('Response data:', error.response.data)
      }
    } else {
      console.error('Error fetching government shelter data:', error)
    }
  }
}

/**
 * Manual trigger endpoint to sync government data
 * Can be called from admin panel or API
 */
export async function syncAllGovData(): Promise<{ success: boolean; message: string }> {
  try {
    await fetchGovFloodData()
    await fetchGovShelterData()
    return { success: true, message: 'Government data synced successfully' }
  } catch (error) {
    return { success: false, message: `Sync failed: ${error}` }
  }
}

/**
 * Seed the database with mock flood and shelter data for development/testing.
 */
export async function seedMockFloodData(): Promise<{ success: boolean; message: string }> {
  try {
    const floods = [
      {
        title: 'Kelaniya River High Risk',
        description: 'Rapidly rising water level near Peliyagoda.',
        severity: 'high' as const,
        location: { lat: 6.9639, lng: 79.9018 },
        status: 'active' as const,
      },
      {
        title: 'Kaduwela Minor Flooding',
        description: 'Localized street flooding reported.',
        severity: 'low' as const,
        location: { lat: 6.9319, lng: 79.9730 },
        status: 'active' as const,
      },
      {
        title: 'Gampaha Medium Flooding',
        description: 'Waterlogged areas across town.',
        severity: 'medium' as const,
        location: { lat: 7.0917, lng: 79.9994 },
        status: 'active' as const,
      },
    ]

    const shelters = [
      {
        name: 'Colombo District Community Hall',
        capacity: 300,
        facilities: 'Food, water, first aid',
        contact: '+94 11 123 4567',
        location: { lat: 6.9271, lng: 79.8612 },
        status: 'available' as const,
      },
      {
        name: 'Gampaha School Hall',
        capacity: 200,
        facilities: 'Beds, sanitation, medicine',
        contact: '+94 33 987 6543',
        location: { lat: 7.0900, lng: 79.9900 },
        status: 'available' as const,
      },
    ]

    // Upsert floods
    for (const f of floods) {
      const existing = await Flood.findOne({
        title: f.title,
        'location.lat': f.location.lat,
        'location.lng': f.location.lng,
      })
      if (existing) {
        existing.description = f.description
        existing.severity = f.severity
        existing.status = f.status
        await existing.save()
      } else {
        const nf = new Flood(f)
        await nf.save()
      }
    }

    // Upsert shelters
    for (const s of shelters) {
      const existing = await Shelter.findOne({
        name: s.name,
        'location.lat': s.location.lat,
        'location.lng': s.location.lng,
      })
      if (existing) {
        existing.capacity = s.capacity
        existing.facilities = s.facilities
        existing.contact = s.contact
        existing.status = s.status
        await existing.save()
      } else {
        const ns = new Shelter(s)
        await ns.save()
      }
    }

    return { success: true, message: 'Mock flood and shelter data seeded' }
  } catch (error) {
    return { success: false, message: `Mock seed failed: ${error}` }
  }
}
