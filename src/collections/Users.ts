import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    useAPIKey: true,
    cookies: {
      secure: true,
      sameSite: 'Strict',
    },
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: () => false,
    update: ({ req: { user }, id }) =>
      Boolean(user) && (user!.collection === 'users' ? user!.id === id : false),
    delete: ({ req: { user } }) =>
      Boolean(user) && user!.collection === 'users',
  },
  fields: [],
}
