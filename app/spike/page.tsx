'use client'

import { useEffect, useState } from 'react'
import { PersistentCanvas } from '@/components/canvas/PersistentCanvas'
import { ParticleSpike } from '@/components/canvas/ParticleSpike'

export default function SpikePage() {
  const [count, setCount] = useState(50000)
  const [animal, setAnimal] = useState<'cat' | 'wolf' | 'deer'>('cat')
  const [fps, setFps] = useState(0)

  useEffect(() => {
    let last = performance.now()
    let frames = 0
    let raf: number
    const tick = () => {
      const now = performance.now()
      frames++
      if (now - last >= 500) {
        setFps(Math.round((frames * 1000) / (now - last)))
        last = now
        frames = 0
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const fpsColor = fps < 24 ? '#ff6b6b' : fps < 30 ? '#ffa07a' : '#9bd07c'

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#ddd', fontFamily: 'sans-serif' }}>
      <PersistentCanvas fixed={false}>
        <ParticleSpike count={count} src={`/assets/${animal}/char-sketch.png`} key={`${animal}-${count}`} />
      </PersistentCanvas>

      <div style={{ position: 'fixed', top: 16, left: 16, padding: 16, background: 'rgba(20,20,20,0.92)', borderRadius: 10, zIndex: 10, border: '1px solid #2a2a2a', maxWidth: 360 }}>
        <h2 style={{ fontSize: 14, color: '#ccc', margin: '0 0 12px' }}>粒子 spike (Day 2 关键测试)</h2>
        <div style={{ marginBottom: 8, fontSize: 12, color: '#888' }}>动物</div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {(['cat', 'wolf', 'deer'] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAnimal(a)}
              style={{
                padding: '6px 12px',
                background: animal === a ? '#2a2520' : '#1a1a1a',
                border: '1px solid ' + (animal === a ? '#d4a574' : '#333'),
                borderRadius: 4,
                color: animal === a ? '#d4a574' : '#aaa',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              {a === 'cat' ? '🐱 猫' : a === 'wolf' ? '🐺 狼' : '🦌 鹿'}
            </button>
          ))}
        </div>
        <div style={{ marginBottom: 8, fontSize: 12, color: '#888' }}>粒子数: <span style={{ color: '#d4a574', fontWeight: 600 }}>{count.toLocaleString()}</span></div>
        <input type="range" min={1000} max={150000} step={1000} value={count} onChange={(e) => setCount(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#d4a574' }} />
        <div style={{ display: 'flex', gap: 4, marginTop: 12, flexWrap: 'wrap' }}>
          {[8000, 15000, 40000, 50000, 70000, 80000, 100000].map((n) => (
            <button key={n} onClick={() => setCount(n)} style={{ padding: '4px 8px', background: count === n ? '#2a2520' : '#1a1a1a', border: '1px solid ' + (count === n ? '#d4a574' : '#333'), borderRadius: 3, color: count === n ? '#d4a574' : '#888', fontSize: 11, cursor: 'pointer' }}>{(n / 1000) | 0}K</button>
          ))}
        </div>
        <div style={{ marginTop: 14, fontSize: 11, color: '#666' }}>
          移动鼠标看 ripple 效果。<br/>
          spec § 7 / § 10:<br/>
          High tier hub 80K · Mid 50K · Low 15K
        </div>
      </div>

      <div style={{ position: 'fixed', top: 16, right: 16, padding: '10px 16px', background: 'rgba(20,20,20,0.92)', borderRadius: 8, border: '1px solid #2a2a2a', zIndex: 10, textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>FPS</div>
        <div style={{ fontSize: 24, color: fpsColor, fontWeight: 700 }}>{fps}</div>
      </div>

      <div style={{ position: 'fixed', bottom: 16, right: 16, padding: 12, background: 'rgba(20,20,20,0.85)', borderRadius: 8, border: '1px solid #2a2a2a', fontSize: 11, color: '#888', lineHeight: 1.6 }}>
        60 fps = 桌面目标<br/>
        30 fps = 移动端目标<br/>
        &lt;24 fps = 红线，需降级
      </div>
    </div>
  )
}
