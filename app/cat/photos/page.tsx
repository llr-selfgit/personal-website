import Image from 'next/image'
import { SubPageLayout } from '@/components/ui/SubPageLayout'
import { getPhotos } from '@/lib/content'

export const metadata = {
  title: '照片 · cat',
}

export default function CatPhotosIndex() {
  const photos = getPhotos('cat')

  return (
    <SubPageLayout
      animal="cat"
      title="photos"
      subtitle="路过、想停一下的瞬间。"
    >
      {photos.length === 0 ? (
        <p className="text-cat-heading/70 italic mt-12">
          相册还没整理好，先空着。
        </p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {photos.map((photo, i) => (
            <li key={photo.src + i} className="space-y-2">
              <div className="relative w-full aspect-[4/3] overflow-hidden bg-cat-mid/40">
                <Image
                  src={photo.src}
                  alt={photo.alt ?? photo.caption ?? '照片'}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              {(photo.caption || photo.date) && (
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  {photo.caption && (
                    <p className="text-cat-body/80">{photo.caption}</p>
                  )}
                  {photo.date && (
                    <span className="font-cat-en text-cat-heading/60 tabular-nums whitespace-nowrap">
                      {photo.date}
                    </span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </SubPageLayout>
  )
}
