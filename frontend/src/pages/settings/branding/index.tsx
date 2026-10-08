import { useRef, useState } from 'react'
import { IconUpload } from '@tabler/icons-react'
import { toast } from 'sonner'
import { SettingLayout } from '@/layouts'
import ContentSection from '../components/content-section'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { axios } from '@/lib/axios'
import { useBranding, type BrandingVariant } from '@/context/branding-context'
import { useI18n } from '@/i18n/context'

const LOGOS: Array<{ variant: BrandingVariant; titleKey: string; descriptionKey: string }> = [
  { variant: 'fullLight', titleKey: 'branding_full_light', descriptionKey: 'branding_full_light_description' },
  { variant: 'fullDark', titleKey: 'branding_full_dark', descriptionKey: 'branding_full_dark_description' },
  { variant: 'compactLight', titleKey: 'branding_compact_light', descriptionKey: 'branding_compact_light_description' },
  { variant: 'compactDark', titleKey: 'branding_compact_dark', descriptionKey: 'branding_compact_dark_description' },
  { variant: 'favicon', titleKey: 'branding_favicon', descriptionKey: 'branding_favicon_description' },
]

export default function SettingsBranding() {
  const { brandName, logoUrl, updateConfig } = useBranding()
  const { t } = useI18n()
  const [uploading, setUploading] = useState<BrandingVariant | null>(null)
  const [name, setName] = useState(brandName)
  const [savingName, setSavingName] = useState(false)
  const inputRefs = useRef<Partial<Record<BrandingVariant, HTMLInputElement>>>({})

  async function uploadLogo(variant: BrandingVariant, file?: File) {
    if (!file) return

    const formData = new FormData()
    formData.append('logo', file)
    setUploading(variant)

    try {
      const response = await axios.post(`/api/v1/branding/${variant}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      updateConfig(response.data)
      toast.success(t('branding_updated'))
    } catch {
      toast.error(t('branding_upload_error'))
    } finally {
      setUploading(null)
    }
  }

  async function saveBrandName() {
    setSavingName(true)
    try {
      const response = await axios.put('/api/v1/branding/name', { brandName: name })
      updateConfig(response.data)
      setName(response.data.brandName)
      toast.success(t('branding_updated'))
    } catch {
      toast.error(t('branding_name_error'))
    } finally {
      setSavingName(false)
    }
  }

  return (
    <SettingLayout title={t('branding')}>
      <ContentSection title={t('branding')} desc={t('branding_description')}>
        <div className='space-y-5'>
          <div className='rounded-lg border p-4'>
            <Label htmlFor='brand-name'>{t('branding_name')}</Label>
            <p className='mt-1 text-sm text-muted-foreground'>{t('branding_name_description')}</p>
            <div className='mt-4 flex gap-2'>
              <Input id='brand-name' value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
              <Button type='button' onClick={() => void saveBrandName()} disabled={savingName || !name.trim()}>
                {savingName ? t('saving') : t('save')}
              </Button>
            </div>
          </div>
          {LOGOS.map(({ variant, titleKey, descriptionKey }) => (
            <div key={variant} className='rounded-lg border p-4'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='min-w-0'>
                   <Label>{t(titleKey)}</Label>
                   <p className='mt-1 text-sm text-muted-foreground'>{t(descriptionKey)}</p>
                </div>
                <div className='flex h-16 min-w-40 items-center justify-center rounded-md bg-muted p-3'>
                   <img src={logoUrl(variant)} alt={t(titleKey)} className='max-h-full max-w-full object-contain' />
                </div>
              </div>
              <div className='mt-4'>
                <input
                  ref={(element) => { inputRefs.current[variant] = element ?? undefined }}
                  type='file'
                   accept='image/png,image/jpeg,image/gif,image/webp,image/x-icon'
                  className='hidden'
                  onChange={(event) => {
                    void uploadLogo(variant, event.target.files?.[0])
                    event.target.value = ''
                  }}
                />
                <Button
                  type='button'
                  variant='outline'
                  disabled={uploading !== null}
                  onClick={() => inputRefs.current[variant]?.click()}
                >
                  <IconUpload />
                   {uploading === variant ? t('uploading') : t('branding_upload')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ContentSection>
    </SettingLayout>
  )
}
