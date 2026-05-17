'use client'

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { ParticleField } from './ParticleField'
import { samplePositionsAndColorsFromAlpha } from '@/lib/particles'
import { useSiteStore } from '@/lib/store'

/**
 * Books decoration — 4-frame sprite, rendered as 4 cross-fading particle
 * clouds (one per hand-drawn frame). Each cloud's particles are sampled
 * from its PNG's alpha + RGB.
 *
 * Why particles instead of HTML <img> cross-fade: opaque PNGs overlapping
 * at the 50/50 midpoint of a crossfade produce visible double-image
 * "ghosting", which the user perceives as flicker. Sparse particles
 * crossfade more gracefully — overlap reads as "slightly denser sprinkle"
 * rather than "two opaque shapes layered". The transitions feel softer.
 *
 * Animation: bookHoverTrigger increments → linear ramp through frame
 * values 0 → 3 → 0 over flipDurationSec, with a small hold at the peak.
 * Opacity per cloud follows adjacent-frame crossfade with cosine easing.
 * Idle state: only frame 0 visible.
 */

interface Props {
  position: [number, number, number]
  scale?: number
  /** Per-frame particle count. Total particle load is 4 × this. */
  count?: number
  flipDurationSec?: number
}

interface FrameData {
  positions: Float32Array
  colors: Float32Array
  sizes: Float32Array
}

const NUM_FRAMES = 4
const PEAK_HOLD_FRAC = 0.1 // fraction of total duration spent at peak frame

export function BooksFrames({
  position,
  scale = 0.5,
  count = 6000,
  flipDurationSec = 1.8,
}: Props) {
  const [frames, setFrames] = useState<FrameData[] | null>(null)
  const [opacities, setOpacities] = useState<number[]>(() => {
    const init = new Array(NUM_FRAMES).fill(0)
    init[0] = 1
    return init
  })
  const bookHoverTrigger = useSiteStore((s) => s.bookHoverTrigger)
  const lastHandled = useRef(0)
  const animStart = useRef<number | null>(null)

  // Load + sample all 4 frames
  useEffect(() => {
    let cancelled = false
    const loaders = Array.from({ length: NUM_FRAMES }, (_, i) => {
      return new Promise<FrameData>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const c = document.createElement('canvas')
          c.width = img.width
          c.height = img.height
          const ctx = c.getContext('2d')!
          ctx.drawImage(img, 0, 0)
          const imageData = ctx.getImageData(0, 0, img.width, img.height)
          const { positions, colors } = samplePositionsAndColorsFromAlpha(
            imageData,
            count,
            1,
          )
          const n = positions.length / 3
          for (let j = 0; j < positions.length; j++) positions[j] *= scale
          const sizes = new Float32Array(n)
          for (let j = 0; j < n; j++) sizes[j] = 0.55 + Math.random() * 0.45
          resolve({ positions, colors, sizes })
        }
        img.onerror = reject
        img.src = `/assets/cat/decorations/books-frame-${i}.png`
      })
    })
    Promise.all(loaders).then((loaded) => {
      if (!cancelled) setFrames(loaded)
    })
    return () => {
      cancelled = true
    }
  }, [count, scale])

  // Trigger animation on each new bookHoverTrigger value
  useEffect(() => {
    if (bookHoverTrigger === lastHandled.current) return
    lastHandled.current = bookHoverTrigger
    if (animStart.current === null) {
      animStart.current = performance.now()
    }
  }, [bookHoverTrigger])

  // Drive opacities each animation frame
  useFrame(() => {
    if (animStart.current === null) return
    const elapsed = (performance.now() - animStart.current) / 1000
    const progress = elapsed / flipDurationSec
    if (progress >= 1) {
      animStart.current = null
      const rest = new Array(NUM_FRAMES).fill(0)
      rest[0] = 1
      setOpacities(rest)
      return
    }

    // Linear ramp with peak hold (no sin envelope — even pacing avoids
    // ultra-fast end-segment transitions that read as flicker).
    const maxFrame = NUM_FRAMES - 1
    const rampWidth = 0.5 - PEAK_HOLD_FRAC / 2
    let frameValue: number
    if (progress < rampWidth) {
      frameValue = (progress / rampWidth) * maxFrame
    } else if (progress < 1 - rampWidth) {
      frameValue = maxFrame
    } else {
      frameValue = ((1 - progress) / rampWidth) * maxFrame
    }

    const frameLow = Math.floor(frameValue)
    const frac = frameValue - frameLow
    // Cosine ease for smooth opacity ramp
    const eased = 0.5 - 0.5 * Math.cos(Math.PI * frac)
    const ops = new Array(NUM_FRAMES).fill(0)
    if (frameLow >= maxFrame) {
      ops[maxFrame] = 1
    } else {
      ops[frameLow] = 1 - eased
      ops[frameLow + 1] = eased
    }
    setOpacities(ops)
  })

  if (!frames) return null

  return (
    <group position={position}>
      {frames.map((f, i) => (
        <ParticleField
          key={i}
          positions={f.positions}
          colors={f.colors}
          sizes={f.sizes}
          introAlpha={opacities[i]}
        />
      ))}
    </group>
  )
}
