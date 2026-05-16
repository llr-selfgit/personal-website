'use client'

import { useRef } from 'react'
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
 * Hover-target for the particle book stack (which lives in the canvas
 * one stacking-level back) is an HTML div here — R3F's pointer events
 * don't fire reliably when the canvas sits inside a negative-z-index
 * scene wrapper, so we detect hover in HTML and signal the canvas via
 * Zustand (bookHoverTrigger increments).
 */

interface Props {
  textAlpha?: number
}

export function CatDecorations({ textAlpha = 1 }: Props) {
  const triggerBookHover = useSiteStore((s) => s.triggerBookHover)
  // Debounce: ignore re-entries while a flip is already running (1.8s).
  const lastTrigger = useRef(0)
  const handleBookEnter = () => {
    const now = performance.now()
    if (now - lastTrigger.current < 1800) return
    lastTrigger.current = now
    triggerBookHover()
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
      {/* Invisible HTML hover target for the particle book stack in the
          canvas. Positioned by % so it tracks the scene at any viewport. */}
      <div
        onMouseEnter={handleBookEnter}
        style={{
          position: 'absolute',
          left: '4%',
          bottom: '0',
          width: '14%',
          height: '24%',
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
