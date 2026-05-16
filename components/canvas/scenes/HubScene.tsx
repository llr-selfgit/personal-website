'use client'

import { PersistentCanvas } from '../PersistentCanvas'
import { AnimalCharacter } from '../AnimalCharacter'
import { YarnDecoration } from '../YarnDecoration'
import { useSiteStore } from '@/lib/store'
import type { Animal } from '@/lib/types'

interface Props {
  animal: Animal
  skipIntro?: boolean
}

/**
 * Hub canvas: 全屏背景画 + 粒子角色。
 * 不直接做布局，layout 用 CSS 在 page.tsx 里安排。
 */
export function HubScene({ animal, skipIntro }: Props) {
  const reduceMotion = useSiteStore((s) => s.reduceMotion)
  const counts = useSiteStore((s) => s.getParticleCounts())

  // reduce-motion 时减少粒子，且禁用呼吸
  const charCount = reduceMotion ? Math.min(counts.hubCharacter / 4, 5000) : counts.hubCharacter

  // Yarn ball decoration sits LEFT of the cat (cat is at [1.0, -1.7]).
  // Spool anchor is the rest position (rightmost); ball rolls leftward.
  const showYarn = animal === 'cat' && !reduceMotion

  return (
    <PersistentCanvas fillParent>
      <ambientLight intensity={0.5} />
      <AnimalCharacter
        animal={animal}
        count={charCount}
        position={animal === 'cat' ? [2.0, -1.2, 0] : animal === 'wolf' ? [1.5, 0.3, 0] : [1.6, -0.2, 0]}
        scale={1.2}
        skipIntro={skipIntro}
        // Sync cat breathing with yarn rolling: same 13s period, phase
        // locked so inhale (scale max) ↔ yarn at rest, exhale (scale min)
        // ↔ yarn fully extended.
        breathPeriodSec={animal === 'cat' ? 13 : undefined}
      />
      {showYarn && (
        <YarnDecoration
          start={[-0.2, -2.05, 0]}
          travelX={0.9}
          scale={0.18}
          count={15000}
          periodSec={13}
        />
      )}
    </PersistentCanvas>
  )
}
