'use client'

import { useEffect, useState } from 'react'
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
      {/* 全屏背景画 + sepia 渐变 overlay 让文字仍可读 */}
      <div
        className="fixed inset-0 -z-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(42, 31, 21, 0.65), rgba(42, 31, 21, 0.78)), url(/assets/cat/bg-hub.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        aria-hidden
      />

      {/* 装饰元素：书堆 / 茶杯 / 毛线球 - z-index -10，bg 之上、canvas 之下 */}
      <CatDecorations textAlpha={intro.textAlpha} />

      {/* 粒子角色 canvas，z-index -1 */}
      <HubScene animal="cat" skipIntro={skipThisIntro} />

      <div className="min-h-screen text-cat-body relative">
        <TopBar animal="cat" textAlpha={intro.textAlpha} />

        <NoteTag animal="cat" bio={catBio} textAlpha={intro.textAlpha} />
        <QuoteHero animal="cat" quotes={quotes} textAlpha={intro.textAlpha} />

        {/* Nav 子页 — D persona "hover 才浮现" */}
        <nav
          className="max-w-2xl mx-auto px-8 pb-24"
          style={{ opacity: intro.textAlpha, transition: 'opacity 350ms ease-out' }}
        >
          <ul className="flex flex-col md:flex-row gap-8 text-cat-heading opacity-50 hover:opacity-100 transition-opacity duration-700">
            <li>
              <a href="/cat/essays" className="font-cat-zh text-lg border-b border-cat-accent/40 hover:border-cat-accent pb-1 transition">
                {voice.essaysLink} →
              </a>
            </li>
            <li>
              <a href="/cat/toys" className="font-cat-zh text-lg border-b border-cat-accent/40 hover:border-cat-accent pb-1 transition">
                {voice.toysLink} →
              </a>
            </li>
          </ul>
        </nav>

        {/* Leave-message form (replaces previous contact footer) */}
        <div className="max-w-2xl mx-auto px-8 pb-32">
          <LeaveMessage animal="cat" voice={voice} textAlpha={intro.textAlpha} />
        </div>
      </div>
    </>
  )
}
