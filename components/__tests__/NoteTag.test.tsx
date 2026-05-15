import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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
})
