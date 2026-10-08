import { AuthenticatedLayout } from "@/layouts"
import { ChevronLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Main } from "@/components/layout"
import { useState } from "react"
import { useNavigate } from 'react-router-dom'
import { axios } from '@/lib/axios'
import { PageProps } from "@/types"
import { useI18n } from "@/i18n/context"
import { toast } from "sonner"

interface CreatePermissionPageProps extends PageProps {
  groups?: string[]
}

const COMMON_ACTIONS = ['view', 'create', 'edit', 'delete', 'export', 'import']

export default function CreatePermission({ groups = [] }: CreatePermissionPageProps) {
  const navigate = useNavigate()
  const [selectedGroup, setSelectedGroup] = useState("")
  const [customGroup, setCustomGroup] = useState("")
  const [action, setAction] = useState("")
  const [customAction, setCustomAction] = useState("")
  const [processing, setProcessing] = useState(false)
  const { t } = useI18n()

  const getPermissionName = () => {
    const group = selectedGroup === 'custom' ? customGroup : selectedGroup
    const actionName = action === 'custom' ? customAction : action

    if (!group || !actionName) return ''
    return `${group}.${actionName}`
  }

  const handleSubmit = () => {
    const permissionName = getPermissionName()

    if (!permissionName) {
      toast.error(t('please_select_group_and_action'))
      return
    }

    setProcessing(true)
    axios.post('/api/v1/permissions', { name: permissionName })
      .then(() => {
        toast.success(t('permission_has_been_created'))
        navigate('/admin/permissions')
      })
      .catch((err) => {
        toast.error(Object.values(err?.response?.data ?? {})[0] as string || t('please_check_form_and_try_again'))
      })
      .finally(() => setProcessing(false))
  }

  return (
    <AuthenticatedLayout title={t('create_permission')}>
      <Main>
        <div className="grid flex-1 items-start gap-4 md:gap-8">
          <div className="grid flex-1 auto-rows-max gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => window.history.back()}>
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">{t('back')}</span>
              </Button>
              <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                {t('create_permission')}
              </h1>
              <div className="hidden items-center gap-2 md:ml-auto md:flex">
                <Button variant="outline" onClick={() => navigate('/admin/permissions')}>
                  {t('cancel')}
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={processing}>
                  {processing ? t('creating') : t('create_permission')}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_350px] lg:gap-8">
              <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('permission_details')}</CardTitle>
                    <CardDescription>
                      {t('create_permission_description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      <div className="grid gap-3">
                        <Label htmlFor="group">{t('group')}</Label>
                        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('select_a_group')} />
                          </SelectTrigger>
                          <SelectContent>
                            {groups.map((group) => (
                              <SelectItem key={group} value={group} className="capitalize">
                                {t(group)}
                              </SelectItem>
                            ))}
                            <SelectItem value="custom">{t('custom_group')}</SelectItem>
                          </SelectContent>
                        </Select>
                        {selectedGroup === 'custom' && (
                          <Input
                            placeholder={t('enter_custom_group')}
                            value={customGroup}
                            onChange={(e) => setCustomGroup(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          />
                        )}
                      </div>

                      <div className="grid gap-3">
                        <Label htmlFor="action">{t('action')}</Label>
                        <Select value={action} onValueChange={setAction}>
                          <SelectTrigger>
                            <SelectValue placeholder={t('select_an_action')} />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMON_ACTIONS.map((act) => (
                              <SelectItem key={act} value={act} className="capitalize">
                                {t(act)}
                              </SelectItem>
                            ))}
                            <SelectItem value="custom">{t('custom_action')}</SelectItem>
                          </SelectContent>
                        </Select>
                        {action === 'custom' && (
                          <Input
                            placeholder={t('enter_custom_action')}
                            value={customAction}
                            onChange={(e) => setCustomAction(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('preview')}</CardTitle>
                    <CardDescription>{t('permission_preview_description')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-md bg-muted">
                      <code className="text-sm font-mono">
                        {getPermissionName() || t('select_group_and_action')}
                      </code>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('tips')}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>{t('permission_format_hint')}</p>
                    <p>{t('permission_common_actions_hint')}</p>
                    <p>{t('permission_examples_hint')}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 md:hidden">
              <Button variant="outline" onClick={() => navigate('/admin/permissions')}>
                {t('cancel')}
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={processing}>
                {processing ? t('creating') : t('create_permission')}
              </Button>
            </div>
          </div>
        </div>
      </Main>
    </AuthenticatedLayout>
  )
}
