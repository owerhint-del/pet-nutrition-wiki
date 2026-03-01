import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/payload'
import { RichText } from '@/lib/richtext'
import { TableOfContents } from '@/components/TableOfContents'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'articles',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  const article = docs[0]
  if (!article) return { title: 'Статья не найдена' }

  return {
    title: article.title,
    description: article.excerpt || `${article.title} — натуральное питание питомцев`,
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'articles',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })

  const article = docs[0]
  if (!article) notFound()

  const category = typeof article.category === 'object' ? article.category : null
  const tags = (article.tags || []).filter((t: any) => typeof t === 'object') as unknown as Array<{ id: number; name: string; slug: string }>
  const relatedArticles = (article.relatedArticles || []).filter((a: any) => typeof a === 'object') as unknown as Array<{ id: number; title: string; slug: string }>
  const linkedFrom = ((article.linkedFrom as any)?.docs || []) as Array<{ id: number; title: string; slug: string }>
  const featuredImage = typeof article.featuredImage === 'object' ? article.featuredImage : null
  const images = (article.images || []).filter((img: any) => typeof img === 'object') as unknown as Array<{ id: number; url?: string | null; alt: string; caption?: string | null }>

  return (
    <div>
      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm text-stone-500">
        <Link href="/" className="hover:text-sage-600">Главная</Link>
        {category && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/categories/${category.slug}`} className="hover:text-sage-600">
              {category.title}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-stone-700">{article.title}</span>
      </nav>

      <div className="flex gap-8">
        {/* Main content */}
        <article className="flex-1 min-w-0">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              {article.contentType === 'transcript' && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                  Видео-транскрипция
                </span>
              )}
              {article.contentType === 'guide' && (
                <span className="rounded-full bg-sage-100 px-3 py-1 text-sm font-medium text-sage-700">
                  Гайд
                </span>
              )}
              {article.species?.map((s) => (
                <span key={s} className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600">
                  {s === 'dogs' ? '🐕 Собаки' : '🐈 Кошки'}
                </span>
              ))}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-sage-800 mb-3">
              {article.title}
            </h1>
            {article.transcriptWordCount && article.transcriptWordCount > 3000 && (
              <p className="text-sm text-stone-400">
                ~{Math.round(article.transcriptWordCount / 200)} минут чтения
              </p>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {tags.map((tag) => (
                  <span key={tag.id} className="rounded-full bg-sage-50 px-3 py-1 text-xs text-sage-600 border border-sage-200">
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Featured image */}
          {featuredImage?.url && (
            <figure className="mb-8 rounded-xl overflow-hidden">
              <img
                src={featuredImage.url}
                alt={featuredImage.alt || article.title}
                className="w-full"
                loading="eager"
              />
              {featuredImage.caption && (
                <figcaption className="mt-2 text-sm text-stone-500 text-center">
                  {featuredImage.caption}
                </figcaption>
              )}
            </figure>
          )}

          {/* Article body */}
          <RichText content={article.content as any} />

          {/* Additional images */}
          {images.length > 0 && (
            <div className="mt-8 space-y-6">
              {images.map((img) => (
                <figure key={img.id} className="rounded-xl overflow-hidden">
                  <img
                    src={img.url || ''}
                    alt={img.alt || ''}
                    className="w-full"
                    loading="lazy"
                  />
                  {img.caption && (
                    <figcaption className="mt-2 text-sm text-stone-500 text-center">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}

          {/* Related articles */}
          {relatedArticles.length > 0 && (
            <section className="mt-12 pt-8 border-t border-sage-200">
              <h2 className="text-xl font-bold text-sage-800 mb-4">Связанные статьи</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    href={`/articles/${related.slug}`}
                    className="rounded-lg border border-sage-200 bg-white p-4 hover:border-sage-400 hover:shadow transition-all"
                  >
                    <h3 className="font-medium text-sage-700">{related.title}</h3>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Backlinks */}
          {linkedFrom.length > 0 && (
            <section className="mt-8 pt-8 border-t border-sage-200">
              <h2 className="text-lg font-semibold text-stone-600 mb-3">
                Эту статью цитируют
              </h2>
              <ul className="space-y-2">
                {linkedFrom.map((linked) => (
                  <li key={linked.id}>
                    <Link
                      href={`/articles/${linked.slug}`}
                      className="text-sage-600 hover:text-sage-500 hover:underline"
                    >
                      {linked.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>

        {/* Sidebar with TOC */}
        <aside className="hidden lg:block w-64 shrink-0">
          <TableOfContents />
        </aside>
      </div>
    </div>
  )
}
