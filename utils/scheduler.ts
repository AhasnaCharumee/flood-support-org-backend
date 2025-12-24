import cron from 'node-cron'
import { fetchGovFloodData, fetchGovShelterData } from '../utils/govApi'

/**
 * Initialize scheduled tasks for government data sync
 */
export function initScheduledTasks(): void {
  // Sync government flood data every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled government flood data sync...')
    await fetchGovFloodData()
  })

  // Sync government shelter data every 2 hours
  cron.schedule('0 */2 * * *', async () => {
    console.log('Running scheduled government shelter data sync...')
    await fetchGovShelterData()
  })

  console.log('Scheduled tasks initialized')
  console.log('- Flood data sync: Every hour')
  console.log('- Shelter data sync: Every 2 hours')
}

// Example schedules:
// '0 * * * *'       - Every hour at minute 0
// '0 */2 * * *'     - Every 2 hours
// '*/30 * * * *'    - Every 30 minutes
// '0 0 * * *'       - Every day at midnight
// '0 6,18 * * *'    - Every day at 6 AM and 6 PM
