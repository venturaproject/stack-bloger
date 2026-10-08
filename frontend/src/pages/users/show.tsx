import { AuthenticatedLayout } from "@/layouts"
import { Main } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, Pencil, Clock, Shield, KeyRound } from "lucide-react"
import { useNavigate } from 'react-router-dom'
import { useI18n } from "@/i18n/context"
import { cn } from "@/lib/utils"
import { formatDistanceToNow, format } from "date-fns"
import { es } from "date-fns/locale"
import { PageProps } from "@/types"
import { callTypes } from "./data/data"
import { UserStatus } from "./data/schema"

interface ActivityLog {
  id: number
  accion: string
  descripcion: string | null
  ip: string | null
  ruta: string | null
  created_at: string
}

interface UserData {
  id: string
  name?: string | null
  firstName?: string | null
  lastName?: string | null
  username: string | null
  email: string
  status: UserStatus
  role: string
  roles: string[]
  avatar: string | null
  lastActivity: string | null
  createdAt?: string | null
  created_at?: string | null
  updatedAt?: string | null
  updated_at?: string | null
}

interface ShowUserPageProps extends PageProps {
  user?: (UserData & { activityLogs?: ActivityLog[] }) | { data: UserData & { activityLogs?: ActivityLog[] } }
  userPermissions?: string[]
  effectivePermissions?: string[]
  hasFullAccess?: boolean
  groupedPermissions?: Record<string, {
    key: string
    label: string
    permissions: {
      name: string
      action: string
      actionLabel: string
    }[]
  }>
}

function buildDisplayName(user: UserData): string {
  const fullName = user.name?.trim()
  if (fullName) return fullName

  return [user.firstName, user.lastName]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(' ')
}

function getInitials(name?: string | null): string {
  if (!name?.trim()) return 'U'

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
}

function formatPermissionLabel(permission: string): string {
  const [, action = permission] = permission.split('.')

  return action.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function ShowUser({
  user,
  userPermissions = [],
  effectivePermissions = [],
  hasFullAccess = false,
  groupedPermissions = {},
}: ShowUserPageProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  if (!user) return null
  const pageUser = 'data' in user ? user.data : user
  const displayName = buildDisplayName(pageUser)
  const createdAt = pageUser.createdAt ?? pageUser.created_at
  const statusCls = callTypes.get(pageUser.status) ?? ''
  const effectivePermissionSet = new Set(effectivePermissions)
  const permissionGroups = Object.values(groupedPermissions)

  const statusLabels: Record<string, string> = {
    active: t('status_active'),
    inactive: t('status_inactive'),
    suspended: t('status_suspended'),
  }

  return (
    <AuthenticatedLayout title={displayName || pageUser.email}>
      <Main>
        <div className="grid flex-1 items-start gap-6 md:gap-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/admin/users')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h2 className="text-2xl font-bold tracking-tight">{displayName || t('user')}</h2>
              <p className="text-muted-foreground text-sm">{pageUser.email}</p>
            </div>
            <Button onClick={() => navigate(`/admin/users/${pageUser.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('edit')}
            </Button>
          </div>

          {/* Profile card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('user_profile')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <Avatar className="h-20 w-20 shrink-0">
                  {pageUser.avatar && <AvatarImage src={pageUser.avatar} alt={displayName} />}
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid gap-3 flex-1">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">{t('col_nombre')}</p>
                      <p className="font-medium">{displayName || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">{t('username')}</p>
                      <p className="font-mono">{pageUser.username ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">{t('email')}</p>
                      <p>{pageUser.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">{t('col_estado')}</p>
                      <Badge variant="outline" className={cn('rounded-full capitalize', statusCls)}>
                        {statusLabels[pageUser.status] ?? pageUser.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">{t('col_fecha_alta')}</p>
                      <p className="text-sm">{createdAt ? format(new Date(createdAt), 'dd/MM/yyyy', { locale: es }) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">{t('col_last_activity')}</p>
                      <p className="text-sm">
                        {pageUser.lastActivity
                          ? formatDistanceToNow(new Date(pageUser.lastActivity), { addSuffix: true, locale: es })
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Roles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {t('roles')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pageUser.roles && pageUser.roles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {pageUser.roles.map((role) => (
                    <Badge key={role} variant="secondary">{role}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('no_roles_assigned')}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                {t('permissions')}
              </CardTitle>
              <CardDescription>
                {hasFullAccess
                  ? 'Acceso total concedido por un rol con permisos globales.'
                  : userPermissions.length > 0
                  ? `${userPermissions.length} permisos directos, ${effectivePermissions.length} permisos efectivos`
                  : `${effectivePermissions.length} permisos efectivos`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {permissionGroups.length > 0 ? (
                <div className="space-y-6">
                  {permissionGroups.map((group) => (
                    <div key={group.key} className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">{group.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {group.permissions.filter((permission) => effectivePermissionSet.has(permission.name)).length} / {group.permissions.length} efectivos
                        </p>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        {group.permissions.map((permission) => {
                          const isEffective = hasFullAccess || effectivePermissionSet.has(permission.name)
                          const isDirect = userPermissions.includes(permission.name)

                          return (
                            <div
                              key={permission.name}
                              className={cn(
                                "rounded-md border px-3 py-2 text-sm",
                                isEffective ? "border-primary/30 bg-primary/5" : "opacity-55"
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-medium">{permission.actionLabel || formatPermissionLabel(permission.name)}</p>
                                {isEffective && (
                                  <Badge variant={isDirect ? "default" : "secondary"}>
                                    {isDirect ? "Directo" : "Por rol"}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground font-mono">{permission.name}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : effectivePermissions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {effectivePermissions.map((permission) => (
                    <Badge key={permission} variant={hasFullAccess || userPermissions.includes(permission) ? "default" : "secondary"}>
                      {permission}
                    </Badge>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">{t('none')}</p>}

              {!hasFullAccess && userPermissions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Permisos directos</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {userPermissions.map((permission) => (
                      <div key={permission} className="rounded-md border px-3 py-2 text-sm">
                        <p className="font-medium">{formatPermissionLabel(permission)}</p>
                        <p className="text-xs text-muted-foreground font-mono">{permission}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity log */}
          {pageUser.activityLogs && pageUser.activityLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t('user_activity_log')}
                </CardTitle>
                <CardDescription>{t('user_activity_log_description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pageUser.activityLogs.map((log) => (
                    <div key={log.id} className="flex items-start justify-between gap-3 py-2 border-b last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{log.accion}</p>
                        {log.descripcion && (
                          <p className="text-xs text-muted-foreground">{log.descripcion}</p>
                        )}
                        {log.ip && (
                          <p className="text-xs text-muted-foreground font-mono">{log.ip} · {log.ruta}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </Main>
    </AuthenticatedLayout>
  )
}
