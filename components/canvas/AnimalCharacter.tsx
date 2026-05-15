'use client'

import { useEffect, useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleField } from './ParticleField'
import { samplePositionsFromAlpha } from '@/lib/particles'
import { RippleManager, computeRippleForce, DEFAULT_RIPPLE_PARAMS } from '@/lib/ripple'
import { useIntroAnimation, INTRO_SIGMA } from '@/lib/intro-animation'
import { useSiteStore } from '@/lib/store'
import type { Animal } from '@/lib/types'

// 摄像机参数（next.config 里 PersistentCanvas 设的 fov=50, position.z=5）
const FOV_RAD = (50 * Math.PI) / 180
const CAM_Z = 5
const HALF_TAN = Math.tan(FOV_RAD / 2)
// 视口高度（世界单位）的一半 = tan(fov/2) * camera distance ≈ 2.33

// World-space ripple params（particles 在 ~[-1,1] 局部空间）
const RIPPLE_WORLD = {
  ...DEFAULT_RIPPLE_PARAMS,
  speed: 0.55,
  maxRadius: 0.32,
  bandThickness: 0.06,
  pushStrength: 0.08,
}

const PALETTES: Record<Animal, [number, number, number]> = {
  cat: [1.0, 0.85, 0.68],
  wolf: [0.65, 0.78, 0.95],
  deer: [0.92, 0.92, 0.85],
}

interface Props {
  animal: Animal
  count: number
  position?: [number, number, number]
  scale?: number
  /** When true, skip intro animation (e.g., returning from sub-page) */
  skipIntro?: boolean
}

export function AnimalCharacter({ animal, count, position = [0, 0, 0], scale = 1, skipIntro }: Props) {
  const [data, setData] = useState<{ positions: Float32Array; colors: Float32Array; sizes: Float32Array } | null>(null)
  const groupRef = useRef<THREE.Group>(null!)
  const pointsRef = useRef<THREE.Points | null>(null)
  const velocities = useRef<Float32Array | null>(null)
  const origins = useRef<Float32Array | null>(null)
  const introStarts = useRef<Float32Array | null>(null)
  const ripples = useRef(new RippleManager(RIPPLE_WORLD))

  const reduceMotion = useSiteStore((s) => s.reduceMotion)
  const intro = useIntroAnimation({ animal, skip: skipIntro || reduceMotion })

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, img.width, img.height)
      const positions = samplePositionsFromAlpha(imageData, count, 1)
      const n = positions.length / 3
      const colors = new Float32Array(n * 3)
      const sizes = new Float32Array(n)
      const [r, g, b] = PALETTES[animal]
      for (let i = 0; i < n; i++) {
        const jitter = 0.85 + Math.random() * 0.15
        colors[i * 3] = Math.min(1, r * jitter)
        colors[i * 3 + 1] = Math.min(1, g * jitter)
        colors[i * 3 + 2] = Math.min(1, b * jitter)
        sizes[i] = 1.2 + Math.random() * 1.8
      }
      const jittered = new Float32Array(positions.length)
      for (let i = 0; i < positions.length; i += 3) {
        // Gaussian-ish via 6-uniform sum (cheap)
        const g = (Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() - 3) / 1.7
        const g2 = (Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() - 3) / 1.7
        jittered[i] = positions[i] + g * INTRO_SIGMA
        jittered[i + 1] = positions[i + 1] + g2 * INTRO_SIGMA
        jittered[i + 2] = positions[i + 2] // depth unchanged
      }
      const initialPositions = (skipIntro || reduceMotion) ? positions : new Float32Array(jittered)
      origins.current = new Float32Array(positions) // origins are the TARGET (final)
      introStarts.current = jittered
      velocities.current = new Float32Array(positions.length)
      setData({ positions: initialPositions, colors, sizes })
    }
    img.src = `/assets/${animal}/char-sketch.png`
  }, [animal, count])

  // 鼠标 ripple — NDC → 世界坐标的正确转换
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      const W = window.innerWidth
      const H = window.innerHeight
      const aspect = W / H
      const worldHalfH = HALF_TAN * CAM_Z
      const worldHalfW = worldHalfH * aspect

      const ndcX = (e.clientX / W) * 2 - 1
      const ndcY = -(e.clientY / H) * 2 + 1
      const wx = ndcX * worldHalfW   // 世界 X
      const wy = ndcY * worldHalfH   // 世界 Y

      // 转 group local（粒子在 group local 空间里）
      const localX = (wx - position[0]) / scale
      const localY = (wy - position[1]) / scale
      ripples.current.spawn(localX, localY, performance.now())
    }
    window.addEventListener('pointermove', handler)
    return () => window.removeEventListener('pointermove', handler)
  }, [position, scale])

  useEffect(() => {
    if (groupRef.current && data) {
      pointsRef.current = groupRef.current.children[0] as THREE.Points
    }
  }, [data])

  useFrame((state) => {
    if (!groupRef.current || !data || !velocities.current || !origins.current) return
    const t = state.clock.elapsedTime

    // 呼吸：3% 缩放（明显但不浮夸）
    const breathe = 1 + Math.sin(t * 1.8) * 0.03
    groupRef.current.scale.setScalar(scale * breathe)

    // Intro animation: lerp positions from introStarts toward origins
    if (!intro.done && origins.current && introStarts.current && data) {
      const p = intro.particleProgress
      for (let i = 0; i < data.positions.length; i++) {
        data.positions[i] = introStarts.current[i] + (origins.current[i] - introStarts.current[i]) * p
      }
      if (pointsRef.current?.geometry.attributes.position) {
        ;(pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
      }
      // While intro is running, skip ripple/spring (positions are driven entirely by intro)
      return
    }

    const now = performance.now()
    ripples.current.tick(now)
    const active = ripples.current.getRipples()

    // 总有 spring-back 残余 velocity 时也要 update
    let hasMotion = active.length > 0
    if (!hasMotion) {
      for (let i = 0; i < velocities.current.length; i++) {
        if (Math.abs(velocities.current[i]) > 1e-4) {
          hasMotion = true
          break
        }
      }
    }
    if (!hasMotion) return

    const SPRING = 0.08
    const DAMP = 0.84
    const positions = data.positions

    for (let i = 0; i < positions.length; i += 3) {
      const px = positions[i]
      const py = positions[i + 1]
      const ox = origins.current[i]
      const oy = origins.current[i + 1]
      let fx = 0
      let fy = 0
      for (let k = 0; k < active.length; k++) {
        const force = computeRippleForce({
          particleX: px,
          particleY: py,
          ripple: active[k],
          currentTime: now,
          params: RIPPLE_WORLD,
        })
        fx += force.x
        fy += force.y
      }
      fx += (ox - px) * SPRING
      fy += (oy - py) * SPRING
      velocities.current[i] = velocities.current[i] * DAMP + fx
      velocities.current[i + 1] = velocities.current[i + 1] * DAMP + fy
      positions[i] += velocities.current[i]
      positions[i + 1] += velocities.current[i + 1]
    }

    if (pointsRef.current?.geometry.attributes.position) {
      ;(pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
    }
  })

  if (!data) return null

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <ParticleField
        positions={data.positions}
        colors={data.colors}
        sizes={data.sizes}
        introAlpha={intro.particleAlpha}
      />
    </group>
  )
}
