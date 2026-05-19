import Link from 'next/link'
import { SubPageLayout } from '@/components/ui/SubPageLayout'
import { getToys } from '@/lib/content'

export const metadata = {
  title: '小玩意 · cat',
}

export default function CatToysIndex() {
  const toys = getToys('cat')

  return (
    <SubPageLayout
      animal="cat"
      title="toys"
      subtitle="一些做着玩的小东西。有的还没做完，留个影子在这里。"
    >
      {toys.length === 0 ? (
        <p className="text-cat-heading/70 italic mt-12">还没放出来什么，再等等。</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {toys.map((toy) => {
            const card = (
              <div className="h-full border border-cat-heading/30 hover:border-cat-accent/70 transition-colors p-6 bg-cat-mid/30">
                <div className="flex items-baseline justify-between gap-3 mb-3">
                  <h2 className="font-cat-zh text-xl text-cat-body">{toy.title}</h2>
                  {toy.status === 'wip' && (
                    <span className="font-cat-en text-xs text-cat-heading/70 italic">
                      wip
                    </span>
                  )}
                </div>
                <p className="text-cat-body/75 text-sm leading-relaxed">{toy.summary}</p>
              </div>
            )
            return (
              <li key={toy.slug}>
                {toy.href ? (
                  <Link
                    href={toy.href}
                    target={toy.href.startsWith('http') ? '_blank' : undefined}
                    rel={toy.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="block group h-full"
                  >
                    {card}
                  </Link>
                ) : (
                  card
                )}
              </li>
            )
          })}
        </ul>
      )}
    </SubPageLayout>
  )
}
