import { describe, it, expect } from 'vitest'
import type { Animal, AnimalConfig, DeviceTier } from '@/lib/types'

describe('types', () => {
  it('Animal accepts cat/wolf/deer only', () => {
    const animals: Animal[] = ['cat', 'wolf', 'deer']
    expect(animals).toEqual(['cat', 'wolf', 'deer'])
  })

  it('AnimalConfig structurally valid', () => {
    const config: AnimalConfig = {
      name: 'cat',
      displayName: '猫',
      palette: { bg: '#2a1f15', mid: '#3a2a1c', highlight: '#d4a574', accent: '#ff9d6b', body: '#f0e6d2', heading: '#a18871' },
      voice: { greeting: '随意看看吧', leaveMessage: '在这世界踩个爪印吧', loading: '翻一会', notFound: '你走丢的方向我也没去过' },
      character: '/assets/cat/char-sketch.png',
      hubBg: '/assets/cat/bg-hub.png',
      entryBg: '/assets/cat/bg-entry.png',
    }
    expect(config.name).toBe('cat')
    expect(config.palette.accent).toBe('#ff9d6b')
  })

  it('DeviceTier accepts high/mid/low', () => {
    const tiers: DeviceTier[] = ['high', 'mid', 'low']
    expect(tiers.length).toBe(3)
  })
})
