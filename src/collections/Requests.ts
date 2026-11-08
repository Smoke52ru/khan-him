import type { CollectionConfig } from 'payload'

import { sendRequestEmail } from '../lib/requestEmail'

export const Requests: CollectionConfig = {
  slug: 'requests',
  labels: {
    singular: 'Заявка',
    plural: 'Заявки',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'phone', 'source', 'createdAt'],
    description: 'Заявки только для просмотра. Изменение содержимого недоступно.',
  },
  access: {
    create: ({ req: { user } }) => Boolean(user),
    read: ({ req: { user } }) => Boolean(user),
    update: () => false,
    delete: ({ req: { user } }) => Boolean(user),
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Имя',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Телефон',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email',
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Комментарий',
    },
    {
      name: 'source',
      type: 'select',
      label: 'Источник',
      required: true,
      options: [
        { label: 'Список запроса', value: 'list' },
        { label: 'Быстрая заявка', value: 'quick' },
        { label: 'Запрос цены', value: 'price' },
      ],
    },
    {
      name: 'items',
      type: 'array',
      label: 'Позиции',
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          label: 'Товар',
        },
        {
          name: 'name',
          type: 'text',
          label: 'Название на момент заявки',
          required: true,
        },
        {
          name: 'sku',
          type: 'text',
          label: 'Артикул',
        },
        {
          name: 'quantity',
          type: 'text',
          label: 'Объём и фасовка',
        },
      ],
    },
    {
      name: 'consentAt',
      type: 'date',
      label: 'Согласие получено',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        readOnly: true,
      },
    },
    {
      name: 'ip',
      type: 'text',
      label: 'IP',
      admin: { readOnly: true },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return
        try {
          await sendRequestEmail(req.payload, doc)
        } catch (error) {
          req.payload.logger.error({ err: error, msg: 'Failed to send request email' })
        }
      },
    ],
  },
}
