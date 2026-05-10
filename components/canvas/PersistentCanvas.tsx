'use client'

import { Canvas } from '@react-three/fiber'
import type { ReactNode } from 'react'

interface Props {
  children?: ReactNode
  /** When false, canvas is positioned absolutely (for spike / standalone use). Default true (fixed full-viewport). */
  fixed?: boolean
}

export function PersistentCanvas({ children, fixed = true }: Props) {
  return (
    <div
      style={{
        position: fixed ? 'fixed' : 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: fixed ? -1 : 1,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ pointerEvents: 'auto' }}
      >
        {children}
      </Canvas>
    </div>
  )
}
