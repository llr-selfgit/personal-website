import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NoteTag } from '../ui/NoteTag'
import { catBio } from '@/content/cat/bio'

describe('NoteTag', () => {
  it('renders tagline by default', () => {
    render(<NoteTag animal="cat" bio={catBio} textAlpha={1} />)
    expect(screen.getByText('llr')).toBeInTheDocument()
    expect(screen.getByText(catBio.tagline)).toBeInTheDocument()
    expect(screen.getByText(/hover to read more/i)).toBeInTheDocument()
  })

  it('hides expanded bio body until hover/focus', () => {
    render(<NoteTag animal="cat" bio={catBio} textAlpha={1} />)
    expect(screen.queryByText(catBio.body[0])).not.toBeVisible()
  })

  it('closes panel when Escape pressed', () => {
    render(<NoteTag animal="cat" bio={catBio} textAlpha={1} />)
    const button = screen.getByRole('button', { name: /关于/ })

    // Open via focus (bubbles up to wrapper's onFocus)
    fireEvent.focus(button)
    expect(screen.getByText(catBio.body[0])).toBeVisible()

    // Press Escape on the button — bubbles to wrapper's onKeyDown
    fireEvent.keyDown(button, { key: 'Escape' })
    expect(screen.queryByText(catBio.body[0])).not.toBeVisible()
  })
})
