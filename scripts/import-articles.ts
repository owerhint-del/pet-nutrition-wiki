/**
 * Import specific articles into an existing category
 *
 * Usage: DATABASE_URL=... PAYLOAD_SECRET=... npx tsx scripts/import-articles.ts
 *
 * Edit the ARTICLES array below to specify what to import.
 */

import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const CONTENT_DIR = process.env.CONTENT_DIR || '/Users/nmaximov/Documents/TgAssistant/Телеграм Ветеринарка/collected'

// ===== CONFIGURE THESE =====
const TARGET_CATEGORY_SLUG = 'perevod-ratsion-produkty-oshibki'
const SECTION_NAME = 'Видео-эфиры'
const ORDER_START = 14 // continue after existing 13 articles

const ARTICLES = [
  {
    folder: 'zdorovoe_pitanie/01_1197_gaid_po_perevodu',
    title: 'Гайд по переводу и введению продуктов',
    msgId: 1197,
    chatId: '1775135187',
    transcriptWords: 11525,
  },
  {
    folder: 'zdorovoe_pitanie/02_17395_perevod_ne_po_sheme',
    title: 'Перевод не по схеме. Ошибки',
    msgId: 17395,
    chatId: '1775135187',
    transcriptWords: 7060,
  },
  {
    folder: 'zdorovoe_pitanie/03_714_pochemu_ne_rabotaet',
    title: 'Почему натуральное питание «не работает»',
    msgId: 714,
    chatId: '1395594829',
    transcriptWords: 15466,
  },
  {
    folder: 'zdorovoe_pitanie/04_9900_mify_stereotipy',
    title: 'Мифы и стереотипы питания',
    msgId: 9900,
    chatId: '1775135187',
    transcriptWords: 5965,
  },
  {
    folder: 'zdorovoe_pitanie/05_22490_racion_porody',
    title: 'Отличается ли рацион у представителей разных пород',
    msgId: 22490,
    chatId: '1775135187',
  },
]
// ===== END CONFIG =====

function slugify(text: string): string {
  const ru: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
    з: 'z', и: 'i', й: 'j', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
    п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
    ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu',
    я: 'ya',
  }
  return text.toLowerCase().split('').map((c) => ru[c] || c).join('')
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

function extractHashtags(text: string): string[] {
  const tags = text.match(/#[а-яёa-z0-9_]+/gi) || []
  return [...new Set(tags.map((t) => t.toLowerCase()))]
}

function parseBoldText(text: string): object[] {
  const segments: object[] = []
  for (const part of text.split(/(\*\*.*?\*\*)/g)) {
    if (!part) continue
    if (part.startsWith('**') && part.endsWith('**')) {
      segments.push({ type: 'text', version: 1, text: part.slice(2, -2), format: 1, detail: 0, mode: 'normal', style: '' })
    } else {
      segments.push({ type: 'text', version: 1, text: part, format: 0, detail: 0, mode: 'normal', style: '' })
    }
  }
  return segments
}

function textToLexical(text: string): object {
  const cleaned = text.replace(/\[?\*?\*?[◀️↩️].*$/gms, '').trim()
  const children: object[] = []
  for (const line of cleaned.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) {
      children.push({ type: 'paragraph', version: 1, children: [], direction: null, format: '', indent: 0, textFormat: 0, textStyle: '' })
      continue
    }
    if (/^#[а-яёa-z]/.test(trimmed) && !trimmed.includes(' ')) continue
    if (/^(#[а-яёa-z0-9_]+\s*)+$/i.test(trimmed)) continue
    children.push({ type: 'paragraph', version: 1, children: parseBoldText(trimmed), direction: 'ltr', format: '', indent: 0, textFormat: 0, textStyle: '' })
  }
  return { root: { type: 'root', version: 1, children, direction: 'ltr', format: '', indent: 0 } }
}

async function main() {
  console.log(`\nImporting ${ARTICLES.length} articles into "${TARGET_CATEGORY_SLUG}" / [${SECTION_NAME}]\n`)

  const payload = await getPayload({ config })

  // Find target category
  const { docs: cats } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: TARGET_CATEGORY_SLUG } },
    limit: 1,
  })
  if (!cats.length) {
    console.error(`Category not found: ${TARGET_CATEGORY_SLUG}`)
    process.exit(1)
  }
  const categoryId = cats[0].id
  console.log(`Category: ${cats[0].title} (id: ${categoryId})\n`)

  let order = ORDER_START

  for (const art of ARTICLES) {
    const folderPath = path.join(CONTENT_DIR, art.folder)
    if (!fs.existsSync(folderPath)) {
      console.log(`  SKIP: folder not found — ${art.folder}`)
      continue
    }

    // Read text
    let textContent = ''
    const textPath = path.join(folderPath, 'text.txt')
    if (fs.existsSync(textPath)) textContent = fs.readFileSync(textPath, 'utf-8')

    // Read transcript
    let transcriptContent = ''
    const transcriptPath = path.join(folderPath, 'transcript.txt')
    if (fs.existsSync(transcriptPath)) transcriptContent = fs.readFileSync(transcriptPath, 'utf-8')

    // Upload images
    const imageFiles = fs.readdirSync(folderPath).filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
    const mediaIds: number[] = []
    for (const imgFile of imageFiles) {
      try {
        const imgBuffer = fs.readFileSync(path.join(folderPath, imgFile))
        const ext = imgFile.split('.').pop()?.toLowerCase()
        const media = await payload.create({
          collection: 'media',
          data: { alt: art.title },
          file: { data: imgBuffer, name: imgFile, mimetype: `image/${ext === 'jpg' ? 'jpeg' : ext}`, size: imgBuffer.length },
        })
        mediaIds.push(media.id as number)
      } catch (e: any) {
        console.log(`    WARN: image upload failed: ${imgFile}`)
      }
    }

    // Tags
    const articleTags = extractHashtags(textContent)
    const tagIds: number[] = []
    for (const tag of articleTags) {
      const existing = await payload.find({ collection: 'tags', where: { slug: { equals: slugify(tag.replace('#', '')) } }, limit: 1 })
      if (existing.docs.length > 0) {
        tagIds.push(existing.docs[0].id as number)
      } else {
        try {
          const newTag = await payload.create({ collection: 'tags', data: { name: tag, slug: slugify(tag.replace('#', '')) } })
          tagIds.push(newTag.id as number)
        } catch {}
      }
    }

    // Content type
    const contentType = transcriptContent ? 'transcript' : 'article'

    // Build content
    const fullText = transcriptContent
      ? textContent + '\n\n---\n\n## Транскрипция\n\n' + transcriptContent
      : textContent

    // Excerpt
    const excerptSource = textContent || transcriptContent
    const excerpt = excerptSource
      .replace(/\*\*/g, '').replace(/#[а-яёa-z0-9_]+/gi, '').replace(/\[.*?\]\(.*?\)/g, '')
      .trim().split('\n').filter((l) => l.trim()).slice(0, 3).join(' ').slice(0, 200)

    const transcriptWordCount = art.transcriptWords || (transcriptContent ? transcriptContent.split(/\s+/).length : undefined)

    // Get date from meta.json
    let publishDate = new Date().toISOString()
    const metaPath = path.join(CONTENT_DIR, art.chatId, String(art.msgId), 'meta.json')
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
        if (meta.date) publishDate = meta.date
      } catch {}
    }

    try {
      await payload.create({
        collection: 'articles',
        data: {
          title: art.title,
          slug: slugify(art.title),
          content: fullText ? textToLexical(fullText) as any : undefined,
          excerpt: excerpt || undefined,
          category: categoryId,
          section: SECTION_NAME,
          order: order++,
          tags: tagIds.length > 0 ? tagIds : undefined,
          species: ['dogs', 'cats'],
          contentType,
          featuredImage: mediaIds[0] || undefined,
          images: mediaIds.length > 1 ? mediaIds.slice(1) : undefined,
          transcriptWordCount: transcriptWordCount || undefined,
          sourceMessageId: art.msgId,
          sourceChannel: art.chatId,
          status: 'published',
          publishedAt: publishDate,
        },
      })
      console.log(`  ✓ #${order - 1} ${art.title} (${mediaIds.length} img, ${tagIds.length} tags, ${contentType})`)
    } catch (e: any) {
      if (e.message?.includes('unique') || e.message?.includes('duplicate')) {
        try {
          await payload.create({
            collection: 'articles',
            data: {
              title: art.title,
              slug: slugify(art.title) + '-' + art.msgId,
              content: fullText ? textToLexical(fullText) as any : undefined,
              excerpt: excerpt || undefined,
              category: categoryId,
              section: SECTION_NAME,
              order: order - 1,
              tags: tagIds.length > 0 ? tagIds : undefined,
              species: ['dogs', 'cats'],
              contentType,
              featuredImage: mediaIds[0] || undefined,
              images: mediaIds.length > 1 ? mediaIds.slice(1) : undefined,
              transcriptWordCount: transcriptWordCount || undefined,
              sourceMessageId: art.msgId,
              sourceChannel: art.chatId,
              status: 'published',
              publishedAt: publishDate,
            },
          })
          console.log(`  ✓ #${order - 1} ${art.title} (slug with msgId)`)
        } catch (e2: any) {
          console.log(`  ✗ ${art.title}: ${e2.message}`)
        }
      } else {
        console.log(`  ✗ ${art.title}: ${e.message}`)
      }
    }
  }

  console.log('\n=== Done ===')
  process.exit(0)
}

main().catch((e) => { console.error('Failed:', e); process.exit(1) })
