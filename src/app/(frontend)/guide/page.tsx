import Link from 'next/link'
import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/payload'
import { RichText } from '@/lib/richtext'
import { TableOfContents } from '@/components/TableOfContents'

export const metadata: Metadata = {
  title: 'Полный гайд по переводу на натуральное питание',
  description: 'Пошаговое руководство по переводу собак и кошек на натуральное питание. От основ до продвинутых рационов.',
}

export default async function GuidePage() {
  const payload = await getPayloadClient()

  // Find the guide article
  const { docs } = await payload.find({
    collection: 'articles',
    where: { contentType: { equals: 'guide' } },
    limit: 1,
    depth: 2,
  })

  const guide = docs[0]

  // Also get all articles tagged as basics for a structured guide
  const { docs: basicArticles } = await payload.find({
    collection: 'articles',
    where: { status: { equals: 'published' } },
    sort: 'title',
    limit: 100,
    depth: 1,
  })

  return (
    <div>
      <nav className="mb-6 text-sm text-stone-500">
        <Link href="/" className="hover:text-sage-600">Главная</Link>
        <span className="mx-2">/</span>
        <span className="text-stone-700">Полный гайд</span>
      </nav>

      <div className="flex gap-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl md:text-4xl font-bold text-sage-800 mb-4">
            Полный гайд по переводу на натуральное питание
          </h1>
          <p className="text-stone-600 mb-8 max-w-2xl">
            Пошаговое руководство по переводу собак и кошек с промышленных кормов
            на натуральное питание. Собрано из материалов ветеринарных специалистов.
          </p>

          {guide ? (
            <RichText content={guide.content as any} />
          ) : (
            <div className="space-y-8">
              <p className="text-stone-500 italic">
                Полный гайд будет добавлен после импорта контента.
                Пока можете просмотреть статьи по разделам:
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {basicArticles.slice(0, 10).map((article) => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.slug}`}
                    className="rounded-lg border border-sage-200 bg-white p-4 hover:border-sage-400 hover:shadow transition-all"
                  >
                    <h3 className="font-medium text-sage-700">{article.title}</h3>
                    {article.excerpt && (
                      <p className="mt-1 text-sm text-stone-500 line-clamp-2">{article.excerpt}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="hidden lg:block w-64 shrink-0">
          <TableOfContents />
        </aside>
      </div>
    </div>
  )
}
