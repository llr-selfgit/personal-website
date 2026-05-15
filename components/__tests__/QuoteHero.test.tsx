import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuoteHero } from '../ui/QuoteHero'
import quotes from '@/content/cat/quotes.json'

describe('QuoteHero', () => {
  beforeEach(() => {
    // pin Math.random to first quote
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  it('renders selected quote text', () => {
    render(<QuoteHero animal="cat" quotes={quotes} textAlpha={1} />)
    expect(screen.getByText(quotes[0].text)).toBeInTheDocument()
  })

  it('renders signature with author and work', () => {
    render(<QuoteHero animal="cat" quotes={quotes} textAlpha={1} />)
    expect(screen.getByText(new RegExp(quotes[0].author))).toBeInTheDocument()
    expect(screen.getByText(new RegExp(quotes[0].work))).toBeInTheDocument()
  })

  it('includes translator when present', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    render(<QuoteHero animal="cat" quotes={quotes} textAlpha={1} />)
    expect(screen.getByText(/刘振瀛/)).toBeInTheDocument()
  })
})
