import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// GET /api/workouts?user=adam
export async function GET(request: NextRequest) {
  const user = request.nextUrl.searchParams.get('user')
  if (!user || !['adam', 'tammy'].includes(user)) {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }

  const rows = await sql`
    SELECT date::text, type, phase, exercises
    FROM workouts
    WHERE user_id = ${user}
    ORDER BY date ASC
  `
  return NextResponse.json(rows)
}

// POST /api/workouts — upsert a workout session
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { user, date, type, phase, exercises } = body

  if (!user || !date) {
    return NextResponse.json({ error: 'Missing user or date' }, { status: 400 })
  }

  await sql`
    INSERT INTO workouts (user_id, date, type, phase, exercises)
    VALUES (${user}, ${date}, ${type}, ${phase}, ${JSON.stringify(exercises)})
    ON CONFLICT (user_id, date) DO UPDATE SET
      type      = EXCLUDED.type,
      phase     = EXCLUDED.phase,
      exercises = EXCLUDED.exercises
  `
  return NextResponse.json({ ok: true })
}
