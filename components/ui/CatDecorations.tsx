'use client'

import { useEffect, useRef, useState } from 'react'
import { useSiteStore } from '@/lib/store'

/**
 * Cat hub decorative elements: 书堆 / 茶杯 / 毛线球.
 *
 * IMPORTANT: this component must be placed inside the cat hub scene
 * container (the 16:9 wrapper that locks bg + canvas + decorations to
 * the bg painting's aspect ratio). All positions are percentages of
 * that container, so they always align with the bg painting features
 * regardless of viewport size or aspect.
 *
 * The books pile uses a 4-frame sprite animation: hover triggers a
 * forward-then-back cycle through frames 0 → 3 → 0, crossfading between
 * adjacent frames. PNGs are hand-illustrated states of the same stack
 * (flat / lifting / vertical / past-vertical), so the animation matches
 * the bg painting's drawing style exactly.
 */

interface Props {
  textAlpha?: number
}

const BOOK_FLIP_DURATION_MS = 1800
const NUM_BOOK_FRAMES = 4

export function CatDecorations({ textAlpha = 1 }: Props) {
  const bookHoverTrigger = useSiteStore((s) => s.bookHoverTrigger)
  const triggerBookHover = useSiteStore((s) => s.triggerBookHover)
  const lastTrigger = useRef(0)

  const handleBookEnter = () => {
    const now = performance.now()
    if (now - lastTrigger.current < BOOK_FLIP_DURATION_MS) return
    lastTrigger.current = now
    triggerBookHover()
  }

  // Sprite frame interpolation. frameValue ∈ [0, NUM_BOOK_FRAMES - 1].
  // It animates 0 → (NUM_FRAMES-1) → 0 over BOOK_FLIP_DURATION_MS via a
  // sin envelope on every increment of bookHoverTrigger.
  const [frameValue, setFrameValue] = useState(0)
  const lastHandled = useRef(0)

  useEffect(() => {
    if (bookHoverTrigger === lastHandled.current) return
    lastHandled.current = bookHoverTrigger

    let raf = 0
    let startTime: number | null = null
    const tick = (now: number) => {
      if (startTime === null) startTime = now
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / BOOK_FLIP_DURATION_MS)
      // Sin envelope: 0 → 1 → 0. Multiply by max frame index for fractional
      // frame position.
      const v = (NUM_BOOK_FRAMES - 1) * Math.sin(progress * Math.PI)
      setFrameValue(v)
      if (progress < 1) raf = requestAnimationFrame(tick)
      else setFrameValue(0)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [bookHoverTrigger])

  // Compute per-frame opacities: two adjacent frames crossfade based on
  // the fractional part of frameValue.
  const opacities = new Array<number>(NUM_BOOK_FRAMES).fill(0)
  const frameLow = Math.floor(frameValue)
  const frac = frameValue - frameLow
  if (frameLow >= NUM_BOOK_FRAMES - 1) {
    opacities[NUM_BOOK_FRAMES - 1] = 1
  } else {
    opacities[frameLow] = 1 - frac
    opacities[frameLow + 1] = frac
  }

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        opacity: textAlpha,
        transition: 'opacity 450ms ease-out',
        pointerEvents: 'none',
      }}
    >
      {/* ───── 书堆 — 4-frame sprite animation, hover-triggered ───── */}
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
          filter: 'sepia(0.3) brightness(0.95)',
        }}
      >
        {Array.from({ length: NUM_BOOK_FRAMES }, (_, i) => (
          <img
            key={i}
            src={`/assets/cat/decorations/books-frame-${i}.png`}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'bottom left',
              opacity: opacities[i],
              pointerEvents: 'none',
              userSelect: 'none',
            }}
            draggable={false}
          />
        ))}
      </div>

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
