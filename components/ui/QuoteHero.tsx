'use client'

import { useState, useEffect } from 'react'
import type { Animal } from '@/lib/types'

export interface Quote {
  text: string
  author: string
  work: string
  translator?: string
}

interface Props {
  animal: Animal
  quotes: Quote[]
  textAlpha: number
}

const FONT_CLASS: Record<Animal, string> = {
  cat: 'font-cat-zh',
  wolf: 'font-wolf-en',
  deer: 'font-cat-zh',
}

export function QuoteHero({ animal, quotes, textAlpha }: Props) {
  const [index, setIndex] = useState<number>(() => Math.floor(Math.random() * quotes.length))

  // Re-pick on remount (e.g. via route revisit); index is already random on first render
  useEffect(() => {
    setIndex(Math.floor(Math.random() * quotes.length))
  }, [quotes])

  const q = quotes[index]

  return (
    <section
      style={{
        opacity: textAlpha,
        transition: 'opacity 350ms ease-out',
        maxWidth: '38rem',
        marginLeft: 'auto',
        marginRight: 'max(2rem, 10vw)',
      }}
      className="px-8 pt-40 pb-32"
    >
      <blockquote
        className={FONT_CLASS[animal]}
        style={{
          fontSize: 'clamp(1.6rem, 2.9vw, 2.35rem)',
          fontWeight: 500,
          lineHeight: 1.5,
          letterSpacing: '0.02em',
          textShadow: '0 2px 14px rgba(0,0,0,0.55)',
          color: '#f0dba8',
        }}
      >
        {q.text}
      </blockquote>
      <div
        style={{
          marginTop: '18px',
          textAlign: 'right',
          fontSize: '13px',
          opacity: 0.6,
          fontStyle: 'italic',
          color: '#c9a577',
        }}
      >
        — {q.author} · {q.work}
        {q.translator && <span style={{ opacity: 0.55 }}>（{q.translator} 译）</span>}
      </div>
    </section>
  )
}
