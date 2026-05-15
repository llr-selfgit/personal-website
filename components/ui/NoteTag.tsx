'use client'

import { useState } from 'react'
import type { Animal } from '@/lib/types'
import type { Bio } from '@/content/cat/bio'

const PALETTES: Record<Animal, { paper: string; ink: string; accent: string }> = {
  cat:  { paper: 'rgba(244, 230, 200, 0.42)', ink: '#2a1a08', accent: '#b89868' },
  wolf: { paper: 'rgba(216, 221, 228, 0.42)', ink: '#0e1620', accent: '#7a8b9c' },
  deer: { paper: 'rgba(236, 232, 221, 0.42)', ink: '#2e2718', accent: '#a8957a' },
}

const FONT_ZH: Record<Animal, string> = {
  cat: 'font-cat-zh',
  wolf: 'font-wolf-zh',
  deer: 'font-deer-zh',
}
const FONT_EN: Record<Animal, string> = {
  cat: 'font-cat-en',
  wolf: 'font-wolf-en',
  deer: 'font-deer-en',
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
        className={FONT_ZH[animal]}
        style={{
          width: '240px',
          background: palette.paper,
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          color: palette.ink,
          padding: '18px 16px',
          transform: 'rotate(-3deg)',
          boxShadow: '3px 5px 10px rgba(0,0,0,0.25)',
          textAlign: 'left',
          border: 'none',
          cursor: 'pointer',
          lineHeight: 1.55,
        }}
      >
        <div className={FONT_EN[animal]} style={{ fontSize: '13px', letterSpacing: '0.08em', opacity: 0.55, marginBottom: '6px' }}>— note —</div>
        <div className={FONT_EN[animal]} style={{ fontSize: '20px', fontWeight: 600 }}>{bio.name.split(' · ')[0]}</div>
        <div className={FONT_EN[animal]} style={{ fontSize: '13px', opacity: 0.75, fontStyle: 'italic', marginTop: '6px' }}>{bio.tagline}</div>
        <div className={FONT_EN[animal]} style={{ fontSize: '11px', opacity: 0.4, marginTop: '10px' }}>hover to read more →</div>
      </button>

      <div
        aria-hidden={!open}
        className={FONT_ZH[animal]}
        style={{
          position: 'absolute',
          left: '240px',
          top: 0,
          width: '320px',
          background: palette.paper,
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          color: palette.ink,
          padding: '18px 16px',
          marginLeft: '8px',
          transform: open ? 'translateX(0) rotate(-1deg)' : 'translateX(-10px) rotate(-3deg)',
          opacity: open ? 1 : 0,
          visibility: open ? 'visible' : 'hidden',
          transition: 'transform 250ms ease-out, opacity 250ms ease-out, visibility 0s linear ' + (open ? '0s' : '250ms'),
          boxShadow: '4px 6px 14px rgba(0,0,0,0.35)',
          fontSize: '14px',
          lineHeight: 1.7,
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        <div className={FONT_EN[animal]} style={{ fontSize: '17px', fontWeight: 700 }}>{bio.name}</div>
        <div style={{ fontSize: '13px', fontStyle: 'italic', marginTop: '6px', opacity: 0.85 }}>{bio.role}</div>
        <div style={{ marginTop: '12px' }}>
          {bio.body.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        <div className={FONT_EN[animal]} style={{ fontSize: '12px', marginTop: '14px' }}>
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
