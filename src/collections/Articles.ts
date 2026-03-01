import type { CollectionConfig } from 'payload'

export const Articles: CollectionConfig = {
  slug: 'articles',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'contentType', 'status'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Заголовок',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          ({ value, siblingData }) => {
            if (!value && siblingData?.title) {
              return slugify(siblingData.title)
            }
            return value
          },
        ],
      },
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Содержание',
    },
    {
      name: 'excerpt',
      type: 'textarea',
      label: 'Краткое описание',
      admin: {
        description: 'Отображается в карточках и мета-описании',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Категория',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      label: 'Теги',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'species',
      type: 'select',
      hasMany: true,
      label: 'Вид животного',
      options: [
        { label: 'Собаки', value: 'dogs' },
        { label: 'Кошки', value: 'cats' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'contentType',
      type: 'select',
      required: true,
      defaultValue: 'article',
      label: 'Тип контента',
      options: [
        { label: 'Статья', value: 'article' },
        { label: 'Транскрипция', value: 'transcript' },
        { label: 'Гайд', value: 'guide' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'relatedArticles',
      type: 'relationship',
      relationTo: 'articles',
      hasMany: true,
      label: 'Связанные статьи',
    },
    // Join: shows articles linking TO this one (backlinks)
    {
      name: 'linkedFrom',
      type: 'join',
      collection: 'articles',
      on: 'relatedArticles',
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Главное изображение',
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'Изображения',
    },
    {
      name: 'transcriptWordCount',
      type: 'number',
      label: 'Кол-во слов в транскрипции',
      admin: {
        position: 'sidebar',
        condition: (data) => data?.contentType === 'transcript',
      },
    },
    {
      name: 'sourceMessageId',
      type: 'number',
      label: 'ID сообщения в Telegram',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'sourceChannel',
      type: 'text',
      label: 'ID канала-источника',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'published',
      options: [
        { label: 'Опубликовано', value: 'published' },
        { label: 'Черновик', value: 'draft' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Дата публикации',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
  ],
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
}
