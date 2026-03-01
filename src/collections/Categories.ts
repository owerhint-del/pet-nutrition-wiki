import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Название',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Описание',
    },
    {
      name: 'icon',
      type: 'text',
      label: 'Иконка (эмодзи)',
    },
    {
      name: 'order',
      type: 'number',
      label: 'Порядок в навигации',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
      },
    },
    // Join: shows articles in this category
    {
      name: 'articles',
      type: 'join',
      collection: 'articles',
      on: 'category',
    },
  ],
}
