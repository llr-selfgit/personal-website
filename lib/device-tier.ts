import type { DeviceTier } from './types'

export interface TierInputs {
  hasWebGL2: boolean
  deviceMemory: number
  hardwareConcurrency: number
  viewportWidth: number
}

export function detectTier(inputs: TierInputs): DeviceTier {
  if (!inputs.hasWebGL2) return 'low'
  if (inputs.deviceMemory >= 8 && inputs.hardwareConcurrency >= 8 && inputs.viewportWidth >= 1280) {
    return 'high'
  }
  if (inputs.deviceMemory >= 4 && inputs.viewportWidth >= 768) {
    return 'mid'
  }
  return 'low'
}

/** Browser-side runtime detection (returns 'low' on SSR). */
export function detectTierBrowser(): DeviceTier {
  if (typeof window === 'undefined') return 'low'
  const canvas = document.createElement('canvas')
  const gl2 = canvas.getContext('webgl2')
  return detectTier({
    hasWebGL2: !!gl2,
    deviceMemory: (navigator as { deviceMemory?: number }).deviceMemory ?? 4,
    hardwareConcurrency: navigator.hardwareConcurrency ?? 4,
    viewportWidth: window.innerWidth,
  })
}
