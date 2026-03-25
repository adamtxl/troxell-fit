'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const F = { display: "'Bebas Neue',cursive", body: "'Barlow',sans-serif", mono: "'DM Mono',monospace" }

export default function LoginPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      setError('Wrong PIN — try again')
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500&family=DM+Mono&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <div style={{ background: '#080808', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 340, textAlign: 'center' }}>
          <div style={{ fontFamily: F.display, fontSize: 36, color: '#c4f135', letterSpacing: 4, marginBottom: 8 }}>TROXELL FIT</div>
          <div style={{ fontSize: 12, color: '#555', fontFamily: F.body, marginBottom: 40, letterSpacing: 1.5, textTransform: 'uppercase' }}>Enter PIN to continue</div>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="••••••"
              autoFocus
              style={{ width: '100%', background: '#111', border: '1px solid #222', borderRadius: 8, padding: '14px 16px', color: '#f0f0f0', fontFamily: F.mono, fontSize: 24, textAlign: 'center', outline: 'none', letterSpacing: 8, marginBottom: 12 }}
            />
            {error && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 12, fontFamily: F.body }}>{error}</div>}
            <button
              type="submit"
              disabled={loading || !pin}
              style={{ width: '100%', padding: 14, background: pin ? '#c4f135' : '#222', border: 'none', borderRadius: 8, fontFamily: F.display, fontSize: 18, letterSpacing: 3, cursor: pin ? 'pointer' : 'default', color: pin ? '#000' : '#555', transition: 'all 0.15s' }}
            >
              {loading ? 'CHECKING...' : 'ENTER'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
