'use client'

import { useSiteStore } from '@/lib/store'
import type { Animal } from '@/lib/types'
import voiceCat from '@/content/cat/voice.json'
import voiceWolf from '@/content/wolf/voice.json'
import voiceDeer from '@/content/deer/voice.json'

const VOICE_MAP = {
  cat: voiceCat,
  wolf: voiceWolf,
  deer: voiceDeer,
}

interface Props {
  animal: Animal
  textAlpha?: number
}

export function TopBar({ animal, textAlpha }: Props) {
  const { setSwitchAnimalOpen, setLeaveMessageOpen } = useSiteStore()
  const voice = VOICE_MAP[animal]
  const accentClass = animal === 'cat' ? 'text-cat-accent' : animal === 'wolf' ? 'text-wolf-accent' : 'text-deer-accent'

  return (
    <header
      className="fixed top-0 right-0 z-20 p-4 flex items-center gap-2"
      style={{ opacity: textAlpha ?? 1, transition: 'opacity 350ms ease-out' }}
    >
      <button
        onClick={() => setSwitchAnimalOpen(true)}
        className={`px-3 py-1.5 text-xs ${accentClass} hover:opacity-100 opacity-70 transition border border-current rounded`}
        aria-label={voice.switchAnimal}
      >
        ⟲ {voice.switchAnimal}
      </button>
      <button
        onClick={() => setLeaveMessageOpen(true)}
        className={`px-3 py-1.5 text-xs ${accentClass} hover:opacity-100 opacity-70 transition border border-current rounded`}
        aria-label={voice.leaveMessage}
      >
        💬 {voice.leaveMessage}
      </button>
    </header>
  )
}
