const ROUTES = {
  'admin.dashboard':         '/admin',
  // Users
  'admin.users.index':       '/admin/users',
  'admin.users.create':      '/admin/users/create',
  'admin.users.show':        '/admin/users/:id',
  'admin.users.edit':        '/admin/users/:id/edit',
  'admin.users.bulk-export': '/api/v1/users/export',
  // Roles & Permissions
  'admin.roles.index':       '/admin/roles',
  'admin.roles.create':      '/admin/roles/create',
  'admin.roles.edit':        '/admin/roles/:id/edit',
  'admin.permissions.index': '/admin/permissions',
  // Posts
  'admin.posts.index':       '/admin/posts',
  'admin.posts.create':      '/admin/posts/create',
  'admin.posts.edit':        '/admin/posts/:id/edit',
  // Categories
  'admin.categories.index':  '/admin/categories',
  'admin.categories.create': '/admin/categories/create',
  'admin.categories.edit':   '/admin/categories/:id/edit',
  // Tags
  'admin.tags.index':        '/admin/tags',
  'admin.tags.create':       '/admin/tags/create',
  'admin.tags.edit':         '/admin/tags/:id/edit',
  'admin.settings.branding': '/admin/settings/branding',
  // Public blog
  'blog.index':              '/blog',
  'blog.show':               '/blog/:slug',
} as const

type RouteName = keyof typeof ROUTES
type RouteWithId = 'admin.users.show' | 'admin.users.edit' | 'admin.roles.edit' | 'admin.posts.edit' | 'admin.categories.edit' | 'admin.tags.edit' | 'blog.show'
type RouteWithoutId = Exclude<RouteName, RouteWithId>

export function pathFor(name: RouteWithoutId): string
export function pathFor(name: RouteWithId, id: string | number): string
export function pathFor(name: RouteName, id?: string | number): string {
  const template = ROUTES[name]
  if (id !== undefined) return template.replace(':id', String(id)).replace(':slug', String(id))
  return template
}
