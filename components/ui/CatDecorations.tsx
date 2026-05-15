'use client'

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
      {/* ───── 书堆 — static stack + occasional page-flip overlay ───── */}
      <div
        style={{
          position: 'absolute',
          left: 'min(7vw, 100px)',
          bottom: 'min(8vh, 80px)',
          width: 'clamp(120px, 13vw, 200px)',
          filter: 'sepia(0.35) brightness(0.92)',
          opacity: 0.8,
        }}
      >
        <img
          src="/assets/cat/decorations/deco-cat-books.png"
          alt=""
          style={{ width: '100%', height: 'auto', display: 'block' }}
          draggable={false}
        />
        {/* Page-flip overlay — sits over the open-book area on top of the
            stack. Approximate position; the brief flip animation hides any
            misalignment. */}
        <div
          className="deco-page-flip"
          style={{
            position: 'absolute',
            left: '24%',
            top: '14%',
            width: '40%',
            height: '8%',
            background:
              'linear-gradient(135deg, rgba(238, 224, 188, 0.72) 0%, rgba(204, 184, 144, 0.6) 100%)',
            borderRadius: '1px 3px 1px 1px',
            transformOrigin: 'center bottom',
            boxShadow: '0 1px 1px rgba(0,0,0,0.18)',
          }}
        />
      </div>

      {/* ───── 茶杯 — static cup, three drifting steam wisps ───── */}
      <div
        style={{
          position: 'absolute',
          left: 'min(22vw, 360px)',
          top: 'min(56vh, 560px)',
          width: 'clamp(70px, 7vw, 100px)',
          filter: 'sepia(0.3) brightness(0.95)',
          opacity: 0.82,
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

      {/* ───── 毛线球 — ball rolls + line stretches ───── */}
      {/* Container is wide enough for the rolling distance (~160px) plus
          the ball's own width. Ball starts at the right (spool point) and
          rolls left. Strand line extends from spool toward ball. */}
      <div
        style={{
          position: 'absolute',
          right: 'min(18vw, 360px)',
          bottom: 'min(15vh, 160px)',
          width: '260px',
          height: '90px',
          filter: 'sepia(0.3) brightness(0.95)',
          opacity: 0.82,
        }}
      >
        {/* Yarn strand — a thin line anchored to the right (spool point).
            Width grows/shrinks via keyframe to track the ball position. */}
        <div
          className="deco-yarn-line"
          style={{
            position: 'absolute',
            right: '40px', // start slightly inside the spool point (ball's center at rest)
            bottom: '28px', // roughly the ball's vertical center
            height: '1.2px',
            background: `linear-gradient(to left, ${INK_LINE} 0%, ${INK_LINE} 70%, rgba(58,38,18,0) 100%)`,
          }}
        />
        {/* Yarn ball — rolls horizontally; rotation locked to translation
            so it visually rolls, not floats. */}
        <img
          className="deco-yarn-ball"
          src="/assets/cat/decorations/deco-cat-yarn.png"
          alt=""
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 'clamp(56px, 6vw, 80px)',
            height: 'auto',
            display: 'block',
          }}
          draggable={false}
        />
      </div>
    </div>
  )
}
