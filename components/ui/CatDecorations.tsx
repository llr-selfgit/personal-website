'use client'

import { useRef } from 'react'
import { useSiteStore } from '@/lib/store'

/**
 * Cat hub decorative elements: 茶杯 (+ invisible books hover-target).
 *
 * IMPORTANT: this component must be placed inside the cat hub scene
 * container (the 16:9 wrapper that locks bg + canvas + decorations to
 * the bg painting's aspect ratio). All positions are percentages of
 * that container, so they always align with the bg painting features
 * regardless of viewport size or aspect.
 *
 * The books pile itself is rendered as 4 cross-fading particle clouds
 * in the canvas (BooksFrames). Here we only hold the HTML hover target
 * over its on-screen area — R3F pointer events don't fire reliably from
 * within the negative-z-index scene wrapper, so hover detection has to
 * happen in plain DOM. On mouseEnter, increment bookHoverTrigger so the
 * canvas component picks it up and runs a flip cycle.
 */

interface Props {
  textAlpha?: number
}

const BOOK_FLIP_DURATION_MS = 1800

export function CatDecorations({ textAlpha = 1 }: Props) {
  const triggerBookHover = useSiteStore((s) => s.triggerBookHover)
  const lastTrigger = useRef(0)

  const handleBookEnter = () => {
    const now = performance.now()
    if (now - lastTrigger.current < BOOK_FLIP_DURATION_MS) return
    lastTrigger.current = now
    triggerBookHover()
  }

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        // Must be ABOVE the PersistentCanvas (zIndex 2 in fillParent mode)
        // so the books hover-target HTML div catches mouse events first.
        // Otherwise the canvas (which has pointer-events:auto for R3F event
        // detection) swallows them.
        zIndex: 3,
        opacity: textAlpha,
        transition: 'opacity 450ms ease-out',
        pointerEvents: 'none',
      }}
    >
      {/* Invisible hover target for the books (which are rendered as
          particles in BooksFrames within the canvas). */}
      <div
        onMouseEnter={handleBookEnter}
        style={{
          position: 'absolute',
          left: '2%',
          bottom: '0',
          width: '17%',
          height: '30%',
          pointerEvents: 'auto',
          cursor: 'default',
        }}
      />

      {/* ───── 茶杯 — overlays the bg painted teacup (% of scene) ───── */}
      <div
        style={{
          position: 'absolute',
          left: '28%',
          top: '48%',
          width: '9%',
          filter: 'sepia(0.3) brightness(0.95)',
          opacity: 0.95,
        }}
      >
        {/* Steam wisps anchored above the cup */}
        <div
          className="deco-steam-a"
          style={{
            position: 'absolute',
            left: '36%',
            top: '-26px',
            width: '14px',
            height: '24px',
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            background:
              'radial-gradient(ellipse at center, rgba(244,230,200,0.55), rgba(244,230,200,0) 70%)',
          }}
        />
        <div
          className="deco-steam-b"
          style={{
            position: 'absolute',
            left: '52%',
            top: '-22px',
            width: '11px',
            height: '20px',
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            background:
              'radial-gradient(ellipse at center, rgba(244,230,200,0.45), rgba(244,230,200,0) 70%)',
          }}
        />
        <div
          className="deco-steam-c"
          style={{
            position: 'absolute',
            left: '44%',
            top: '-30px',
            width: '9px',
            height: '17px',
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            background:
              'radial-gradient(ellipse at center, rgba(244,230,200,0.4), rgba(244,230,200,0) 70%)',
          }}
        />
        <img
          src="/assets/cat/decorations/deco-cat-teacup.png"
          alt=""
          style={{ width: '100%', height: 'auto', display: 'block' }}
          draggable={false}
        />
      </div>
    </div>
  )
}
