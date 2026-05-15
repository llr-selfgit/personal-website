'use client'

/**
 * Cat hub decorative elements: 书堆 / 茶杯 / 毛线球.
 *
 * Each sits as an absolutely-positioned <img> overlay on top of the bg painting
 * but below the particle canvas. Ambient CSS animations (defined in globals.css)
 * bring them to life without JS-driven per-frame updates. Click targets on
 * books → /cat/essays and yarn → /cat/toys give them dual decorative + nav role.
 * Teacup is pure decoration with a steam wisp above.
 *
 * z-index hierarchy:
 *   bg painting: -20
 *   decorations: -10   (this component)
 *   canvas particle field: -1
 *   text/UI: 0+
 */

interface Props {
  textAlpha?: number
}

export function CatDecorations({ textAlpha = 1 }: Props) {
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -10,
        opacity: textAlpha * 0.78,
        transition: 'opacity 450ms ease-out',
        pointerEvents: 'none',
      }}
    >
      {/* 书堆 — bottom-left floor area, gentle sway */}
      <div
        style={{
          position: 'absolute',
          left: 'min(7vw, 100px)',
          bottom: 'min(8vh, 80px)',
          width: 'clamp(120px, 13vw, 200px)',
          mixBlendMode: 'multiply',
          filter: 'sepia(0.25)',
        }}
        className="deco-sway"
      >
        <img
          src="/assets/cat/decorations/deco-cat-books-raw.png"
          alt=""
          style={{ width: '100%', height: 'auto' }}
          draggable={false}
        />
      </div>

      {/* 茶杯 + 蒸汽 — mid-left near table, gentle drift */}
      <div
        style={{
          position: 'absolute',
          left: 'min(22vw, 360px)',
          top: 'min(56vh, 560px)',
          width: 'clamp(70px, 7vw, 100px)',
          mixBlendMode: 'multiply',
          filter: 'sepia(0.15)',
        }}
        className="deco-drift-tiny"
      >
        {/* Steam wisp (CSS-only, sits above the cup) */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '38%',
            top: '-22px',
            width: '14px',
            height: '24px',
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            background: 'radial-gradient(ellipse at center, rgba(244,230,200,0.5), rgba(244,230,200,0) 70%)',
          }}
          className="deco-steam"
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '58%',
            top: '-18px',
            width: '10px',
            height: '20px',
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            background: 'radial-gradient(ellipse at center, rgba(244,230,200,0.42), rgba(244,230,200,0) 70%)',
            animationDelay: '1.2s',
          }}
          className="deco-steam"
        />
        <img
          src="/assets/cat/decorations/deco-cat-teacup-raw.png"
          alt=""
          style={{ width: '100%', height: 'auto' }}
          draggable={false}
        />
      </div>

      {/* 毛线球 — near cat (right-bottom but offset), slow rotation */}
      <div
        style={{
          position: 'absolute',
          right: 'min(36vw, 720px)',
          bottom: 'min(15vh, 160px)',
          width: 'clamp(56px, 6vw, 90px)',
          mixBlendMode: 'multiply',
          filter: 'sepia(0.2)',
        }}
      >
        <img
          src="/assets/cat/decorations/deco-cat-yarn-raw.png"
          alt=""
          className="deco-rotate"
          style={{ width: '100%', height: 'auto' }}
          draggable={false}
        />
      </div>
    </div>
  )
}
