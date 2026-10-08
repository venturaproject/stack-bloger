import { AuthenticatedLayout } from "@/layouts"
import { ChevronLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Main } from "@/components/layout"
import { useState } from "react"
import { useNavigate } from 'react-router-dom'
import { axios } from '@/lib/axios'
import { PageProps } from "@/types"
import { useI18n } from "@/i18n/context"
import { toast } from "sonner"

interface Permission {
  id: number
  name: string
  guard_name: string
}

interface EditPermissionPageProps extends PageProps {
  permission?: Permission
}

export default function EditPermission({ permission }: EditPermissionPageProps) {
  const navigate = useNavigate()
  const [name, setName] = useState(permission?.name ?? '')
  const [processing, setProcessing] = useState(false)
  const { t } = useI18n()

  if (!permission) return null

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error(t('permission_name_required'))
      return
    }

    setProcessing(true)
    axios.put(`/api/v1/permissions/${permission.id}`, { name })
      .then(() => {
        toast.success(t('permission_has_been_updated'))
        navigate('/admin/permissions')
      })
      .catch((err) => {
        toast.error(Object.values(err?.response?.data ?? {})[0] as string || t('please_check_form_and_try_again'))
      })
      .finally(() => setProcessing(false))
  }

  return (
    <AuthenticatedLayout title={t('edit_permission')}>
      <Main>
        <div className="grid flex-1 items-start gap-4 md:gap-8">
          <div className="grid flex-1 auto-rows-max gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => window.history.back()}>
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">{t('back')}</span>
              </Button>
              <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                {t('edit_permission')}
              </h1>
              <div className="hidden items-center gap-2 md:ml-auto md:flex">
                <Button variant="outline" onClick={() => navigate('/admin/permissions')}>
                  {t('cancel')}
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={processing}>
                  {processing ? t('saving') : t('save_changes')}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_350px] lg:gap-8">
              <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('permission_details')}</CardTitle>
                    <CardDescription>
                      {t('edit_permission_description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      <Label htmlFor="name">{t('name')}</Label>
                      <Input
                        id="name"
                        type="text"
                        className="w-full font-mono"
                        placeholder="e.g., users.view"
                        value={name}
                        onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ''))}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('permission_name_format_hint')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('current_permission')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('original_name')}</p>
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {permission.name}
                      </code>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('guard')}</p>
                      <p className="font-medium">{permission.guard_name}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('warning')}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>{t('permission_rename_warning')}</p>
                    <p>{t('permission_rename_code_warning')}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 md:hidden">
              <Button variant="outline" onClick={() => navigate('/admin/permissions')}>
                {t('cancel')}
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={processing}>
                {processing ? t('saving') : t('save_changes')}
              </Button>
            </div>
          </div>
        </div>
      </Main>
    </AuthenticatedLayout>
  )
}
