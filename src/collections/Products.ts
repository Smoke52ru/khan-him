import type { CollectionConfig } from 'payload'

import { slugify, uniqueSlug } from '../lib/slugify'

const richTextLabel = (label: string) => ({
  label,
  type: 'richText' as const,
})

export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: 'Товар',
    plural: 'Товары',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'sku', 'availability', 'published', 'updatedAt'],
    listSearchableFields: ['name', 'sku', 'altNames', 'formula', 'cas'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true
      return {
        published: {
          equals: true,
        },
      }
    },
  },
  defaultSort: 'name',
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
        description: 'Формируется из названия автоматически.',
      },
    },
    {
      name: 'published',
      type: 'checkbox',
      label: 'Опубликован',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'sku',
      type: 'text',
      label: 'Артикул',
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'availability',
      type: 'select',
      label: 'Наличие',
      defaultValue: 'stock',
      options: [
        { label: 'На складе', value: 'stock' },
        { label: 'Под заказ', value: 'order' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      label: 'Категории',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'altNames',
      type: 'text',
      label: 'Альтернативные названия',
      hasMany: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'formula',
          type: 'text',
          label: 'Химическая формула',
        },
        {
          name: 'cas',
          type: 'text',
          label: 'Номер CAS',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'gost',
          type: 'text',
          label: 'ГОСТ',
        },
        {
          name: 'tu',
          type: 'text',
          label: 'ТУ',
        },
      ],
    },
    {
      name: 'packaging',
      type: 'text',
      label: 'Фасовка',
    },
    {
      name: 'gallery',
      type: 'upload',
      label: 'Галерея',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'documents',
      type: 'upload',
      label: 'Документы',
      relationTo: 'documents',
      hasMany: true,
    },
    {
      name: 'description',
      ...richTextLabel('Описание'),
    },
    {
      name: 'application',
      ...richTextLabel('Применение'),
    },
    {
      name: 'specs',
      type: 'array',
      label: 'Технические характеристики',
      labels: {
        singular: 'Показатель',
        plural: 'Показатели',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Показатель',
          required: true,
        },
        {
          name: 'value',
          type: 'text',
          label: 'Значение',
          required: true,
        },
      ],
      admin: {
        initCollapsed: true,
      },
    },
    {
      name: 'storage',
      ...richTextLabel('Хранение'),
    },
    {
      name: 'transport',
      ...richTextLabel('Транспортировка'),
    },
    {
      name: 'safety',
      ...richTextLabel('Техника безопасности'),
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
          collection: 'products',
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
