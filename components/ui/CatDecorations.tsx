'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Cat hub decorative elements: 书堆 / 茶杯 / 毛线球.
 *
 * Goal: each feels native to the scene, not "pasted on".
 * - Teacup: cup itself stays put; multiple steam wisps drift up with
 *   organic horizontal wandering and staggered timing.
 * - Books: stack stays put; a small page-shaped overlay periodically
 *   lifts and lays back down (visualizes a page being turned by a breeze).
 * - Yarn: ball rolls along a horizontal line, a yarn strand stretches
 *   from the spool point to the ball — strand grows / shrinks with the
 *   ball position. Rotation is in lockstep with translation so it rolls,
 *   not floats.
 *
 * z-index -10 (above bg painting, below particle canvas).
 */

interface Props {
  textAlpha?: number
}

const INK_LINE = 'rgba(58, 38, 18, 0.55)' // sepia-toned ink for yarn strand

export function CatDecorations({ textAlpha = 1 }: Props) {
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -10,
        opacity: textAlpha,
        transition: 'opacity 450ms ease-out',
        pointerEvents: 'none',
      }}
    >
      {/* ───── 书堆 — fully static, placed flush against the floor in
            front of the bg bookshelf (far left). ───── */}
      <div
        style={{
          position: 'absolute',
          left: 'min(4vw, 60px)',
          bottom: 0,
          width: 'clamp(120px, 13vw, 200px)',
          filter: 'sepia(0.35) brightness(0.92)',
          opacity: 0.85,
        }}
      ><img
          src="/assets/cat/decorations/deco-cat-books.png"
          alt=""
          style={{ width: '100%', height: 'auto', display: 'block' }}
          draggable={false}
        />
      </div>

      {/* ───── 茶杯 — static cup, sized to fully cover bg painted teacup ───── */}
      <div
        style={{
          position: 'absolute',
          left: 'min(28vw, 470px)',
          top: 'min(58vh, 580px)',
          width: 'clamp(110px, 9vw, 150px)',
          filter: 'sepia(0.3) brightness(0.95)',
          opacity: 0.95,
        }}
      >
        {/* Steam wisps — three with different sizes, positions, delays.
            Anchored above the cup so they appear to rise from the brew. */}
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

      {/* 毛线球已迁移到 R3F canvas（YarnDecoration），见 HubScene。 */}
    </div>
  )
}

/**
 * Hand-coded SVG yarn ball + dynamic strand (no longer mounted; kept for
 * reference if we revert from particle path back to SVG).
 *
 * Physics:
 *   - Ball rolls horizontally between spool (right) and end point (left)
 *     in a 13-second sine cycle.
 *   - Strand path origin is the spool anchor; its endpoint is the ball
 *     center. Recomputed every frame, so the strand truly grows / shrinks
 *     with the ball's position (not a faked CSS width animation).
 *   - Ball rotation = (distance from spool / ball circumference) × 360°,
 *     so a full revolution matches one ball-diameter of travel.
 *   - The strand path has a slight downward sag toward the middle of its
 *     length (gravity-like droop that follows the line's length).
 */
function SVGYarn() {
  const RADIUS = 22
  const SPOOL_X = 240
  const SPOOL_Y = 50
  const BALL_END_X = 60
  const TRAVEL = SPOOL_X - BALL_END_X
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const PERIOD_MS = 13000

  const [phase, setPhase] = useState(0) // 0..1
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    let raf = 0
    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now
      const t = ((now - startRef.current) % PERIOD_MS) / PERIOD_MS
      setPhase(t)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Smooth ease: cos curve so the ball decelerates at each end
  const u = (1 - Math.cos(phase * 2 * Math.PI)) / 2 // 0..1..0 over the period
  const ballX = SPOOL_X - u * TRAVEL
  const distanceTravelled = u * TRAVEL
  const rotation = -(distanceTravelled / CIRCUMFERENCE) * 360

  // Strand path: a quadratic curve from spool to ball center with a slight
  // downward sag proportional to its length (longer line = more droop).
  const strandLength = SPOOL_X - ballX
  const sag = Math.min(strandLength * 0.06, 6)
  const midX = (SPOOL_X + ballX) / 2
  const midY = SPOOL_Y + sag
  const strandD = `M ${SPOOL_X} ${SPOOL_Y} Q ${midX} ${midY} ${ballX} ${SPOOL_Y}`

  return (
    <svg
      viewBox="0 0 280 90"
      width="100%"
      height="100%"
      style={{ overflow: 'visible' }}
      aria-hidden
    >
      <defs>
        <filter id="yarn-rough">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="5" />
          <feDisplacementMap in="SourceGraphic" scale="0.8" />
        </filter>
      </defs>

      {/* Strand (drawn first so the ball overlaps the strand endpoint cleanly) */}
      <path
        d={strandD}
        stroke="rgba(58, 38, 18, 0.6)"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
        filter="url(#yarn-rough)"
      />

      {/* Spool anchor — a tiny stationary dot suggesting where the yarn is
          attached (the painted scene's general direction). */}
      <circle cx={SPOOL_X} cy={SPOOL_Y} r="1.2" fill="rgba(58, 38, 18, 0.5)" />

      {/* Ball — circle outline + a wound-yarn spiral inside, all rotating
          together with the ball. */}
      <g
        transform={`translate(${ballX} ${SPOOL_Y}) rotate(${rotation})`}
        filter="url(#yarn-rough)"
      >
        <circle
          r={RADIUS}
          fill="rgba(232, 210, 170, 0.35)"
          stroke="rgba(58, 38, 18, 0.6)"
          strokeWidth="1.2"
        />
        {/* Yarn winding lines on the ball — several arcs at different angles
            give the woven look. */}
        <path
          d="M -18 -6 Q -10 -16 4 -14 Q 16 -10 14 4 Q 10 16 -4 14 Q -16 10 -18 -6"
          stroke="rgba(58, 38, 18, 0.45)"
          strokeWidth="0.9"
          fill="none"
        />
        <path
          d="M -14 6 Q -4 -10 10 -6 Q 18 0 12 10 Q 2 16 -10 12 Q -18 6 -14 6"
          stroke="rgba(58, 38, 18, 0.35)"
          strokeWidth="0.8"
          fill="none"
        />
        <path
          d="M -8 -16 Q 6 -12 14 0 Q 10 14 -4 16 Q -16 10 -14 -4 Q -12 -14 -8 -16"
          stroke="rgba(58, 38, 18, 0.3)"
          strokeWidth="0.7"
          fill="none"
        />
      </g>
    </svg>
  )
}
