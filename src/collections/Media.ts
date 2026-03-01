import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: '../media',
    mimeTypes: ['image/*'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        height: undefined,
        position: 'centre',
      },
      {
        name: 'mobile',
        width: 600,
        height: undefined,
        position: 'centre',
      },
      {
        name: 'desktop',
        width: 1200,
        height: undefined,
        position: 'centre',
      },
    ],
  },
  admin: {
    useAsTitle: 'alt',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Альтернативный текст',
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Подпись',
    },
  ],
}
