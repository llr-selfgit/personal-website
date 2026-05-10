export type Animal = 'cat' | 'wolf' | 'deer'

export interface AnimalPalette {
  bg: string
  mid: string
  highlight: string
  accent: string
  body: string
  heading: string
}

export interface AnimalVoice {
  greeting: string
  subgreeting?: string
  leaveMessage: string
  loading: string
  notFound: string
  essaysLink?: string
  toysLink?: string
  contactLabel?: string
}

export interface AnimalConfig {
  name: Animal
  displayName: string
  palette: AnimalPalette
  voice: AnimalVoice
  character: string
  hubBg: string
  entryBg: string
}

export type DeviceTier = 'high' | 'mid' | 'low'

export interface ParticleConfig {
  hubCharacter: number
  hubAmbient: number
  entryHover: number
  entryIdle: number
}

export interface RippleParams {
  speed: number
  maxRadius: number
  bandThickness: number
  pushStrength: number
  spawnInterval: number
  maxConcurrent: number
}

export interface Ripple {
  x: number
  y: number
  t: number
}
