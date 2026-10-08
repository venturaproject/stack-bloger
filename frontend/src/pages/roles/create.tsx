import { AuthenticatedLayout } from "@/layouts"
import { ChevronLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Main } from "@/components/layout"
import { useState } from "react"
import { useNavigate } from 'react-router-dom'
import { axios } from '@/lib/axios'
import { PageProps } from "@/types"
import { useI18n } from "@/i18n/context"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Permission {
  id: number
  name: string
}

interface GroupedPermissions {
  [key: string]: {
    key: string
    label: string
    permissions: {
      name: string
      action: string
      actionLabel: string
    }[]
  }
}

interface CreateRolePageProps extends PageProps {
  permissions?: Permission[]
  groupedPermissions?: GroupedPermissions
}

export default function CreateRole({ permissions = [], groupedPermissions = {} }: CreateRolePageProps) {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { t } = useI18n()

  const handlePermissionToggle = (permissionName: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionName)
        ? prev.filter(p => p !== permissionName)
        : [...prev, permissionName]
    )
  }

  const handleGroupToggle = (permissions: { name: string }[]) => {
    const groupPermissionNames = permissions.map(p => p.name)
    const allSelected = groupPermissionNames.every(p => selectedPermissions.includes(p))

    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(p => !groupPermissionNames.includes(p)))
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...groupPermissionNames])])
    }
  }

  const handleSelectAll = () => {
    if (selectedPermissions.length === permissions.length) {
      setSelectedPermissions([])
    } else {
      setSelectedPermissions(permissions.map(p => p.name))
    }
  }

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error(t('role_name_required'))
      return
    }

    setProcessing(true)
    setErrors({})
    axios.post('/api/v1/roles', { name, permissions: selectedPermissions })
      .then(() => {
        toast.success(t('role_has_been_created'))
        navigate('/admin/roles')
      })
      .catch((err) => {
        setErrors(err?.response?.data ?? {})
        toast.error(t('please_check_form_and_try_again'))
      })
      .finally(() => setProcessing(false))
  }

  const isGroupFullySelected = (permissions: { name: string }[]) => {
    return permissions.every(p => selectedPermissions.includes(p.name))
  }

  const isGroupPartiallySelected = (permissions: { name: string }[]) => {
    return permissions.some(p => selectedPermissions.includes(p.name)) && !isGroupFullySelected(permissions)
  }

  return (
    <AuthenticatedLayout title={t('create_role')}>
      <Main>
        <div className="grid flex-1 items-start gap-4 md:gap-8">
          <div className="grid flex-1 auto-rows-max gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => window.history.back()}>
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">{t('back')}</span>
              </Button>
              <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                {t('create_role')}
              </h1>
              <div className="hidden items-center gap-2 md:ml-auto md:flex">
                <Button variant="outline" onClick={() => navigate('/admin/roles')}>
                  {t('cancel')}
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={processing}>
                  {processing ? t('creating') : t('create_role')}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_350px] lg:gap-8">
              <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('role_details')}</CardTitle>
                    <CardDescription>{t('enter_role_name_description')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      <Label htmlFor="name">{t('name')}</Label>
                      <Input
                        id="name"
                        type="text"
                        className="w-full"
                        placeholder={t('enter_role_name_placeholder')}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{t('permissions')}</CardTitle>
                        <CardDescription>{t('select_permissions_for_role')}</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleSelectAll}>
                        {selectedPermissions.length === permissions.length ? t('deselect_all') : t('select_all')}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-6">
                        {Object.values(groupedPermissions).map((group) => (
                          <div key={group.key} className="space-y-3">
                            <div className="flex items-center space-x-2 border-b pb-2">
                              <Checkbox
                                id={`group-${group.key}`}
                                checked={isGroupFullySelected(group.permissions)}
                                ref={(ref) => {
                                  if (ref) {
                                    (ref as HTMLButtonElement & { indeterminate: boolean }).indeterminate = isGroupPartiallySelected(group.permissions)
                                  }
                                }}
                                onCheckedChange={() => handleGroupToggle(group.permissions)}
                              />
                              <Label
                                htmlFor={`group-${group.key}`}
                                className="text-sm font-semibold capitalize cursor-pointer"
                              >
                                {group.label}
                              </Label>
                              <span className="text-xs text-muted-foreground">
                                ({group.permissions.filter(p => selectedPermissions.includes(p.name)).length}/{group.permissions.length})
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pl-6">
                              {group.permissions.map((permission) => (
                                <div key={permission.name} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={permission.name}
                                    checked={selectedPermissions.includes(permission.name)}
                                    onCheckedChange={() => handlePermissionToggle(permission.name)}
                                  />
                                  <Label
                                    htmlFor={permission.name}
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    {permission.actionLabel}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('summary')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('role_name')}</p>
                      <p className="font-medium">{name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('selected_permissions')}</p>
                      <p className="font-medium">{t('count_of_total', { count: selectedPermissions.length, total: permissions.length })}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 md:hidden">
              <Button variant="outline" onClick={() => navigate('/admin/roles')}>
                {t('cancel')}
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={processing}>
                {processing ? t('creating') : t('create_role')}
              </Button>
            </div>
          </div>
        </div>
      </Main>
    </AuthenticatedLayout>
  )
}
