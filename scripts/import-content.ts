/**
 * Content import script
 * Reads Telegram channel content from collected folders and imports into Payload CMS
 *
 * Usage: npm run import-content
 * Requires: running PostgreSQL with pet_nutrition_wiki database
 */

import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const CONTENT_DIR = '/Users/nmaximov/Documents/TgAssistant/Телеграм Ветеринарка/collected'

// Category directories mapped to human-readable names + emojis
const CATEGORY_MAP: Record<string, { title: string; icon: string; description: string; order: number }> = {
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

// Parse INDEX.md to extract article entries
function parseIndexMd(indexPath: string): Array<{
  num: number
  title: string
  url: string
  msgId: number
  chatId: string
  contentTypes: string[]
  folder: string
  hasTranscript: boolean
  transcriptWords?: number
}> {
  const content = fs.readFileSync(indexPath, 'utf-8')
  const articles: ReturnType<typeof parseIndexMd> = []

  // Match table rows: | num | title | [msgId](url) | type | `folder/` | status |
  const rowRegex = /\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*\[(\d+)\]\(https:\/\/t\.me\/c\/(\d+)\/\d+[^)]*\)\s*\|\s*(.+?)\s*\|\s*`(.+?)\/?`\s*\|\s*(\w+)\s*\|/g

  let match
  while ((match = rowRegex.exec(content)) !== null) {
    const [, num, title, msgId, chatId, typeStr, folder, status] = match
    if (status !== 'OK') continue

    const types = typeStr.toLowerCase()
    const hasTranscript = types.includes('transcript')

    // Extract word count from transcript info like "transcript (11525 words)"
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
      url: `https://t.me/c/${chatId}/${msgId}`,
      msgId: parseInt(msgId),
      chatId,
      contentTypes,
      folder: folder.trim(),
      hasTranscript,
      transcriptWords,
    })
  }

  return articles
}

// Extract hashtags from text content
function extractHashtags(text: string): string[] {
  const tags = text.match(/#[а-яёa-z0-9_]+/gi) || []
  return [...new Set(tags.map((t) => t.toLowerCase()))]
}

// Slugify Russian text
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
      // Empty paragraph
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

    // Check if it's a hashtag line
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
        format: 1, // bold
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

// Get meta.json for an article
function getMetaJson(chatId: string, msgId: number): Record<string, any> | null {
  const metaPath = path.join(CONTENT_DIR, chatId, String(msgId), 'meta.json')
  if (fs.existsSync(metaPath)) {
    return JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
  }
  return null
}

async function main() {
  console.log('Starting content import...\n')

  const payload = await getPayload({ config })

  // Track created items for linking
  const tagMap = new Map<string, string>() // tag name -> id
  const categoryMap = new Map<string, string>() // dir name -> id
  const articlesByMsgId = new Map<number, string>() // msg id -> article id

  // ========== Step 1: Create Tags ==========
  console.log('=== Step 1: Creating tags ===')

  const allTags = new Set<string>()

  // Scan all text files for hashtags
  for (const catDir of Object.keys(CATEGORY_MAP)) {
    const catPath = path.join(CONTENT_DIR, catDir)
    if (!fs.existsSync(catPath)) continue

    const entries = fs.readdirSync(catPath).filter(
      (f) => f !== 'INDEX.md' && fs.statSync(path.join(catPath, f)).isDirectory()
    )

    for (const entry of entries) {
      const textPath = path.join(catPath, entry, 'text.txt')
      if (fs.existsSync(textPath)) {
        const text = fs.readFileSync(textPath, 'utf-8')
        extractHashtags(text).forEach((t) => allTags.add(t))
      }
    }
  }

  for (const tagName of allTags) {
    try {
      const tag = await payload.create({
        collection: 'tags',
        data: {
          name: tagName,
          slug: slugify(tagName.replace('#', '')),
        },
      })
      tagMap.set(tagName, tag.id as string)
      console.log(`  Tag: ${tagName}`)
    } catch (e: any) {
      // Might be duplicate slug, try with suffix
      if (e.message?.includes('unique')) {
        const tag = await payload.create({
          collection: 'tags',
          data: {
            name: tagName,
            slug: slugify(tagName.replace('#', '')) + '-' + Math.random().toString(36).slice(2, 6),
          },
        })
        tagMap.set(tagName, tag.id as string)
      }
    }
  }
  console.log(`  Total: ${tagMap.size} tags\n`)

  // ========== Step 2: Create Categories ==========
  console.log('=== Step 2: Creating categories ===')

  for (const [dirName, catData] of Object.entries(CATEGORY_MAP)) {
    const cat = await payload.create({
      collection: 'categories',
      data: {
        title: catData.title,
        slug: slugify(catData.title),
        description: catData.description,
        icon: catData.icon,
        order: catData.order,
      },
    })
    categoryMap.set(dirName, cat.id as string)
    console.log(`  Category: ${catData.icon} ${catData.title}`)
  }
  console.log(`  Total: ${categoryMap.size} categories\n`)

  // ========== Step 3: Import Articles with Media ==========
  console.log('=== Step 3: Importing articles ===')

  const processedMsgIds = new Set<number>() // Track duplicates across categories
  let articleCount = 0

  for (const [catDir, _catData] of Object.entries(CATEGORY_MAP)) {
    const catPath = path.join(CONTENT_DIR, catDir)
    if (!fs.existsSync(catPath)) {
      console.log(`  Skipping ${catDir} — directory not found`)
      continue
    }

    const indexPath = path.join(catPath, 'INDEX.md')
    if (!fs.existsSync(indexPath)) {
      console.log(`  Skipping ${catDir} — no INDEX.md`)
      continue
    }

    const indexEntries = parseIndexMd(indexPath)
    const categoryId = categoryMap.get(catDir)!

    console.log(`\n  Category: ${_catData.title} (${indexEntries.length} articles)`)

    for (const entry of indexEntries) {
      // Skip duplicates (same message appearing in multiple categories)
      if (processedMsgIds.has(entry.msgId)) {
        console.log(`    SKIP (duplicate): ${entry.title} [msg ${entry.msgId}]`)
        continue
      }
      processedMsgIds.add(entry.msgId)

      const articleFolder = path.join(catPath, entry.folder)
      if (!fs.existsSync(articleFolder)) {
        console.log(`    SKIP: folder not found — ${entry.folder}`)
        continue
      }

      // Read text content
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

      // Get meta.json
      const meta = getMetaJson(entry.chatId, entry.msgId)

      // Find images in folder
      const imageFiles = fs.readdirSync(articleFolder).filter((f) =>
        /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
      )

      // Upload images to Media collection
      const mediaIds: string[] = []
      for (const imgFile of imageFiles) {
        try {
          const imgPath = path.join(articleFolder, imgFile)
          const imgBuffer = fs.readFileSync(imgPath)

          const media = await payload.create({
            collection: 'media',
            data: {
              alt: entry.title,
            },
            file: {
              data: imgBuffer,
              name: imgFile,
              mimetype: `image/${imgFile.split('.').pop()?.toLowerCase() === 'jpg' ? 'jpeg' : imgFile.split('.').pop()?.toLowerCase()}`,
              size: imgBuffer.length,
            },
          })
          mediaIds.push(media.id as string)
        } catch (e: any) {
          console.log(`    WARN: Failed to upload ${imgFile}: ${e.message}`)
        }
      }

      // Extract tags from text
      const articleTags = extractHashtags(textContent)
      const tagIds = articleTags.map((t) => tagMap.get(t)).filter(Boolean) as string[]

      // Determine content type
      let contentType: 'article' | 'transcript' | 'guide' = 'article'
      if (entry.hasTranscript || transcriptContent) {
        contentType = 'transcript'
      }

      // Build main content: combine text + transcript
      const fullText = transcriptContent
        ? textContent + '\n\n---\n\n## Транскрипция\n\n' + transcriptContent
        : textContent

      // Generate excerpt from first meaningful text
      const excerptText = textContent || transcriptContent
      const excerpt = excerptText
        .replace(/\*\*/g, '')
        .replace(/#[а-яёa-z0-9_]+/gi, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .trim()
        .split('\n')
        .filter((l) => l.trim())
        .slice(0, 3)
        .join(' ')
        .slice(0, 200)

      // Determine word count for transcripts
      const transcriptWordCount = entry.transcriptWords ||
        (transcriptContent ? transcriptContent.split(/\s+/).length : undefined)

      try {
        const article = await payload.create({
          collection: 'articles',
          data: {
            title: entry.title,
            slug: slugify(entry.title),
            content: textToLexical(fullText) as any,
            excerpt: excerpt || undefined,
            category: categoryId,
            tags: tagIds,
            species: ['dogs', 'cats'], // Most content applies to both
            contentType,
            featuredImage: mediaIds[0] || undefined,
            images: mediaIds.length > 1 ? mediaIds.slice(1) : undefined,
            transcriptWordCount: transcriptWordCount || undefined,
            sourceMessageId: entry.msgId,
            sourceChannel: entry.chatId,
            status: 'published',
            publishedAt: meta?.date || new Date().toISOString(),
          },
        })

        articlesByMsgId.set(entry.msgId, article.id as string)
        articleCount++
        console.log(`    ✓ ${entry.title} (${mediaIds.length} images, ${tagIds.length} tags)`)
      } catch (e: any) {
        console.log(`    ✗ FAILED: ${entry.title}: ${e.message}`)

        // Try with modified slug on unique constraint error
        if (e.message?.includes('unique') || e.message?.includes('duplicate')) {
          try {
            const article = await payload.create({
              collection: 'articles',
              data: {
                title: entry.title,
                slug: slugify(entry.title) + '-' + entry.msgId,
                content: textToLexical(fullText) as any,
                excerpt: excerpt || undefined,
                category: categoryId,
                tags: tagIds,
                species: ['dogs', 'cats'],
                contentType,
                featuredImage: mediaIds[0] || undefined,
                images: mediaIds.length > 1 ? mediaIds.slice(1) : undefined,
                transcriptWordCount: transcriptWordCount || undefined,
                sourceMessageId: entry.msgId,
                sourceChannel: entry.chatId,
                status: 'published',
                publishedAt: meta?.date || new Date().toISOString(),
              },
            })
            articlesByMsgId.set(entry.msgId, article.id as string)
            articleCount++
            console.log(`    ✓ ${entry.title} (retry with msgId suffix)`)
          } catch (e2: any) {
            console.log(`    ✗ FAILED RETRY: ${entry.title}: ${e2.message}`)
          }
        }
      }
    }
  }

  console.log(`\n  Total articles imported: ${articleCount}`)

  // ========== Step 4: Create related article links ==========
  console.log('\n=== Step 4: Linking related articles ===')

  // For now, link articles within the same category as related
  // This can be enhanced later with more sophisticated linking
  for (const [catDir] of Object.entries(CATEGORY_MAP)) {
    const catPath = path.join(CONTENT_DIR, catDir)
    const indexPath = path.join(catPath, 'INDEX.md')
    if (!fs.existsSync(indexPath)) continue

    const entries = parseIndexMd(indexPath)
    const articleIdsInCategory = entries
      .map((e) => articlesByMsgId.get(e.msgId))
      .filter(Boolean) as string[]

    // Link each article to others in same category
    for (const articleId of articleIdsInCategory) {
      const related = articleIdsInCategory.filter((id) => id !== articleId).slice(0, 5)
      if (related.length > 0) {
        try {
          await payload.update({
            collection: 'articles',
            id: articleId,
            data: {
              relatedArticles: related,
            },
          })
        } catch (e: any) {
          // Non-critical, continue
        }
      }
    }
  }
  console.log('  Done linking articles\n')

  // ========== Summary ==========
  console.log('=== Import Complete ===')
  console.log(`  Tags: ${tagMap.size}`)
  console.log(`  Categories: ${categoryMap.size}`)
  console.log(`  Articles: ${articleCount}`)
  console.log(`  Unique message IDs: ${processedMsgIds.size}`)

  process.exit(0)
}

main().catch((error) => {
  console.error('Import failed:', error)
  process.exit(1)
})
