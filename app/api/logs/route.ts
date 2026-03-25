import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// GET /api/logs?user=adam
export async function GET(request: NextRequest) {
  const user = request.nextUrl.searchParams.get('user')
  if (!user || !['adam', 'tammy'].includes(user)) {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }

  const rows = await sql`
    SELECT date::text, weight, body_fat, calories, protein, water,
           sodium, potassium, magnesium, creatine, zepbound
    FROM logs
    WHERE user_id = ${user}
    ORDER BY date ASC
  `
  return NextResponse.json(rows)
}

// POST /api/logs  — upsert a single day's log
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { user, date, weight, body_fat, calories, protein, water,
          sodium, potassium, magnesium, creatine, zepbound } = body

  if (!user || !date) {
    return NextResponse.json({ error: 'Missing user or date' }, { status: 400 })
  }

  await sql`
    INSERT INTO logs (user_id, date, weight, body_fat, calories, protein, water,
                      sodium, potassium, magnesium, creatine, zepbound)
    VALUES (${user}, ${date},
            ${weight || null}, ${body_fat || null},
            ${calories || 0}, ${protein || 0}, ${water || 0},
            ${sodium || 0}, ${potassium || 0}, ${magnesium || 0},
            ${creatine || false}, ${zepbound || false})
    ON CONFLICT (user_id, date) DO UPDATE SET
      weight    = EXCLUDED.weight,
      body_fat  = EXCLUDED.body_fat,
      calories  = EXCLUDED.calories,
      protein   = EXCLUDED.protein,
      water     = EXCLUDED.water,
      sodium    = EXCLUDED.sodium,
      potassium = EXCLUDED.potassium,
      magnesium = EXCLUDED.magnesium,
      creatine  = EXCLUDED.creatine,
      zepbound  = EXCLUDED.zepbound
  `
  return NextResponse.json({ ok: true })
}
