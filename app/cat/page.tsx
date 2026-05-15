'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { initStoreBrowser, useSiteStore } from '@/lib/store'
import { HubScene } from '@/components/canvas/scenes/HubScene'
import { TopBar } from '@/components/ui/TopBar'
import voice from '@/content/cat/voice.json'
import About from '@/content/cat/about.mdx'

export default function CatHubPage() {
  const setAnimal = useSiteStore((s) => s.setAnimal)
  const skipIntroOnNextHub = useSiteStore((s) => s.skipIntroOnNextHub)
  const setSkipIntroOnNextHub = useSiteStore((s) => s.setSkipIntroOnNextHub)
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

      {/* 粒子角色 canvas，z-index -10 在 bg 之上、内容之下 */}
      <HubScene animal="cat" skipIntro={skipThisIntro} />

      <div className="min-h-screen text-cat-body relative">
        <TopBar animal="cat" />

        {/* Hero — 慵懒长滚，留白大 */}
        <section className="pt-40 pb-32 px-8 max-w-2xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="font-cat-zh text-4xl md:text-5xl text-cat-heading font-semibold mb-6 tracking-wide"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
          >
            {voice.greeting}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            transition={{ duration: 1.5, delay: 0.6 }}
            className="font-cat-en italic text-cat-highlight text-lg"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
          >
            — find a corner that suits you —
          </motion.p>
        </section>

        {/* About body */}
        <article className="max-w-2xl mx-auto px-8 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            className="font-cat-zh text-lg leading-[1.85] space-y-7 text-cat-body"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}
          >
            <About />
          </motion.div>
        </article>

        {/* Nav 子页 — D persona "hover 才浮现" */}
        <nav className="max-w-2xl mx-auto px-8 pb-24">
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

        {/* Contact */}
        <footer className="max-w-2xl mx-auto px-8 pb-32">
          <p className="font-cat-zh text-base text-cat-body/60 mb-4">{voice.contactLabel}</p>
          <div className="flex gap-6 text-cat-accent">
            <a href="mailto:luolingrui1008@gmail.com" className="font-cat-en italic hover:underline">email</a>
            <a href="https://github.com/llr-selfgit" target="_blank" rel="noopener noreferrer" className="font-cat-en italic hover:underline">github</a>
          </div>
        </footer>
      </div>
    </>
  )
}
