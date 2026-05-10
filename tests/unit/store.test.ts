import { describe, it, expect, beforeEach } from 'vitest'
import { useSiteStore } from '@/lib/store'

describe('useSiteStore', () => {
  beforeEach(() => {
    useSiteStore.getState().reset()
    useSiteStore.setState({ currentAnimal: null, lastAnimal: null, tier: 'mid' })
  })

  it('starts with no animal selected', () => {
    expect(useSiteStore.getState().currentAnimal).toBe(null)
  })

  it('setAnimal updates both currentAnimal and lastAnimal', () => {
    useSiteStore.getState().setAnimal('cat')
    expect(useSiteStore.getState().currentAnimal).toBe('cat')
    expect(useSiteStore.getState().lastAnimal).toBe('cat')
  })

  it('reset clears currentAnimal but keeps lastAnimal', () => {
    useSiteStore.getState().setAnimal('wolf')
    useSiteStore.getState().reset()
    expect(useSiteStore.getState().currentAnimal).toBe(null)
    expect(useSiteStore.getState().lastAnimal).toBe('wolf')
  })

  it('getParticleCounts returns config for current tier', () => {
    useSiteStore.getState().setTier('high')
    const counts = useSiteStore.getState().getParticleCounts()
    expect(counts.hubCharacter).toBe(80000)

    useSiteStore.getState().setTier('low')
    const lowCounts = useSiteStore.getState().getParticleCounts()
    expect(lowCounts.hubCharacter).toBe(15000)
  })

  it('drawer state toggles independently', () => {
    useSiteStore.getState().setLeaveMessageOpen(true)
    expect(useSiteStore.getState().leaveMessageOpen).toBe(true)
    expect(useSiteStore.getState().switchAnimalOpen).toBe(false)
  })
})
