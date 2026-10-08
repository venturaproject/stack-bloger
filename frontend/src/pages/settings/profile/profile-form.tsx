import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/lib/auth'
import { axios } from '@/lib/axios'
import { useI18n } from '@/i18n/context'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { IconCamera, IconMail, IconUser, IconShield } from '@tabler/icons-react'

export default function ProfileForm() {
  const { t } = useI18n()
  const user = useAuthStore(state => state.user)
  const roles = useAuthStore(state => state.roles)
  const updateUser = useAuthStore(state => state.updateUser)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewUrlRef = useRef<string | null>(null)
  const [preview, setPreview] = useState<string | null>(user?.avatar ?? null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  if (!user) return null

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = URL.createObjectURL(file)
    setPreview(previewUrlRef.current)
    setUploading(true)

    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const res = await axios.post('/api/v1/settings/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const avatarUrl: string = res.data.avatar
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
      setPreview(avatarUrl)
      updateUser({ avatar: avatarUrl })
      toast.success(t('avatar_updated'))
    } catch {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
      setPreview(user?.avatar ?? null)
      toast.error(t('something_went_wrong'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className='space-y-8'>
      {/* Avatar */}
      <div className='flex items-center gap-6'>
        <div className='relative'>
          <Avatar className='h-20 w-20'>
            <AvatarImage src={preview ?? undefined} alt={user.name} />
            <AvatarFallback className='text-lg'>{initials}</AvatarFallback>
          </Avatar>
          <button
            type='button'
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className='absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50'
          >
            <IconCamera size={14} />
          </button>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            className='hidden'
            onChange={handleFileChange}
          />
        </div>
        <div>
          <p className='font-medium'>{user.name}</p>
          <p className='text-sm text-muted-foreground'>{t('click_camera_to_change_avatar')}</p>
        </div>
      </div>

      {/* Datos de solo lectura */}
      <div className='space-y-4'>
        <div className='flex items-center gap-3 rounded-md border bg-muted/40 px-4 py-3'>
          <IconUser size={16} className='shrink-0 text-muted-foreground' />
          <div>
            <p className='text-xs text-muted-foreground'>{t('name')}</p>
            <p className='text-sm font-medium'>{user.name}</p>
          </div>
        </div>

        <div className='flex items-center gap-3 rounded-md border bg-muted/40 px-4 py-3'>
          <IconMail size={16} className='shrink-0 text-muted-foreground' />
          <div>
            <p className='text-xs text-muted-foreground'>{t('email')}</p>
            <p className='text-sm font-medium'>{user.email}</p>
          </div>
        </div>

        <div className='flex items-center gap-3 rounded-md border bg-muted/40 px-4 py-3'>
          <IconShield size={16} className='shrink-0 text-muted-foreground' />
          <div>
            <p className='text-xs text-muted-foreground'>{t('roles')}</p>
            <div className='mt-1 flex flex-wrap gap-1'>
              {roles.map((role) => (
                <Badge key={role} variant='secondary'>{role}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className='text-xs text-muted-foreground'>{t('profile_managed_by_admin')}</p>
    </div>
  )
}
