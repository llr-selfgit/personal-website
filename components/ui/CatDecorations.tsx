'use client'

/**
 * Cat hub decorative elements: 书堆 / 茶杯 / 毛线球.
 *
 * Uses background-removed PNGs (transparent alpha). z-index -10 places them
 * above the bg painting but below the particle canvas, so they enrich the
 * scene without occluding the silhouette. Ambient CSS animations are defined
 * in globals.css.
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
        opacity: textAlpha,
        transition: 'opacity 450ms ease-out',
        pointerEvents: 'none',
      }}
    >
      {/* 书堆 — bottom-left floor, gentle sway */}
      <div
        style={{
          position: 'absolute',
          left: 'min(7vw, 100px)',
          bottom: 'min(8vh, 80px)',
          width: 'clamp(120px, 13vw, 200px)',
          filter: 'sepia(0.35) brightness(0.9)',
          opacity: 0.78,
        }}
        className="deco-sway"
      >
        <img
          src="/assets/cat/decorations/deco-cat-books.png"
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
          filter: 'sepia(0.3) brightness(0.95)',
          opacity: 0.82,
        }}
        className="deco-drift-tiny"
      >
        {/* Steam wisps (pure CSS) */}
        <div
          style={{
            position: 'absolute',
            left: '38%',
            top: '-22px',
            width: '14px',
            height: '24px',
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            background: 'radial-gradient(ellipse at center, rgba(244,230,200,0.55), rgba(244,230,200,0) 70%)',
          }}
          className="deco-steam"
        />
        <div
          style={{
            position: 'absolute',
            left: '58%',
            top: '-18px',
            width: '10px',
            height: '20px',
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            background: 'radial-gradient(ellipse at center, rgba(244,230,200,0.45), rgba(244,230,200,0) 70%)',
            animationDelay: '1.2s',
          }}
          className="deco-steam"
        />
        <img
          src="/assets/cat/decorations/deco-cat-teacup.png"
          alt=""
          style={{ width: '100%', height: 'auto' }}
          draggable={false}
        />
      </div>

      {/* 毛线球 — near cat, slow rotation */}
      <div
        style={{
          position: 'absolute',
          right: 'min(36vw, 720px)',
          bottom: 'min(15vh, 160px)',
          width: 'clamp(56px, 6vw, 90px)',
          filter: 'sepia(0.3) brightness(0.95)',
          opacity: 0.82,
        }}
      >
        <img
          src="/assets/cat/decorations/deco-cat-yarn.png"
          alt=""
          className="deco-rotate"
          style={{ width: '100%', height: 'auto' }}
          draggable={false}
        />
      </div>
    </div>
  )
}
