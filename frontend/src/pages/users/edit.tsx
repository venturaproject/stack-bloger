import { AuthenticatedLayout } from "@/layouts"
import { ChevronLeft, KeyRound } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Main } from "@/components/layout"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { editUserSchema, EditUserFormValues } from "@/schemas/user.schema"
import { useNavigate } from "react-router-dom"
import { axios } from "@/lib/axios"
import { useAuthStore } from "@/lib/auth"
import { PageProps } from "@/types"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/i18n/context"
import { ScrollArea } from "@/components/ui/scroll-area"
import { generatePassword } from "@/lib/generate-password"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { getApiErrorResponse } from "@/lib/api-error"

interface Role {
  id: number
  name: string
}

interface Permission {
  id: number
  name: string
}

interface PermissionGroup {
  key: string
  label: string
  permissions: PermissionDefinition[]
}

interface PermissionDefinition {
  name: string
  action: string
  actionLabel: string
}

interface UserRole {
  id: number
  name: string
}

interface UserData {
  id: number | string
  name?: string | null
  firstName?: string | null
  lastName?: string | null
  username: string | null
  email: string
  createdAt?: string | null
  created_at?: string | null
  roles: UserRole[]
  role_names: string[]
}

interface EditUserPageProps extends PageProps {
  user?: UserData | { data: UserData }
  roles?: Role[] | { data: Role[] }
  userRoles?: string[]
  permissions?: Permission[]
  groupedPermissions?: Record<string, PermissionGroup>
  userPermissions?: string[]
  effectivePermissions?: string[]
  hasFullAccess?: boolean
}

function formatGroupName(group: string): string {
  return group.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatPermissionLabel(permission: string): string {
  const [, action = permission] = permission.split('.')

  return action.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function EditUser({
  user,
  roles,
  userRoles,
  permissions = [],
  groupedPermissions = {},
  userPermissions = [],
  effectivePermissions = [],
  hasFullAccess = false,
}: EditUserPageProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const fullAccessRoles = useAuthStore(state => state.roles)
  const pageUser = user ? ('data' in user ? user.data : user) : undefined
  const availableRoles = Array.isArray(roles) ? roles : roles?.data ?? []
  const displayName = pageUser?.name?.trim() || [pageUser?.firstName, pageUser?.lastName].filter(Boolean).join(' ').trim()
  const permissionGroups = Object.values(groupedPermissions)

  const { register, handleSubmit, watch, setValue, setError, formState: { errors, isSubmitting } } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: displayName ?? '',
      username: pageUser?.username ?? '',
      email: pageUser?.email ?? '',
      password: '',
      roles: userRoles?.length ? userRoles : [],
      permissions: userPermissions ?? [],
    },
  })

  const authUser = useAuthStore(state => state.user)
  if (!user || !pageUser) return null

  const isCurrentUser = Number(pageUser.id) === authUser?.id
  const hasGlobalAccessRole = hasFullAccess

  const roles_value = watch('roles')
  const selectedRole = roles_value?.[0] ?? ''
  const permissionsValue = watch('permissions') ?? []
  const allPermissionNames = permissions.map((permission) => permission.name)
  const effectivePermissionSet = new Set(effectivePermissions ?? [])

  const handleGeneratePassword = () => {
    setValue('password', generatePassword())
  }

  const handleRoleChange = (roleName: string) => {
    if (roleName === '') {
      setValue('roles', [])
      return
    }

    if (isCurrentUser && fullAccessRoles.includes(roleName) && selectedRole && fullAccessRoles.includes(selectedRole) && selectedRole === roleName) {
      toast.error('No puedes quitarte tu ultimo rol con acceso total.')
      return
    }
    setValue('roles', [roleName])
  }

  const handlePermissionToggle = (permissionName: string) => {
    const current = permissionsValue
    setValue(
      'permissions',
      current.includes(permissionName)
        ? current.filter((permission) => permission !== permissionName)
        : [...current, permissionName],
    )
  }

  const handleSelectAllPermissions = () => {
    if (hasGlobalAccessRole) return

    setValue(
      'permissions',
      permissionsValue.length === allPermissionNames.length ? [] : allPermissionNames,
    )
  }

  const handlePermissionGroupToggle = (groupPermissionNames: string[]) => {
    if (hasGlobalAccessRole) return

    const allSelected = groupPermissionNames.every((permissionName) => permissionsValue.includes(permissionName))

    setValue(
      'permissions',
      allSelected
        ? permissionsValue.filter((permissionName) => !groupPermissionNames.includes(permissionName))
        : [...new Set([...permissionsValue, ...groupPermissionNames])],
    )
  }

  const isPermissionGroupFullySelected = (groupPermissionNames: string[]) =>
    groupPermissionNames.every((permissionName) => permissionsValue.includes(permissionName))

  const isPermissionGroupPartiallySelected = (groupPermissionNames: string[]) =>
    groupPermissionNames.some((permissionName) => permissionsValue.includes(permissionName))
    && !isPermissionGroupFullySelected(groupPermissionNames)

  const onSubmit = async (values: EditUserFormValues) => {
    try {
      await axios.put(`/api/v1/users/${pageUser.id}`, {
        name: values.name,
        username: values.username ?? '',
        email: values.email,
        ...(values.password ? { password: values.password } : {}),
        roles: values.roles ?? [],
        permissions: values.permissions ?? [],
      })
      toast.success(t('user_updated'))
      navigate('/admin/users')
    } catch (err: unknown) {
      const serverErrors = getApiErrorResponse(err)?.data ?? {}
      Object.entries(serverErrors).forEach(([key, message]) => {
        setError(key as keyof EditUserFormValues, { message: message as string })
      })
      toast.error(Object.values(serverErrors)[0] as string || t('please_try_again'))
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  const createdAt = pageUser.createdAt ?? pageUser.created_at

  return (
    <AuthenticatedLayout title={`${t('edit_user')}: ${displayName || pageUser.email}`}>
      <Main>
        <div className="grid flex-1 items-start gap-4 md:gap-8">
          <div className="grid flex-1 auto-rows-max gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => window.history.back()}>
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">{t('back')}</span>
              </Button>
              <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                {t('edit_user')}
              </h1>
              {isCurrentUser && <Badge variant="outline">{t('your_account')}</Badge>}
              <div className="hidden items-center gap-2 md:ml-auto md:flex">
                <Button variant="outline" onClick={() => navigate('/admin/users')}>
                  {t('cancel')}
                </Button>
                <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                  {isSubmitting ? t('saving') : t('save_changes')}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_350px] lg:gap-8">
              <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('user_details')}</CardTitle>
                    <CardDescription>{t('update_user_info')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      <div className="grid gap-3">
                        <Label htmlFor="name">{t('name')}</Label>
                        <Input id="name" type="text" className="w-full" placeholder={t('enter_full_name')} {...register('name')} />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="username">{t('username')}</Label>
                        <Input id="username" type="text" className="w-full" placeholder="antonio.ventura" {...register('username')} />
                        {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="email">{t('email')}</Label>
                        <Input id="email" type="email" className="w-full" placeholder={t('enter_email_address')} {...register('email')} />
                        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle>{t('permissions')}</CardTitle>
                        <CardDescription>
                          {hasGlobalAccessRole
                            ? 'Este usuario tiene acceso total por un rol configurado con permisos globales.'
                            : selectedRole
                            ? 'Permisos heredados del rol (bloqueados) + permisos directos opcionales.'
                            : 'Permisos directos del usuario.'}
                        </CardDescription>
                      </div>
                      {!hasGlobalAccessRole && (
                        <Button variant="outline" size="sm" onClick={handleSelectAllPermissions}>
                          {permissionsValue.length === allPermissionNames.length ? t('deselect_all') : t('select_all')}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {permissionGroups.length > 0 ? (
                      <ScrollArea className="h-[28rem] pr-4">
                        <div className="grid gap-4 xl:grid-cols-2">
                          {permissionGroups.map((group) => (
                            <div key={group.key} className="rounded-lg border p-4">
                              <div className="flex items-center space-x-2 border-b pb-2">
                                <Checkbox
                                  id={`permission-group-${group.key}`}
                                  checked={hasGlobalAccessRole || isPermissionGroupFullySelected(group.permissions.map((permission) => permission.name))}
                                  ref={(ref) => {
                                    if (ref && !hasGlobalAccessRole) {
                                      (ref as HTMLButtonElement & { indeterminate: boolean }).indeterminate =
                                        isPermissionGroupPartiallySelected(group.permissions.map((permission) => permission.name))
                                    }
                                  }}
                                  onCheckedChange={() => handlePermissionGroupToggle(group.permissions.map((permission) => permission.name))}
                                  disabled={hasGlobalAccessRole}
                                />
                                <div>
                                  <p className="text-sm font-medium">{group.label || formatGroupName(group.key)}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {group.permissions.filter((permission) => effectivePermissionSet.has(permission.name)).length} / {group.permissions.length} efectivos
                                  </p>
                                </div>
                              </div>
                              <div className="grid gap-3 pt-3 sm:grid-cols-2">
                                {group.permissions.map((permission) => {
                                  const isInherited = effectivePermissionSet.has(permission.name) && !userPermissions.includes(permission.name)
                                  const isDirect = permissionsValue.includes(permission.name)
                                  const isChecked = hasGlobalAccessRole || isDirect || isInherited

                                  return (
                                    <div key={permission.name} className={cn(
                                      "flex items-start space-x-2 rounded-md border p-2",
                                      isChecked ? "border-primary/30 bg-primary/5" : ""
                                    )}>
                                      <Checkbox
                                        id={`permission-${permission.name}`}
                                        checked={isChecked}
                                        onCheckedChange={() => !isInherited && handlePermissionToggle(permission.name)}
                                        disabled={hasGlobalAccessRole || isInherited}
                                        className="mt-0.5"
                                      />
                                      <Label htmlFor={`permission-${permission.name}`} className={cn("min-w-0", isInherited ? "cursor-not-allowed" : "cursor-pointer")}>
                                        <span className="block text-sm font-normal">{permission.actionLabel || formatPermissionLabel(permission.name)}</span>
                                        <span className="block break-all text-xs text-muted-foreground font-mono">
                                          {permission.name}
                                          {isInherited && (
                                            <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">Rol</Badge>
                                          )}
                                        </span>
                                      </Label>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t('none')}</p>
                    )}
                    {!!errors.permissions && <p className="mt-3 text-sm text-destructive">{errors.permissions.message}</p>}
                  </CardContent>
                </Card>
              </div>

              <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('roles')}</CardTitle>
                    <CardDescription>{t('manage_user_roles')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={selectedRole}
                      onValueChange={handleRoleChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('select_role')} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {availableRoles.length === 0 && (
                      <p className="text-sm text-muted-foreground">{t('no_roles_available')}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('change_password')}</CardTitle>
                    <CardDescription>
                      {t('leave_blank_keep_password')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      <div className="grid gap-3">
                        <Label htmlFor="password">{t('new_password')}</Label>
                        <div className="flex gap-2">
                          <Input
                            id="password"
                            className="w-full font-mono"
                            placeholder={t('generate_password_to_see_it')}
                            readOnly
                            {...register('password')}
                          />
                          <Button type="button" variant="outline" size="icon" onClick={handleGeneratePassword} title={t('generate_password')}>
                            <KeyRound className="h-4 w-4" />
                          </Button>
                        </div>
                        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('user_information')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('user_id')}</p>
                      <p className="font-medium">{pageUser.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('username')}</p>
                      <p className="font-medium">{pageUser.username ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('created_at')}</p>
                      <p className="font-medium">{createdAt ? formatDate(createdAt) : '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('current_roles')}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {userRoles?.map((role) => (
                          <Badge key={role} variant="secondary">{role}</Badge>
                        ))}
                        {(!userRoles || userRoles.length === 0) && (
                          <span className="text-sm text-muted-foreground">{t('none')}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('permissions')}</p>
                      <p className="font-medium">
                        {hasGlobalAccessRole
                          ? `${effectivePermissions.length || permissions.length} efectivos por rol global`
                          : permissionsValue.length > 0
                          ? `${permissionsValue.length} directos`
                          : t('none')}
                      </p>
                      {permissions.length > 0 && (
                        <p className="text-xs text-muted-foreground">{permissions.length} disponibles en total</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 md:hidden">
              <Button variant="outline" onClick={() => navigate('/admin/users')}>
                {t('cancel')}
              </Button>
              <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting ? t('saving') : t('save_changes')}
              </Button>
            </div>
          </div>
        </div>
      </Main>
    </AuthenticatedLayout>
  )
}
