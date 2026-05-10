'use client'

import { PersistentCanvas } from '../PersistentCanvas'
import { AnimalCharacter } from '../AnimalCharacter'
import { useSiteStore } from '@/lib/store'
import type { Animal } from '@/lib/types'

interface Props {
  animal: Animal
}

/**
 * Hub canvas: 全屏背景画 + 粒子角色。
 * 不直接做布局，layout 用 CSS 在 page.tsx 里安排。
 */
export function HubScene({ animal }: Props) {
  const reduceMotion = useSiteStore((s) => s.reduceMotion)
  const counts = useSiteStore((s) => s.getParticleCounts())

  // reduce-motion 时减少粒子，且禁用呼吸
  const charCount = reduceMotion ? Math.min(counts.hubCharacter / 4, 5000) : counts.hubCharacter

  return (
    <PersistentCanvas fixed>
      <ambientLight intensity={0.5} />
      <AnimalCharacter
        animal={animal}
        count={charCount}
        position={animal === 'cat' ? [1.0, -1.1, 0] : animal === 'wolf' ? [1.5, 0.3, 0] : [1.6, -0.2, 0]}
        scale={1.2}
      />
    </PersistentCanvas>
  )
}
