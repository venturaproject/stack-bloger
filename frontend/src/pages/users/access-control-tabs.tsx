import { useLocation, useNavigate } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { pathFor } from '@/lib/app-routes'
import { useI18n } from '@/i18n/context'

export function AccessControlTabs() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const current = pathname.startsWith('/admin/roles')
    ? 'roles'
    : pathname.startsWith('/admin/permissions')
      ? 'permissions'
      : 'users'

  const routes = {
    users: 'admin.users.index',
    roles: 'admin.roles.index',
    permissions: 'admin.permissions.index',
  } as const

  return (
    <Tabs value={current} onValueChange={(value) => navigate(pathFor(routes[value as keyof typeof routes]))}>
      <TabsList>
        <TabsTrigger value='users'>{t('users') || 'Usuarios'}</TabsTrigger>
        <TabsTrigger value='roles'>{t('roles') || 'Roles'}</TabsTrigger>
        <TabsTrigger value='permissions'>{t('permissions') || 'Permisos'}</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
