import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx,mdx}', './components/**/*.{ts,tsx}', './content/**/*.{md,mdx}'],
  theme: {
    extend: {
      colors: {
        cat: {
          bg: '#2a1f15',
          mid: '#3a2a1c',
          highlight: '#d4a574',
          accent: '#ff9d6b',
          body: '#f0e6d2',
          heading: '#a18871',
        },
        wolf: {
          bg: '#0a0f15',
          mid: '#0f1822',
          highlight: '#6e8aa8',
          accent: '#4a8cc4',
          body: '#c5d3df',
          heading: '#5e6a83',
        },
        deer: {
          bg: '#0f120a',
          mid: '#1f2018',
          highlight: '#c4baa0',
          accent: '#8a9b73',
          body: '#ebe7d6',
          heading: '#677252',
        },
      },
      fontFamily: {
        'cat-zh': ['var(--font-noto-serif-sc)', 'serif'],
        'cat-en': ['var(--font-eb-garamond)', 'serif'],
        'wolf-zh': ['var(--font-noto-serif-sc)', 'serif'],
        'wolf-en': ['var(--font-dm-serif-display)', 'serif'],
        'deer-zh': ['"LXGW WenKai"', 'var(--font-noto-serif-sc)', 'serif'],
        'deer-en': ['var(--font-cormorant-garamond)', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
