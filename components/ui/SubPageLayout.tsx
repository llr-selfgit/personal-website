import type { ReactNode } from 'react'
import { BackToHub } from './BackToHub'
import type { Animal } from '@/lib/types'

interface Props {
  animal: Animal
  title: string
  subtitle?: string
  children: ReactNode
}

/**
 * Shared layout for cat/wolf/deer sub-pages (essays, toys, photos).
 *
 * Visual language: warm/cold/earthy bg color matching the animal palette,
 * a thin top bar with the BackToHub button, large page title, content slot.
 * Intentionally no bg painting + no particle canvas — sub-pages are calm,
 * reader-focused. Hubs do the spectacle.
 */
export function SubPageLayout({ animal, title, subtitle, children }: Props) {
  const palette =
    animal === 'cat'
      ? {
          bg: 'bg-cat-bg',
          body: 'text-cat-body',
          heading: 'text-cat-highlight',
          subheading: 'text-cat-heading',
          accent: 'text-cat-accent',
          divider: 'border-cat-heading/30',
          fontZh: 'font-cat-zh',
          fontEn: 'font-cat-en',
        }
      : animal === 'wolf'
        ? {
            bg: 'bg-wolf-bg',
            body: 'text-wolf-body',
            heading: 'text-wolf-highlight',
            subheading: 'text-wolf-heading',
            accent: 'text-wolf-accent',
            divider: 'border-wolf-heading/30',
            fontZh: 'font-wolf-zh',
            fontEn: 'font-wolf-en',
          }
        : {
            bg: 'bg-deer-bg',
            body: 'text-deer-body',
            heading: 'text-deer-highlight',
            subheading: 'text-deer-heading',
            accent: 'text-deer-accent',
            divider: 'border-deer-heading/30',
            fontZh: 'font-deer-zh',
            fontEn: 'font-deer-en',
          }

  return (
    <div className={`min-h-screen ${palette.bg} ${palette.body} ${palette.fontZh}`}>
      <header className="max-w-3xl mx-auto px-6 md:px-10 pt-10 pb-8">
        <BackToHub animal={animal} />
      </header>

      <section className="max-w-3xl mx-auto px-6 md:px-10 pb-6">
        <h1
          className={`${palette.heading} ${palette.fontEn} text-5xl md:text-6xl italic tracking-tight`}
        >
          {title}
        </h1>
        {subtitle && (
          <p className={`${palette.subheading} ${palette.fontZh} mt-3 text-base opacity-80`}>
            {subtitle}
          </p>
        )}
        <div className={`mt-6 border-t ${palette.divider}`} />
      </section>

      <main className="max-w-3xl mx-auto px-6 md:px-10 pb-32">{children}</main>
    </div>
  )
}
