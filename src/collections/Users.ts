import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'Пользователь',
    plural: 'Пользователи',
  },
  admin: {
    useAsTitle: 'email',
    description: 'Один администратор сайта. Самостоятельная регистрация отключена.',
  },
  auth: true,
  access: {
    // Учётные записи создаются только сидом / Local API с overrideAccess.
    create: () => false,
    // Читать и менять профиль может только авторизованный пользователь.
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [],
}
