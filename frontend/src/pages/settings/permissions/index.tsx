import { SettingLayout } from '@/layouts'
import ContentSection from '../components/content-section'
import { useI18n } from '@/i18n/context'
import { useAuthStore } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { IconShield } from '@tabler/icons-react'

export default function SettingsPermissions() {
  const { t } = useI18n()
  const roles = useAuthStore(state => state.roles)
  const permissions = useAuthStore(state => state.permissions)

  const groupedPermissions = permissions.reduce<Record<string, string[]>>((acc, perm) => {
    const [group, action] = perm.split('.')
    if (!group) return acc
    if (!acc[group]) acc[group] = []
    acc[group].push(action ?? perm)
    return acc
  }, {})

  return (
    <SettingLayout title={t('permissions')}>
      <ContentSection
        title={t('permissions')}
        desc={t('your_permissions_description')}
      >
        <div className='space-y-4'>
          <div className='flex flex-wrap gap-2 pb-2'>
            {roles.map((role) => (
              <Badge key={role} variant='secondary' className='text-xs'>
                <IconShield size={12} className='mr-1' />
                {role}
              </Badge>
            ))}
          </div>

          {Object.keys(groupedPermissions).length === 0 ? (
            <p className='text-sm text-muted-foreground'>{t('no_permissions')}</p>
          ) : (
            Object.entries(groupedPermissions).map(([group, actions]) => (
              <div key={group} className='rounded-md border'>
                <div className='border-b bg-muted/40 px-4 py-2'>
                  <p className='text-sm font-semibold'>{t(group)}</p>
                </div>
                <div className='flex flex-wrap gap-2 px-4 py-3'>
                  {actions.map((action) => (
                    <Badge key={action} variant='outline'>{t(action)}</Badge>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ContentSection>
    </SettingLayout>
  )
}
