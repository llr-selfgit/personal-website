'use client'

import { useState } from 'react'
import type { Animal } from '@/lib/types'
import type { Bio } from '@/content/cat/bio'

const PALETTES: Record<Animal, { ink: string; muted: string; accent: string; expandedBg: string }> = {
  cat:  { ink: '#e6d3a3', muted: '#c9a577', accent: '#b89868', expandedBg: 'rgba(20, 14, 6, 0.55)' },
  wolf: { ink: '#cbd6e0', muted: '#a0b4c8', accent: '#7a8b9c', expandedBg: 'rgba(8, 16, 26, 0.55)' },
  deer: { ink: '#ece8dd', muted: '#bfb39c', accent: '#a8957a', expandedBg: 'rgba(26, 22, 12, 0.55)' },
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

const TEXT_SHADOW = '0 1px 2px rgba(0, 0, 0, 0.75)'

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
        left: 'clamp(16px, 4vw, 40px)',
        top: 'clamp(80px, 12vw, 110px)',
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
        onClick={() => setOpen(true)}
        className={FONT_ZH[animal]}
        style={{
          background: 'transparent',
          border: 'none',
          padding: '8px 4px',
          color: palette.ink,
          textAlign: 'left',
          cursor: 'pointer',
          lineHeight: 1.55,
          textShadow: TEXT_SHADOW,
        }}
      >
        <div
          className={FONT_EN[animal]}
          style={{ fontSize: '11px', letterSpacing: '0.14em', opacity: 0.6, marginBottom: '6px', color: palette.muted }}
        >
          — note —
        </div>
        <div
          className={FONT_EN[animal]}
          style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '0.01em' }}
        >
          {bio.name.split(' · ')[0]}
        </div>
        <div
          className={FONT_EN[animal]}
          style={{ fontSize: '13px', opacity: 0.75, fontStyle: 'italic', marginTop: '4px', color: palette.muted }}
        >
          {bio.tagline}
        </div>
        <div
          style={{
            borderTop: `1px solid ${palette.accent}`,
            opacity: 0.35,
            marginTop: '14px',
            width: '64px',
          }}
        />
        <div
          className={FONT_EN[animal]}
          style={{ fontSize: '10px', opacity: 0.45, marginTop: '8px', color: palette.muted, fontStyle: 'italic' }}
        >
          read more →
        </div>
      </button>

      <div
        aria-hidden={!open}
        className={FONT_ZH[animal]}
        style={{
          position: 'absolute',
          left: '0',
          top: '0',
          width: 'min(320px, calc(100vw - 32px))',
          background: palette.expandedBg,
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          color: palette.ink,
          padding: '20px 22px',
          borderRadius: '4px',
          transform: open ? 'translateX(0)' : 'translateX(-10px)',
          opacity: open ? 1 : 0,
          visibility: open ? 'visible' : 'hidden',
          transition: 'transform 250ms ease-out, opacity 250ms ease-out, visibility 0s linear ' + (open ? '0s' : '250ms'),
          fontSize: '14px',
          lineHeight: 1.75,
          pointerEvents: open ? 'auto' : 'none',
          border: `1px solid ${palette.accent}33`,
        }}
      >
        <div
          className={FONT_EN[animal]}
          style={{ fontSize: '11px', letterSpacing: '0.14em', opacity: 0.55, marginBottom: '8px', color: palette.muted }}
        >
          — note —
        </div>
        <div className={FONT_EN[animal]} style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '0.01em' }}>
          {bio.name}
        </div>
        <div style={{ fontSize: '13px', fontStyle: 'italic', marginTop: '6px', opacity: 0.8 }}>
          {bio.role}
        </div>
        <div style={{ borderTop: `1px solid ${palette.accent}`, opacity: 0.3, marginTop: '12px', marginBottom: '12px' }} />
        <div>
          {bio.body.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        <div className={FONT_EN[animal]} style={{ fontSize: '12px', marginTop: '16px' }}>
          {bio.links.map((l, i) => (
            <span key={l.label}>
              {i > 0 && ' · '}
              <a
                href={l.href}
                style={{ color: palette.accent, textDecoration: 'none', borderBottom: `1px solid ${palette.accent}` }}
              >
                {l.label}
              </a>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
