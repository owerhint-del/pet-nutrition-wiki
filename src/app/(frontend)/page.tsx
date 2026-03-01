import Link from 'next/link'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const payload = await getPayloadClient()

  const [categories, latestArticles] = await Promise.all([
    payload.find({
      collection: 'categories',
      sort: 'order',
      limit: 20,
    }),
    payload.find({
      collection: 'articles',
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 6,
      depth: 1,
    }),
  ])

  return (
    <div>
      {/* Hero section */}
      <section className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-sage-800 mb-4">
          Натуральное питание питомцев
        </h1>
        <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-6">
          Открытая база знаний о переводе собак и кошек на натуральное питание.
          Проверенная информация от ветеринарных специалистов.
        </p>
        <div className="max-w-md mx-auto">
          <form action="/search" className="relative">
            <input
              type="search"
              name="q"
              placeholder="Найти статью, продукт, совет..."
              className="w-full rounded-xl border border-sage-300 bg-white px-5 py-3 text-base placeholder:text-stone-400 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-300"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-sage-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sage-500"
            >
              Найти
            </button>
          </form>
        </div>
      </section>

      {/* Categories grid */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-sage-800 mb-6">Разделы</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.docs.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group rounded-xl border border-sage-200 bg-white p-4 hover:border-sage-400 hover:shadow-md transition-all"
            >
              <div className="text-3xl mb-2">{cat.icon || '📁'}</div>
              <h3 className="font-semibold text-sage-700 group-hover:text-sage-600">
                {cat.title}
              </h3>
              {cat.description && (
                <p className="mt-1 text-xs text-stone-500 line-clamp-2">{cat.description}</p>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Latest articles */}
      <section>
        <h2 className="text-2xl font-bold text-sage-800 mb-6">Последние статьи</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestArticles.docs.map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="group rounded-xl border border-sage-200 bg-white p-5 hover:border-sage-400 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                {article.contentType === 'transcript' && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Видео
                  </span>
                )}
                {article.contentType === 'guide' && (
                  <span className="rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-700">
                    Гайд
                  </span>
                )}
                {article.species?.map((s) => (
                  <span key={s} className="text-xs text-stone-400">
                    {s === 'dogs' ? '🐕' : '🐈'}
                  </span>
                ))}
              </div>
              <h3 className="font-semibold text-sage-700 group-hover:text-sage-600 mb-2">
                {article.title}
              </h3>
              {article.excerpt && (
                <p className="text-sm text-stone-500 line-clamp-3">{article.excerpt}</p>
              )}
              {article.transcriptWordCount && article.transcriptWordCount > 5000 && (
                <p className="mt-2 text-xs text-stone-400">
                  ~{Math.round(article.transcriptWordCount / 200)} мин. чтения
                </p>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
