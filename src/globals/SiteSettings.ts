import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Настройки сайта',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'companyName',
      type: 'text',
      label: 'Название компании',
      required: true,
      defaultValue: 'Хан-Хим',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'phone',
          type: 'text',
          label: 'Телефон',
        },
        {
          name: 'email',
          type: 'email',
          label: 'Email',
        },
      ],
    },
    {
      name: 'address',
      type: 'textarea',
      label: 'Адрес',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'inn',
          type: 'text',
          label: 'ИНН',
        },
        {
          name: 'ogrn',
          type: 'text',
          label: 'ОГРН',
        },
        {
          name: 'kpp',
          type: 'text',
          label: 'КПП',
        },
      ],
    },
    {
      name: 'legalAddress',
      type: 'textarea',
      label: 'Юридический адрес',
    },
    {
      name: 'requestEmails',
      type: 'array',
      label: 'Адреса для заявок',
      labels: {
        singular: 'Адрес',
        plural: 'Адреса',
      },
      fields: [
        {
          name: 'email',
          type: 'email',
          label: 'Email',
          required: true,
        },
      ],
      admin: {
        description:
          'Письма о заявках уходят на эти адреса. Если список пуст — используется REQUESTS_FALLBACK_EMAIL.',
      },
    },
  ],
}
