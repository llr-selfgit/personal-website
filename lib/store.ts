'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Animal, DeviceTier, Ripple } from './types'
import { detectTierBrowser } from './device-tier'
import { PARTICLE_COUNTS } from './particles'

interface SiteState {
  currentAnimal: Animal | null
  lastAnimal: Animal | null
  tier: DeviceTier
  reduceMotion: boolean
  leaveMessageOpen: boolean
  switchAnimalOpen: boolean
  setAnimal: (a: Animal) => void
  setTier: (t: DeviceTier) => void
  setReduceMotion: (r: boolean) => void
  setLeaveMessageOpen: (o: boolean) => void
  setSwitchAnimalOpen: (o: boolean) => void
  reset: () => void
  getParticleCounts: () => typeof PARTICLE_COUNTS.high
}

export const useSiteStore = create<SiteState>()(
  persist(
    (set, get) => ({
      currentAnimal: null,
      lastAnimal: null,
      tier: 'mid',
      reduceMotion: false,
      leaveMessageOpen: false,
      switchAnimalOpen: false,
      setAnimal: (a) => set({ currentAnimal: a, lastAnimal: a }),
      setTier: (t) => set({ tier: t }),
      setReduceMotion: (r) => set({ reduceMotion: r }),
      setLeaveMessageOpen: (o) => set({ leaveMessageOpen: o }),
      setSwitchAnimalOpen: (o) => set({ switchAnimalOpen: o }),
      reset: () => set({
        currentAnimal: null,
        leaveMessageOpen: false,
        switchAnimalOpen: false,
      }),
      getParticleCounts: () => PARTICLE_COUNTS[get().tier],
    }),
    {
      name: 'personal-website-state',
      partialize: (s) => ({ lastAnimal: s.lastAnimal }), // 只持久化 lastAnimal
    }
  )
)

/** Initialize tier + reduceMotion on browser. Call once in client root. */
export function initStoreBrowser() {
  if (typeof window === 'undefined') return
  const tier = detectTierBrowser()
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  useSiteStore.setState({ tier, reduceMotion })
}
