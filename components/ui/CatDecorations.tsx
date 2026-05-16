'use client'

/**
 * Cat hub decorative elements: 书堆 / 茶杯 / 毛线球.
 *
 * IMPORTANT: this component must be placed inside the cat hub scene
 * container (the 16:9 wrapper that locks bg + canvas + decorations to
 * the bg painting's aspect ratio). All positions are percentages of
 * that container, so they always align with the bg painting features
 * regardless of viewport size or aspect.
 */

interface Props {
  textAlpha?: number
}

export function CatDecorations({ textAlpha = 1 }: Props) {
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
      {/* ───── 书堆 — static, flush against floor in front of bg bookshelf ───── */}
      <div
        style={{
          position: 'absolute',
          left: '3%',
          bottom: '0',
          width: '11%',
          filter: 'sepia(0.35) brightness(0.92)',
          opacity: 0.85,
        }}
      >
        <img
          src="/assets/cat/decorations/deco-cat-books.png"
          alt=""
          style={{ width: '100%', height: 'auto', display: 'block' }}
          draggable={false}
        />
      </div>

      {/* ───── 茶杯 — overlays the bg painted teacup (% of scene) ───── */}
      <div
        style={{
          position: 'absolute',
          left: '29%',
          top: '60%',
          width: '8%',
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
