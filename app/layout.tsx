import type { Metadata } from 'next'
import { Noto_Serif_SC, EB_Garamond, DM_Serif_Display, Cormorant_Garamond } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const notoSerifSC = Noto_Serif_SC({
  weight: ['400', '500', '600', '700', '900'],
  subsets: ['latin'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
})

const ebGaramond = EB_Garamond({
  style: ['normal', 'italic'],
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-eb-garamond',
  display: 'swap',
})

const dmSerifDisplay = DM_Serif_Display({
  weight: ['400'],
  style: ['italic'],
  subsets: ['latin'],
  variable: '--font-dm-serif-display',
  display: 'swap',
})

const cormorantGaramond = Cormorant_Garamond({
  weight: ['400', '500', '700'],
  style: ['italic'],
  subsets: ['latin'],
  variable: '--font-cormorant-garamond',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '个人网站 · 三动物粒子美学',
  description: '三种动物，三种世界，三种自我的可能。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVars = `${notoSerifSC.variable} ${ebGaramond.variable} ${dmSerifDisplay.variable} ${cormorantGaramond.variable}`
  return (
    <html lang="zh-CN" className={fontVars}>
      <body>
        <main>{children}</main>
        <Analytics />
      </body>
    </html>
  )
}
