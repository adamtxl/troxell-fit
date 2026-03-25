import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  const user = request.nextUrl.searchParams.get('user')
  if (!user) return NextResponse.json({ error: 'Missing user' }, { status: 400 })

  const rows = await sql`
    SELECT workout_start_date::text as workout_start_date
    FROM settings WHERE user_id = ${user}
  `
  return NextResponse.json(rows[0] || { workout_start_date: null })
}

export async function POST(request: NextRequest) {
  const { user, workout_start_date } = await request.json()
  await sql`
    INSERT INTO settings (user_id, workout_start_date)
    VALUES (${user}, ${workout_start_date})
    ON CONFLICT (user_id) DO UPDATE SET workout_start_date = EXCLUDED.workout_start_date
  `
  return NextResponse.json({ ok: true })
}
