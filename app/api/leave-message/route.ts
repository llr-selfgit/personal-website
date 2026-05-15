import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { Resend } from 'resend'

const MAX_TEXT_LENGTH = 2000
const RATE_LIMIT_WINDOW_SEC = 60

interface Payload {
  animal: 'cat' | 'wolf' | 'deer'
  text: string
  sender?: string
}

function isValidPayload(body: unknown): body is Payload {
  if (typeof body !== 'object' || body === null) return false
  const b = body as Record<string, unknown>
  if (!['cat', 'wolf', 'deer'].includes(b.animal as string)) return false
  if (typeof b.text !== 'string' || b.text.trim().length === 0) return false
  if (b.text.length > MAX_TEXT_LENGTH) return false
  if (b.sender !== undefined && typeof b.sender !== 'string') return false
  return true
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }
  if (!isValidPayload(body)) {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
  }
  const { animal, text, sender } = body

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rlKey = `rl:leave:${ip}`
  const set = await kv.set(rlKey, 1, { ex: RATE_LIMIT_WINDOW_SEC, nx: true })
  if (set === null) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }

  const entry = {
    animal,
    text: text.trim(),
    sender: sender?.trim() || null,
    ip,
    userAgent: req.headers.get('user-agent') || null,
    timestamp: new Date().toISOString(),
  }
  try {
    await kv.lpush(`messages:${animal}`, JSON.stringify(entry))
  } catch (err) {
    console.error('kv lpush failed', err)
    return NextResponse.json({ ok: false, error: 'storage_failed' }, { status: 500 })
  }

  const recipient = process.env.RECIPIENT_EMAIL
  const resendKey = process.env.RESEND_API_KEY
  if (recipient && resendKey) {
    try {
      const resend = new Resend(resendKey)
      await resend.emails.send({
        from: 'Hub <onboarding@resend.dev>',
        to: recipient,
        subject: `[${animal} hub] ${entry.sender ? `from ${entry.sender}` : 'anonymous message'}`,
        text:
          `Animal: ${animal}\n` +
          `From:   ${entry.sender || 'anonymous'}\n` +
          `Time:   ${entry.timestamp}\n` +
          `IP:     ${ip}\n` +
          `\n${entry.text}`,
      })
    } catch (err) {
      console.error('resend email failed', err)
    }
  }

  return NextResponse.json({ ok: true })
}
