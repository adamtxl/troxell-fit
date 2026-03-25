import { sql } from '@/lib/db'
import TroxellFit from '@/components/TroxellFit'

async function getUserData(userId: string) {
  const [logs, workouts, settings] = await Promise.all([
    sql`SELECT date::text, weight, body_fat, calories, protein, water, sodium, potassium, magnesium, creatine, zepbound FROM logs WHERE user_id = ${userId} ORDER BY date ASC`,
    sql`SELECT date::text, type, phase, exercises FROM workouts WHERE user_id = ${userId} ORDER BY date ASC`,
    sql`SELECT workout_start_date::text as workout_start_date FROM settings WHERE user_id = ${userId}`,
  ])
  return {
    logs,
    workouts,
    workoutStartDate: settings[0]?.workout_start_date || new Date().toISOString().split('T')[0],
  }
}

export default async function Home() {
  const [adamData, tammyData] = await Promise.all([
    getUserData('adam'),
    getUserData('tammy'),
  ])

  return (
    <TroxellFit
      initialAdamData={adamData}
      initialTammyData={tammyData}
    />
  )
}
