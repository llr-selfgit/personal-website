'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { initStoreBrowser, useSiteStore } from '@/lib/store'
import { HubScene } from '@/components/canvas/scenes/HubScene'
import { TopBar } from '@/components/ui/TopBar'
import { NoteTag } from '@/components/ui/NoteTag'
import { QuoteHero } from '@/components/ui/QuoteHero'
import { LeaveMessage } from '@/components/ui/LeaveMessage'
import { CatDecorations } from '@/components/ui/CatDecorations'
import { catBio } from '@/content/cat/bio'
import quotes from '@/content/cat/quotes.json'
import { useIntroAnimation } from '@/lib/intro-animation'
import voice from '@/content/cat/voice.json'

export default function CatHubPage() {
  const setAnimal = useSiteStore((s) => s.setAnimal)
  const skipIntroOnNextHub = useSiteStore((s) => s.skipIntroOnNextHub)
  const setSkipIntroOnNextHub = useSiteStore((s) => s.setSkipIntroOnNextHub)
  const reduceMotion = useSiteStore((s) => s.reduceMotion)
  const [skipThisIntro, setSkipThisIntro] = useState(false)

  useEffect(() => {
    initStoreBrowser()
    setAnimal('cat')
    // Snapshot + clear the flag on mount so navigation cycle is one-shot
    if (skipIntroOnNextHub) {
      setSkipThisIntro(true)
      setSkipIntroOnNextHub(false)
    }
  }, [setAnimal, skipIntroOnNextHub, setSkipIntroOnNextHub])

  const intro = useIntroAnimation({ animal: 'cat', skip: skipThisIntro || reduceMotion })

  return (
    <>
      {/* Scene container — locked to bg-hub.png aspect ratio (1672×941, ~16:9).
          Sized to cover the viewport (uses max() so it's always at least as
          large as the viewport; center + overflow:hidden trim the excess).
          Bg painting, particle canvas, and HTML decorations all live inside
          this container, positioned in % of its size, so they stay aligned
          with each other regardless of viewport size or aspect ratio. */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          // z-index 0 (not negative) — negative z places the element behind
          // the document root and browsers route pointer events oddly. The
          // sibling min-h-screen UI overlay below in the JSX naturally stacks
          // on top via DOM order.
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'max(100vw, calc(100vh * 1672 / 941))',
            height: 'max(100vh, calc(100vw * 941 / 1672))',
            pointerEvents: 'none',
          }}
        >
          {/* Bg painting + sepia overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              backgroundImage:
                'linear-gradient(rgba(42, 31, 21, 0.65), rgba(42, 31, 21, 0.78)), url(/assets/cat/bg-hub.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              pointerEvents: 'none',
            }}
          />

          {/* HTML decorations (% positions, relative to scene) */}
          <CatDecorations textAlpha={intro.textAlpha} />

          {/* Particle canvas (fills scene, world coords map to scene area) */}
          <HubScene animal="cat" skipIntro={skipThisIntro} />
        </div>
      </div>

      <div
        className="min-h-screen text-cat-body relative"
        style={{ pointerEvents: 'none' }}
      >
        <TopBar animal="cat" textAlpha={intro.textAlpha} />

        <NoteTag animal="cat" bio={catBio} textAlpha={intro.textAlpha} />

        {/* Centered + slightly right-shifted content column on ≥md.
            Mobile (< md): pure centered, no shift — keeps content fully on
            screen on narrow viewports. */}
        <div className="max-w-2xl mx-auto px-6 md:px-8 md:translate-x-[5vw]">
          <QuoteHero animal="cat" quotes={quotes} textAlpha={intro.textAlpha} />

          {/* Nav 子页 — D persona "hover 才浮现"
              外层 overlay 是 pointer-events:none（让画布接收 R3F hover）。
              每个 Link 各自 pointer-events:auto 开自己的点击区，其余空白
              透传给后面的画布。 */}
          <nav
            className="pb-24"
            style={{ opacity: intro.textAlpha, transition: 'opacity 350ms ease-out' }}
          >
            <ul className="inline-flex flex-col md:flex-row md:flex-wrap gap-x-8 gap-y-4 text-cat-heading opacity-50 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-700">
              <li>
                <Link href="/cat/essays" className="pointer-events-auto font-cat-zh text-lg border-b border-cat-accent/40 hover:border-cat-accent pb-1 transition">
                  {voice.essaysLink} →
                </Link>
              </li>
              <li>
                <Link href="/cat/toys" className="pointer-events-auto font-cat-zh text-lg border-b border-cat-accent/40 hover:border-cat-accent pb-1 transition">
                  {voice.toysLink} →
                </Link>
              </li>
              <li>
                <Link href="/cat/photos" className="pointer-events-auto font-cat-zh text-lg border-b border-cat-accent/40 hover:border-cat-accent pb-1 transition">
                  {voice.photosLink} →
                </Link>
              </li>
            </ul>
          </nav>

          {/* Leave-message form (replaces previous contact footer) */}
          <div className="pb-32">
            <LeaveMessage animal="cat" voice={voice} textAlpha={intro.textAlpha} />
          </div>
        </div>
      </div>
    </>
  )
}
