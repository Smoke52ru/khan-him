import type { CollectionConfig } from 'payload'

import { slugify, uniqueSlug } from '../lib/slugify'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'Категория',
    plural: 'Категории',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'order'],
  },
  access: {
    read: () => true,
  },
  defaultSort: 'order',
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Название',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Адрес',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Формируется из названия автоматически, можно поправить вручную.',
      },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Порядок',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        step: 1,
      },
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, originalDoc, operation }) => {
        if (!data) return data
        const name = data.name ?? originalDoc?.name
        if (!name) return data

        const base = data.slug ? slugify(data.slug) : slugify(name)
        if (!base) return data

        const existing = await req.payload.find({
          collection: 'categories',
          where: {
            and: [
              { slug: { like: `${base}%` } },
              ...(operation === 'update' && originalDoc?.id
                ? [{ id: { not_equals: originalDoc.id } }]
                : []),
            ],
          },
          limit: 100,
          depth: 0,
          overrideAccess: true,
        })

        data.slug = uniqueSlug(
          base,
          existing.docs.map((doc) => doc.slug).filter(Boolean) as string[],
        )
        return data
      },
    ],
  },
}
