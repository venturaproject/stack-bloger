import { AuthenticatedLayout } from "@/layouts"
import { ChevronLeft, KeyRound } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Main } from "@/components/layout"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createUserSchema, CreateUserFormValues } from "@/schemas/user.schema"
import { PageProps } from "@/types"
import { useI18n } from "@/i18n/context"
import { useNavigate } from "react-router-dom"
import { axios } from "@/lib/axios"
import { toast } from "sonner"
import { generatePassword } from "@/lib/generate-password"
import { getApiErrorResponse } from "@/lib/api-error"

interface Role {
  id: number
  name: string
}

interface CreateUserPageProps extends PageProps {
  roles?: Role[] | { data: Role[] }
}

const generateUsername = (name: string) =>
  name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '.')

export default function CreateUser({ roles }: CreateUserPageProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [usernameEdited, setUsernameEdited] = useState(false)
  const availableRoles = Array.isArray(roles) ? roles : roles?.data ?? []

  const { register, handleSubmit, watch, setValue, setError, formState: { errors, isSubmitting } } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', username: '', email: '', password: '', roles: [] },
  })

  const name = watch('name')
  const username = watch('username')
  const roles_value = watch('roles')

  useEffect(() => {
    if (!usernameEdited) {
      setValue('username', generateUsername(name))
    }
  }, [name, usernameEdited, setValue])

  const handleRoleToggle = (roleName: string) => {
    const current = roles_value ?? []
    setValue('roles', current.includes(roleName) ? current.filter((r) => r !== roleName) : [...current, roleName])
  }

  const handleGeneratePassword = () => {
    setValue('password', generatePassword())
  }

  const onSubmit = async (values: CreateUserFormValues) => {
    try {
      await axios.post('/api/v1/users', {
        name: values.name,
        username: values.username || generateUsername(values.name),
        email: values.email,
        password: values.password,
        roles: values.roles,
      })
      toast.success(t('user_created'))
      navigate('/admin/users')
    } catch (err: unknown) {
      const serverErrors = getApiErrorResponse(err)?.data ?? {}
      Object.entries(serverErrors).forEach(([key, message]) => {
        setError(key as keyof CreateUserFormValues, { message: message as string })
      })
      toast.error(Object.values(serverErrors)[0] as string || t('please_try_again'))
    }
  }

  return (
    <AuthenticatedLayout title={t('add_new_user')}>
      <Main>
        <div className="grid flex-1 items-start gap-4 md:gap-8">
          <div className="grid flex-1 auto-rows-max gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => window.history.back()}>
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">{t('back')}</span>
              </Button>
              <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                {t('create_user')}
              </h1>
              <div className="hidden items-center gap-2 md:ml-auto md:flex">
                <Button variant="outline" onClick={() => navigate('/admin/users')}>
                  {t('cancel')}
                </Button>
                <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                  {isSubmitting ? t('creating') : t('create_user')}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_350px] lg:gap-8">
              <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('user_details')}</CardTitle>
                    <CardDescription>{t('enter_user_info')}</CardDescription>
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
                        <Input
                          id="username"
                          type="text"
                          className="w-full"
                          placeholder="antonio.ventura"
                          value={username ?? ''}
                          {...register('username')}
                          onChange={(e) => {
                            setUsernameEdited(true)
                            setValue('username', e.target.value)
                          }}
                        />
                        <p className="text-xs text-muted-foreground">{t('username_auto_generated')}</p>
                        {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="email">{t('email')}</Label>
                        <Input id="email" type="email" className="w-full" placeholder={t('enter_email_address')} {...register('email')} />
                        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="password">{t('password')}</Label>
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
              </div>

              <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('roles')}</CardTitle>
                    <CardDescription>{t('assign_roles_to_user')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {availableRoles.map((role) => (
                        <div key={role.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`role-${role.id}`}
                            checked={(roles_value ?? []).includes(role.name)}
                            onCheckedChange={() => handleRoleToggle(role.name)}
                          />
                          <Label htmlFor={`role-${role.id}`} className="text-sm font-normal cursor-pointer">
                            {role.name}
                          </Label>
                        </div>
                      ))}
                      {availableRoles.length === 0 && (
                        <p className="text-sm text-muted-foreground">{t('no_roles_available')}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('summary')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('name')}</p>
                      <p className="font-medium">{name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('username')}</p>
                      <p className="font-medium">{username || generateUsername(name) || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('assigned_roles')}</p>
                      <p className="font-medium">{(roles_value ?? []).length > 0 ? roles_value.join(', ') : t('none')}</p>
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
                {isSubmitting ? t('creating') : t('create_user')}
              </Button>
            </div>
          </div>
        </div>
      </Main>
    </AuthenticatedLayout>
  )
}
