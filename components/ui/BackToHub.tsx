'use client'

import { useRouter } from 'next/navigation'
import { useSiteStore } from '@/lib/store'
import type { Animal } from '@/lib/types'

interface Props {
  animal: Animal
  /** Optional override label. Default '← 回到 hub'. */
  label?: string
}

/**
 * Sub-page → hub back link. Sets `skipIntroOnNextHub=true` before pushing so
 * the cat hub doesn't replay the particle entry animation when re-entered.
 */
export function BackToHub({ animal, label = '← 回到客厅' }: Props) {
  const router = useRouter()
  const setSkipIntroOnNextHub = useSiteStore((s) => s.setSkipIntroOnNextHub)

  const fontClass =
    animal === 'cat'
      ? 'font-cat-zh'
      : animal === 'wolf'
        ? 'font-wolf-zh'
        : 'font-deer-zh'

  const accentClass =
    animal === 'cat'
      ? 'text-cat-heading hover:text-cat-accent'
      : animal === 'wolf'
        ? 'text-wolf-heading hover:text-wolf-accent'
        : 'text-deer-heading hover:text-deer-accent'

  const handle = () => {
    setSkipIntroOnNextHub(true)
    router.push(`/${animal}`)
  }

  return (
    <button
      onClick={handle}
      className={`${fontClass} ${accentClass} text-sm tracking-wide transition-colors`}
    >
      {label}
    </button>
  )
}
