// Mapeo de nombres de ruta Laravel → paths del SPA / endpoints API
type RouteParams = Record<string, unknown> | string | number | null | undefined
type RouteValue = string | ((params: Record<string, unknown>) => string)

const routeMap: Record<string, RouteValue> = {
  // Autenticación
  'login':                           '/login',
  'logout':                          '/logout',
  'password.request':                '/forgot-password',
  'password.email':                  '/api/v1/auth/forgot-password',
  'password.reset':                  (p) => `/reset-password/${p.token}`,
  'password.store':                  '/api/v1/auth/reset-password',
  'verification.notice':             '/verify-email',
  'verification.send':               '/api/v1/auth/email/verification-notification',
  'password.confirm':                '/confirm-password',

  // Dashboard
  'dashboard':                       '/admin',

  // Perfil / settings
  'profile.edit':                    '/admin/settings',
  'profile.update':                  '/api/v1/auth/me',
  'profile.destroy':                 '/api/v1/auth/me',
  'profile.avatar.update':           '/api/v1/auth/me/avatar',
  'dashboard.settings.profile':      '/admin/settings',
  'dashboard.settings.permissions':  '/admin/settings/permissions',
  'dashboard.settings.appearance':   '/admin/settings/appearance',
  'dashboard.settings.appearance.update': '/admin/settings/appearance',
  'dashboard.settings.notifications':'/admin/settings/notifications',
  'dashboard.settings.notifications.update': '/admin/settings/notifications',
  'dashboard.settings.display':      '/admin/settings/display',
  'dashboard.settings.display.update': '/admin/settings/display',
  'dashboard.settings.account':      '/admin/settings/account',
  'dashboard.settings.avatar.update': '/admin/settings/avatar',

  // Usuarios
  'admin.users.index':               '/admin/users',
  'admin.users.create':              '/admin/users/create',
  'admin.users.store':               '/admin/users',
  'admin.users.show':                (p) => `/admin/users/${p.user ?? p.id}`,
  'admin.users.edit':                (p) => `/admin/users/${p.user ?? p.id}/edit`,
  'admin.users.update':              (p) => `/admin/users/${p.user ?? p.id}`,
  'admin.users.destroy':             (p) => `/admin/users/${p.user ?? p.id}`,
  'admin.users.bulk-export':         '/admin/users/bulk-export',

  // Roles
  'admin.roles.index':               '/admin/roles',
  'admin.roles.create':              '/admin/roles/create',
  'admin.roles.store':               '/admin/roles',
  'admin.roles.edit':                (p) => `/admin/roles/${p.role ?? p.id}/edit`,
  'admin.roles.update':              (p) => `/admin/roles/${p.role ?? p.id}`,
  'admin.roles.destroy':             (p) => `/admin/roles/${p.role ?? p.id}`,

  // Permisos
  'admin.permissions.index':         '/admin/permissions',
  'admin.permissions.create':        '/admin/permissions/create',
  'admin.permissions.store':         '/admin/permissions',
  'admin.permissions.edit':          (p) => `/admin/permissions/${p.permission ?? p.id}/edit`,
  'admin.permissions.update':        (p) => `/admin/permissions/${p.permission ?? p.id}`,
  'admin.permissions.destroy':       (p) => `/admin/permissions/${p.permission ?? p.id}`,

  // Teléfonos
  'admin.telefonos.index':           '/admin/telefonos',
  'admin.telefonos.show':            (p) => `/admin/telefonos/${p.id}`,
  'admin.telefonos.edit':            (p) => `/admin/telefonos/${p.id}/edit`,
  'admin.telefonos.update':          (p) => `/admin/telefonos/${p.id}`,
  'admin.telefonos.bulk-export':     '/admin/telefonos/bulk-export',
  'admin.telefonos.bulk-desactivar': '/admin/telefonos/bulk-desactivar',
  'admin.telefonos.sync':            '/admin/telefonos/sync',
  'admin.telefonos.desactivar':      (p) => `/admin/telefonos/${p.id}/desactivar`,
  'admin.telefonos.actions.store':   (p) => `/admin/telefonos/${p.id}/actuaciones`,
  'admin.telefonos.actions.update':  (p) => `/admin/telefonos/actuaciones/${p.actionId}`,
  'admin.telefonos.actions.delete':  (p) => `/admin/telefonos/actuaciones/${p.actionId}`,

  // Dispositivos
  'admin.dispositivos.index':        '/admin/dispositivos',
  'admin.dispositivos.create':       '/admin/dispositivos/create',
  'admin.dispositivos.store':        '/admin/dispositivos',
  'admin.dispositivos.show':         (p) => `/admin/dispositivos/${p.id}`,
  'admin.dispositivos.edit':         (p) => `/admin/dispositivos/${p.id}/edit`,
  'admin.dispositivos.update':       (p) => `/admin/dispositivos/${p.id}`,
  'admin.dispositivos.bulk-export':  '/admin/dispositivos/bulk-export',
  'admin.dispositivos.deliver':      (p) => `/admin/dispositivos/${p.id}/deliver`,

  // Trabajadores
  'admin.trabajadores.index':        '/admin/trabajadores',
  'admin.trabajadores.show':         (p) => `/admin/trabajadores/${p.id}`,
  'admin.trabajadores.bulk-export':  '/admin/trabajadores/bulk-export',
}

function normalizeParams(params?: RouteParams): Record<string, unknown> {
  if (params === null || params === undefined) {
    return {}
  }

  if (typeof params === 'object' && !Array.isArray(params)) {
    return params
  }

  return { id: params }
}

function resolve(name: string, params?: RouteParams): string {
  const entry = routeMap[name]
  if (!entry) {
    console.warn(`[route] Unknown route name: "${name}"`)
    return '#'
  }

  return typeof entry === 'function' ? entry(normalizeParams(params)) : entry
}

// route() puede llamarse como route(name) o route(name, params)
// Y route().current(name) comprueba si el pathname actual coincide
type RouteResult = string & { current: (name: string) => boolean }

function route(name?: string, params?: RouteParams): RouteResult {
  const url = name ? resolve(name, params) : window.location.pathname

  const result = new String(url) as RouteResult
  result.current = (routeName: string) => {
    const target = resolve(routeName)
    return window.location.pathname === target || window.location.pathname.startsWith(target + '/')
  }

  return result
}

// Exponer globalmente para compatibilidad con código que usa window.route
if (typeof window !== 'undefined') {
  ;(window as typeof window & { route?: typeof route }).route = route
}

export { route }
export default route
