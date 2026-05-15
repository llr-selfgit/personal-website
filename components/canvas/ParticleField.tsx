'use client'

import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

import vertSrc from './shaders/particle.vert.glsl'
import fragSrc from './shaders/particle.frag.glsl'

interface Props {
  positions: Float32Array
  colors: Float32Array
  sizes: Float32Array
  introAlpha?: number
  onTick?: (delta: number, points: THREE.Points) => void
}

export function ParticleField({ positions, colors, sizes, introAlpha, onTick }: Props) {
  const ref = useRef<THREE.Points>(null!)
  const { gl } = useThree()
  const pixelRatio = gl.getPixelRatio()

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    geom.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    return geom
  }, [positions, colors, sizes])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: vertSrc,
      fragmentShader: fragSrc,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: pixelRatio },
        uIntroAlpha: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    })
  }, [pixelRatio])

  useFrame((state, delta) => {
    if (!ref.current) return
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uIntroAlpha.value = introAlpha ?? 1
    onTick?.(delta, ref.current)
  })

  return <points ref={ref} geometry={geometry} material={material} />
}
