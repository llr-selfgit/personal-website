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
  // Linear ramp with a brief hold at peak (no sin envelope) so every
  // adjacent-frame crossfade gets the same time budget — avoids the
  // ultra-fast 90ms transitions at the start/end of a sin curve, which
  // were causing visible flicker.
  const [frameValue, setFrameValue] = useState(0)
  const lastHandled = useRef(0)

  // Preload all PNGs at mount so the first crossfade doesn't trigger a
  // browser decode (which causes a one-frame visual stall).
  useEffect(() => {
    for (let i = 0; i < NUM_BOOK_FRAMES; i++) {
      const img = new Image()
      img.src = `/assets/cat/decorations/books-frame-${i}.png`
    }
  }, [])

  useEffect(() => {
    if (bookHoverTrigger === lastHandled.current) return
    lastHandled.current = bookHoverTrigger

    let raf = 0
    let startTime: number | null = null
    const maxFrame = NUM_BOOK_FRAMES - 1
    const tick = (now: number) => {
      if (startTime === null) startTime = now
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / BOOK_FLIP_DURATION_MS)
      let v: number
      if (progress < 0.45) {
        // forward ramp 0 → maxFrame
        v = (progress / 0.45) * maxFrame
      } else if (progress < 0.55) {
        // brief hold at peak so the eye registers the top frame
        v = maxFrame
      } else {
        // backward ramp maxFrame → 0
        v = ((1 - progress) / 0.45) * maxFrame
      }
      setFrameValue(v)
      if (progress < 1) raf = requestAnimationFrame(tick)
      else setFrameValue(0)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [bookHoverTrigger])

  // Compute per-frame opacities + a motion-blur intensity. Crossfading 4
  // hand-drawn frames in adjacent-pair mode shows visible double-image
  // ghosting halfway through each transition. Two tricks soften it:
  //   1. Cosine-eased opacity ramp (slower at start/end, faster in middle)
  //      so the eye spends less time looking at obvious 50/50 blends.
  //   2. CSS blur peaking at frac=0.5 — acts like motion blur on a
  //      camera capturing fast movement, papering over the discontinuity.
  const opacities = new Array<number>(NUM_BOOK_FRAMES).fill(0)
  const frameLow = Math.floor(frameValue)
  const frac = frameValue - frameLow
  const easedFrac = 0.5 - 0.5 * Math.cos(Math.PI * frac)
  if (frameLow >= NUM_BOOK_FRAMES - 1) {
    opacities[NUM_BOOK_FRAMES - 1] = 1
  } else {
    opacities[frameLow] = 1 - easedFrac
    opacities[frameLow + 1] = easedFrac
  }
  // Light motion blur during crossfade — capped at 1.5px so it stays
  // cheap on the GPU. 5px was heavy enough to drop frames and look like
  // flicker rather than smoothing.
  const blurPx = frameValue > 0 && frameLow < NUM_BOOK_FRAMES - 1
    ? 4 * frac * (1 - frac) * 1.5
    : 0

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
          filter: `sepia(0.3) brightness(0.95) blur(${blurPx}px)`,
          willChange: 'filter',
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
              willChange: 'opacity',
              transform: 'translateZ(0)',
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
