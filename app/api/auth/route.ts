import { NextRequest, NextResponse } from 'next/server'
import { signSession } from '@/middleware'

export async function POST(request: NextRequest) {
  const { pin } = await request.json()

  if (pin !== process.env.APP_PIN) {
    return NextResponse.json({ error: 'Wrong PIN' }, { status: 401 })
  }

  const token = await signSession()
  const res = NextResponse.json({ ok: true })
  res.cookies.set('tf_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
  return res
}
