'use client'

import { useState } from 'react'
import type { Animal } from '@/lib/types'
import type { Bio } from '@/content/cat/bio'

const PALETTES: Record<Animal, { paper: string; ink: string; accent: string }> = {
  cat:  { paper: '#f4e6c8', ink: '#3a2818', accent: '#b89868' },
  wolf: { paper: '#d8dde4', ink: '#1c2530', accent: '#7a8b9c' },
  deer: { paper: '#ece8dd', ink: '#403828', accent: '#a8957a' },
}

interface Props {
  animal: Animal
  bio: Bio
  textAlpha: number
}

export function NoteTag({ animal, bio, textAlpha }: Props) {
  const [open, setOpen] = useState(false)
  const palette = PALETTES[animal]

  return (
    <div
      tabIndex={-1}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setOpen(false)
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false)
      }}
      style={{
        position: 'fixed',
        left: '32px',
        top: '100px',
        opacity: textAlpha,
        zIndex: 30,
        pointerEvents: textAlpha > 0.5 ? 'auto' : 'none',
        transition: 'opacity 250ms ease-out',
        outline: 'none',
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-label={`关于 ${bio.name}`}
        style={{
          width: '180px',
          background: palette.paper,
          color: palette.ink,
          padding: '14px 12px',
          transform: 'rotate(-3deg)',
          boxShadow: '4px 6px 12px rgba(0,0,0,0.5)',
          textAlign: 'left',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          lineHeight: 1.55,
        }}
      >
        <div style={{ fontSize: '11px', letterSpacing: '0.08em', opacity: 0.55, marginBottom: '4px' }}>— note —</div>
        <div style={{ fontSize: '14px', fontWeight: 600 }}>{bio.name.split(' · ')[0]}</div>
        <div style={{ fontSize: '11px', opacity: 0.7, fontStyle: 'italic', marginTop: '4px' }}>{bio.tagline}</div>
        <div style={{ fontSize: '9px', opacity: 0.4, marginTop: '6px' }}>hover to read more →</div>
      </button>

      <div
        aria-hidden={!open}
        style={{
          position: 'absolute',
          left: '180px',
          top: 0,
          width: '280px',
          background: palette.paper,
          color: palette.ink,
          padding: '18px 16px',
          marginLeft: '8px',
          transform: open ? 'translateX(0) rotate(-1deg)' : 'translateX(-10px) rotate(-3deg)',
          opacity: open ? 1 : 0,
          visibility: open ? 'visible' : 'hidden',
          transition: 'transform 250ms ease-out, opacity 250ms ease-out, visibility 0s linear ' + (open ? '0s' : '250ms'),
          boxShadow: '6px 10px 20px rgba(0,0,0,0.6)',
          fontSize: '13px',
          lineHeight: 1.65,
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div style={{ fontSize: '15px', fontWeight: 700 }}>{bio.name}</div>
        <div style={{ fontSize: '12px', fontStyle: 'italic', marginTop: '6px', opacity: 0.85 }}>{bio.role}</div>
        <div style={{ marginTop: '12px' }}>
          {bio.body.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        <div style={{ fontSize: '11px', marginTop: '14px', opacity: 0.55 }}>{bio.location}</div>
        <div style={{ fontSize: '11px', marginTop: '6px' }}>
          {bio.links.map((l, i) => (
            <span key={l.label}>
              {i > 0 && ' · '}
              <a href={l.href} style={{ color: palette.accent, textDecoration: 'none', borderBottom: `1px solid ${palette.accent}` }}>
                {l.label}
              </a>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
