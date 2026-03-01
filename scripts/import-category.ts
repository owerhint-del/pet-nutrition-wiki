/**
 * Import a single category from collected content
 *
 * Usage: DATABASE_URL=... PAYLOAD_SECRET=... npx tsx scripts/import-category.ts <category_dir>
 * Example: npx tsx scripts/import-category.ts pro_perevod_racion_produkty_oshibki
 */

import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const CONTENT_DIR = process.env.CONTENT_DIR || '/Users/nmaximov/Documents/TgAssistant/Телеграм Ветеринарка/collected'

// Category metadata
const CATEGORY_META: Record<string, { title: string; icon: string; description: string; order: number }> = {
  pro_perevod_racion_produkty_oshibki: {
    title: 'Перевод: рацион, продукты, ошибки',
    icon: '🔄',
    description: 'Основы перевода на натуральное питание: расчёт рациона, выбор продуктов, типичные ошибки',
    order: 1,
  },
  zdorovoe_pitanie: {
    title: 'Здоровое питание',
    icon: '🥗',
    description: 'Видео-эфиры и статьи о принципах здорового питания питомцев',
    order: 2,
  },
  produkty: {
    title: 'Продукты',
    icon: '🥩',
    description: 'Подробно о каждом продукте в рационе: мясо, субпродукты, овощи, добавки',
    order: 3,
  },
  mikroelementy: {
    title: 'Микроэлементы',
    icon: '💊',
    description: 'Кальций, фосфор, таурин и другие микроэлементы в рационе',
    order: 4,
  },
  pro_trudnosti_pri_perevode: {
    title: 'Трудности при переводе',
    icon: '⚠️',
    description: 'Как справиться с проблемами при переходе на натуральное питание',
    order: 5,
  },
  pro_tualet_normy_voda: {
    title: 'Туалет, нормы, вода',
    icon: '💧',
    description: 'Нормы стула, потребление воды, пищеварение',
    order: 6,
  },
  pro_yunyh_pitomcev: {
    title: 'Юные питомцы',
    icon: '🐣',
    description: 'Особенности питания щенков и котят',
    order: 7,
  },
  efiry_vakcinaciya_parazity_analizy: {
    title: 'Вакцинация, паразиты, анализы',
    icon: '🏥',
    description: 'Видео-эфиры о вакцинации, обработке от паразитов и интерпретации анализов',
    order: 8,
  },
}

interface ArticleEntry {
  num: number
  title: string
  msgId: number
  chatId: string
  contentTypes: string[]
  folder: string
  hasTranscript: boolean
  transcriptWords?: number
  section: string
}

// Parse INDEX.md with section tracking
function parseIndexMd(indexPath: string): ArticleEntry[] {
  const content = fs.readFileSync(indexPath, 'utf-8')
  const articles: ArticleEntry[] = []
  let currentSection = 'Общее'

  const lines = content.split('\n')

  for (const line of lines) {
    // Detect section headers like: ## BASE — Основы, ## ➡️ — Дополнительно
    const sectionMatch = line.match(/^##\s+(?:[\w]+\s+—\s+|[➡️👉❤️🔹📌🟩🟢]+\s*—?\s*)(.+)/u)
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim()
      continue
    }
    // Simpler section header: ## Основы
    const simpleSectionMatch = line.match(/^##\s+([^|#].+)/)
    if (simpleSectionMatch && !line.includes('Структура') && !line.includes('Итого')) {
      const text = simpleSectionMatch[1].trim()
      // Extract section name after " — " if present
      const dashPart = text.match(/—\s*(.+)/)
      currentSection = dashPart ? dashPart[1].trim() : text
      continue
    }

    // Match table rows: | num | title | [msgId](url) | type | `folder/` | status |
    const rowMatch = line.match(
      /\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*\[(\d+)\]\(https:\/\/t\.me\/c\/(\d+)\/\d+[^)]*\)\s*\|\s*(.+?)\s*\|\s*`(.+?)\/?`\s*\|\s*(\w+)\s*\|/
    )
    if (!rowMatch) continue

    const [, num, title, msgId, chatId, typeStr, folder, status] = rowMatch
    if (status !== 'OK') continue

    const types = typeStr.toLowerCase()
    const hasTranscript = types.includes('transcript')

    let transcriptWords: number | undefined
    const wordMatch = typeStr.match(/(\d+)\s*words/)
    if (wordMatch) transcriptWords = parseInt(wordMatch[1])

    const contentTypes: string[] = []
    if (types.includes('text')) contentTypes.push('text')
    if (types.includes('image')) contentTypes.push('image')
    if (types.includes('video')) contentTypes.push('video')
    if (hasTranscript) contentTypes.push('transcript')

    articles.push({
      num: parseInt(num),
      title: title.trim(),
      msgId: parseInt(msgId),
      chatId,
      contentTypes,
      folder: folder.trim(),
      hasTranscript,
      transcriptWords,
      section: currentSection,
    })
  }

  return articles
}

function extractHashtags(text: string): string[] {
  const tags = text.match(/#[а-яёa-z0-9_]+/gi) || []
  return [...new Set(tags.map((t) => t.toLowerCase()))]
}

function slugify(text: string): string {
  const ru: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
    з: 'z', и: 'i', й: 'j', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
    п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
    ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu',
    я: 'ya',
  }
  return text
    .toLowerCase()
    .split('')
    .map((char) => ru[char] || char)
    .join('')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

// Convert Telegram-style text to Lexical editor JSON
function textToLexical(text: string): object {
  // Remove navigation links at the end
  const cleaned = text
    .replace(/\[?\*?\*?[◀️↩️].*$/gms, '')
    .trim()

  const lines = cleaned.split('\n')
  const children: object[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      children.push({
        type: 'paragraph',
        version: 1,
        children: [],
        direction: null,
        format: '',
        indent: 0,
        textFormat: 0,
        textStyle: '',
      })
      continue
    }

    // Skip pure hashtag lines
    if (/^#[а-яёa-z]/.test(trimmed) && !trimmed.includes(' ')) continue
    if (/^(#[а-яёa-z0-9_]+\s*)+$/i.test(trimmed)) continue

    // Parse bold markers **text**
    const segments = parseBoldText(trimmed)

    children.push({
      type: 'paragraph',
      version: 1,
      children: segments,
      direction: 'ltr',
      format: '',
      indent: 0,
      textFormat: 0,
      textStyle: '',
    })
  }

  return {
    root: {
      type: 'root',
      version: 1,
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
    },
  }
}

function parseBoldText(text: string): object[] {
  const segments: object[] = []
  const parts = text.split(/(\*\*.*?\*\*)/g)

  for (const part of parts) {
    if (!part) continue

    if (part.startsWith('**') && part.endsWith('**')) {
      segments.push({
        type: 'text',
        version: 1,
        text: part.slice(2, -2),
        format: 1,
        detail: 0,
        mode: 'normal',
        style: '',
      })
    } else {
      segments.push({
        type: 'text',
        version: 1,
        text: part,
        format: 0,
        detail: 0,
        mode: 'normal',
        style: '',
      })
    }
  }

  return segments
}

async function main() {
  const catDir = process.argv[2]
  if (!catDir) {
    console.error('Usage: npx tsx scripts/import-category.ts <category_dir>')
    console.error('Available:', Object.keys(CATEGORY_META).join(', '))
    process.exit(1)
  }

  const catMeta = CATEGORY_META[catDir]
  if (!catMeta) {
    console.error(`Unknown category: ${catDir}`)
    console.error('Available:', Object.keys(CATEGORY_META).join(', '))
    process.exit(1)
  }

  const catPath = path.join(CONTENT_DIR, catDir)
  if (!fs.existsSync(catPath)) {
    console.error(`Directory not found: ${catPath}`)
    process.exit(1)
  }

  const indexPath = path.join(catPath, 'INDEX.md')
  if (!fs.existsSync(indexPath)) {
    console.error(`INDEX.md not found in ${catPath}`)
    process.exit(1)
  }

  console.log(`\nImporting category: ${catMeta.icon} ${catMeta.title}\n`)

  const payload = await getPayload({ config })

  // Parse INDEX.md
  const entries = parseIndexMd(indexPath)
  console.log(`Found ${entries.length} articles in ${new Set(entries.map(e => e.section)).size} sections\n`)

  // Show structure
  let prevSection = ''
  for (const entry of entries) {
    if (entry.section !== prevSection) {
      console.log(`  [${entry.section}]`)
      prevSection = entry.section
    }
    console.log(`    ${entry.num}. ${entry.title} (${entry.contentTypes.join(', ')})`)
  }
  console.log()

  // Step 1: Create or find category
  console.log('--- Creating category ---')
  let categoryId: string

  const existing = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slugify(catMeta.title) } },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    categoryId = existing.docs[0].id as string
    console.log(`  Found existing: ${catMeta.title} (id: ${categoryId})`)
  } else {
    const cat = await payload.create({
      collection: 'categories',
      data: {
        title: catMeta.title,
        slug: slugify(catMeta.title),
        description: catMeta.description,
        icon: catMeta.icon,
        order: catMeta.order,
      },
    })
    categoryId = cat.id as string
    console.log(`  Created: ${catMeta.title} (id: ${categoryId})`)
  }

  // Step 2: Create tags
  console.log('\n--- Creating tags ---')
  const tagMap = new Map<string, number>()

  for (const entry of entries) {
    const textPath = path.join(catPath, entry.folder, 'text.txt')
    if (fs.existsSync(textPath)) {
      const text = fs.readFileSync(textPath, 'utf-8')
      for (const tag of extractHashtags(text)) {
        if (!tagMap.has(tag)) {
          // Check if tag already exists
          const existingTag = await payload.find({
            collection: 'tags',
            where: { slug: { equals: slugify(tag.replace('#', '')) } },
            limit: 1,
          })

          if (existingTag.docs.length > 0) {
            tagMap.set(tag, existingTag.docs[0].id as number)
            console.log(`  Found: ${tag}`)
          } else {
            try {
              const newTag = await payload.create({
                collection: 'tags',
                data: {
                  name: tag,
                  slug: slugify(tag.replace('#', '')),
                },
              })
              tagMap.set(tag, newTag.id as number)
              console.log(`  Created: ${tag}`)
            } catch (e: any) {
              console.log(`  SKIP: ${tag} (${e.message})`)
            }
          }
        }
      }
    }
  }
  console.log(`  Total tags: ${tagMap.size}`)

  // Step 3: Import articles
  console.log('\n--- Importing articles ---')
  const articleIds: number[] = []

  for (const entry of entries) {
    const articleFolder = path.join(catPath, entry.folder)
    if (!fs.existsSync(articleFolder)) {
      console.log(`  SKIP: folder not found — ${entry.folder}`)
      continue
    }

    // Read text
    let textContent = ''
    const textPath = path.join(articleFolder, 'text.txt')
    if (fs.existsSync(textPath)) {
      textContent = fs.readFileSync(textPath, 'utf-8')
    }

    // Read transcript
    let transcriptContent = ''
    const transcriptPath = path.join(articleFolder, 'transcript.txt')
    if (fs.existsSync(transcriptPath)) {
      transcriptContent = fs.readFileSync(transcriptPath, 'utf-8')
    }

    // Upload images
    const imageFiles = fs.readdirSync(articleFolder).filter((f) =>
      /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
    )

    const mediaIds: number[] = []
    for (const imgFile of imageFiles) {
      try {
        const imgPath = path.join(articleFolder, imgFile)
        const imgBuffer = fs.readFileSync(imgPath)
        const ext = imgFile.split('.').pop()?.toLowerCase()

        const media = await payload.create({
          collection: 'media',
          data: { alt: entry.title },
          file: {
            data: imgBuffer,
            name: imgFile,
            mimetype: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
            size: imgBuffer.length,
          },
        })
        mediaIds.push(media.id as number)
      } catch (e: any) {
        console.log(`    WARN: image upload failed: ${imgFile} — ${e.message}`)
      }
    }

    // Extract tags
    const articleTags = extractHashtags(textContent)
    const tagIds = articleTags.map((t) => tagMap.get(t)).filter(Boolean) as number[]

    // Content type
    let contentType: 'article' | 'transcript' | 'guide' = 'article'
    if (entry.hasTranscript || transcriptContent) {
      contentType = 'transcript'
    }

    // Build full text
    const fullText = transcriptContent
      ? textContent + '\n\n---\n\n## Транскрипция\n\n' + transcriptContent
      : textContent

    // Excerpt
    const excerptSource = textContent || transcriptContent
    const excerpt = excerptSource
      .replace(/\*\*/g, '')
      .replace(/#[а-яёa-z0-9_]+/gi, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .trim()
      .split('\n')
      .filter((l) => l.trim())
      .slice(0, 3)
      .join(' ')
      .slice(0, 200)

    // Word count for transcripts
    const transcriptWordCount = entry.transcriptWords ||
      (transcriptContent ? transcriptContent.split(/\s+/).length : undefined)

    // Get meta.json for date
    const metaPath = path.join(CONTENT_DIR, entry.chatId, String(entry.msgId), 'meta.json')
    let publishDate = new Date().toISOString()
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
        if (meta.date) publishDate = meta.date
      } catch {}
    }

    try {
      const article = await payload.create({
        collection: 'articles',
        data: {
          title: entry.title,
          slug: slugify(entry.title),
          content: fullText ? textToLexical(fullText) as any : undefined,
          excerpt: excerpt || undefined,
          category: categoryId,
          section: entry.section,
          order: entry.num,
          tags: tagIds.length > 0 ? tagIds : undefined,
          species: ['dogs', 'cats'],
          contentType,
          featuredImage: mediaIds[0] || undefined,
          images: mediaIds.length > 1 ? mediaIds.slice(1) : undefined,
          transcriptWordCount: transcriptWordCount || undefined,
          sourceMessageId: entry.msgId,
          sourceChannel: entry.chatId,
          status: 'published',
          publishedAt: publishDate,
        },
      })
      articleIds.push(article.id as number)
      console.log(`  ✓ #${entry.num} [${entry.section}] ${entry.title} (${mediaIds.length} img, ${tagIds.length} tags)`)
    } catch (e: any) {
      if (e.message?.includes('unique') || e.message?.includes('duplicate')) {
        try {
          const article = await payload.create({
            collection: 'articles',
            data: {
              title: entry.title,
              slug: slugify(entry.title) + '-' + entry.msgId,
              content: fullText ? textToLexical(fullText) as any : undefined,
              excerpt: excerpt || undefined,
              category: categoryId,
              section: entry.section,
              order: entry.num,
              tags: tagIds.length > 0 ? tagIds : undefined,
              species: ['dogs', 'cats'],
              contentType,
              featuredImage: mediaIds[0] || undefined,
              images: mediaIds.length > 1 ? mediaIds.slice(1) : undefined,
              transcriptWordCount: transcriptWordCount || undefined,
              sourceMessageId: entry.msgId,
              sourceChannel: entry.chatId,
              status: 'published',
              publishedAt: publishDate,
            },
          })
          articleIds.push(article.id as number)
          console.log(`  ✓ #${entry.num} [${entry.section}] ${entry.title} (slug with msgId)`)
        } catch (e2: any) {
          console.log(`  ✗ #${entry.num} ${entry.title}: ${e2.message}`)
        }
      } else {
        console.log(`  ✗ #${entry.num} ${entry.title}: ${e.message}`)
      }
    }
  }

  // Step 4: Link related articles within category
  console.log('\n--- Linking related articles ---')
  for (const articleId of articleIds) {
    const related = articleIds.filter((id) => id !== articleId).slice(0, 5)
    if (related.length > 0) {
      try {
        await payload.update({
          collection: 'articles',
          id: articleId,
          data: { relatedArticles: related },
        })
      } catch {}
    }
  }
  console.log('  Done')

  // Summary
  console.log('\n=== Import Complete ===')
  console.log(`  Category: ${catMeta.icon} ${catMeta.title}`)
  console.log(`  Articles: ${articleIds.length}`)
  console.log(`  Tags: ${tagMap.size}`)
  console.log(`  Sections: ${[...new Set(entries.map(e => e.section))].join(', ')}`)

  process.exit(0)
}

main().catch((error) => {
  console.error('Import failed:', error)
  process.exit(1)
})
