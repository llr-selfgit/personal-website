'use client'

import { useState } from 'react'
import type { Animal } from '@/lib/types'

interface VoiceCopy {
  leaveMessageHeading: string
  leaveMessagePlaceholder: string
  leaveMessageSubmit: string
  leaveMessageSuccess: string
  leaveMessageError: string
}

interface Props {
  animal: Animal
  voice: VoiceCopy
  textAlpha?: number
}

const PALETTES: Record<Animal, { panel: string; border: string; text: string; accent: string }> = {
  cat:  { panel: 'rgba(42, 31, 21, 0.45)', border: 'rgba(212, 165, 116, 0.35)', text: '#e6d3a3', accent: '#d4a574' },
  wolf: { panel: 'rgba(28, 37, 48, 0.45)', border: 'rgba(160, 180, 200, 0.3)',  text: '#cbd6e0', accent: '#a0b4c8' },
  deer: { panel: 'rgba(60, 50, 38, 0.40)', border: 'rgba(232, 224, 200, 0.3)',  text: '#ece8dd', accent: '#bfb39c' },
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function LeaveMessage({ animal, voice, textAlpha = 1 }: Props) {
  const [text, setText] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const palette = PALETTES[animal]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'submitting') return
    if (text.trim().length === 0) return
    setStatus('submitting')
    try {
      const res = await fetch('/api/leave-message', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ animal, text }),
      })
      if (!res.ok) {
        setStatus('error')
        return
      }
      setStatus('success')
      setText('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section
      style={{
        opacity: textAlpha,
        transition: 'opacity 350ms ease-out',
        background: palette.panel,
        border: `1px solid ${palette.border}`,
        borderRadius: '8px',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        padding: '24px 28px',
      }}
      className="font-cat-zh"
    >
      <h3
        style={{
          fontSize: '15px',
          color: palette.text,
          opacity: 0.75,
          marginBottom: '14px',
          letterSpacing: '0.03em',
        }}
      >
        {voice.leaveMessageHeading}
      </h3>
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={voice.leaveMessagePlaceholder}
          rows={4}
          maxLength={2000}
          disabled={status === 'submitting' || status === 'success'}
          style={{
            width: '100%',
            background: 'rgba(0, 0, 0, 0.18)',
            border: `1px solid ${palette.border}`,
            borderRadius: '6px',
            color: palette.text,
            padding: '12px 14px',
            fontSize: '14px',
            lineHeight: 1.7,
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            transition: 'border-color 200ms ease-out',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = palette.accent)}
          onBlur={(e) => (e.currentTarget.style.borderColor = palette.border)}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '12px',
            minHeight: '32px',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: palette.text,
              opacity: status === 'idle' ? 0 : 0.65,
              transition: 'opacity 250ms ease-out',
              fontStyle: 'italic',
            }}
          >
            {status === 'submitting' && '...'}
            {status === 'success' && voice.leaveMessageSuccess}
            {status === 'error' && voice.leaveMessageError}
          </span>
          <button
            type="submit"
            disabled={status === 'submitting' || status === 'success' || text.trim().length === 0}
            style={{
              background: 'transparent',
              border: `1px solid ${palette.accent}`,
              borderRadius: '4px',
              color: palette.accent,
              padding: '7px 18px',
              fontSize: '13px',
              fontFamily: 'inherit',
              cursor: text.trim().length === 0 ? 'not-allowed' : 'pointer',
              opacity: text.trim().length === 0 ? 0.4 : 0.85,
              transition: 'opacity 200ms ease-out, background 200ms ease-out',
            }}
            onMouseEnter={(e) => {
              if (text.trim().length > 0 && status === 'idle') {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = text.trim().length === 0 ? '0.4' : '0.85'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            {voice.leaveMessageSubmit}
          </button>
        </div>
      </form>
    </section>
  )
}
