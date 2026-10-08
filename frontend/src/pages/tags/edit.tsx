import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AuthenticatedLayout } from '@/layouts'
import { Main } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'
import { tagsApi } from '@/services/tags-api'
import { pathFor } from '@/lib/app-routes'
import { getApiErrorMessage } from '@/lib/api-error'
import type { Tag } from './index'

interface EditTagProps {
  tag?: Tag
}

export default function EditTag({ tag }: EditTagProps) {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState(tag?.name ?? '')
  const [slug, setSlug] = useState(tag?.slug ?? '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tag?.id) return
    if (!name.trim()) { toast.error('El nombre es obligatorio'); return }

    setIsSubmitting(true)
    try {
      await tagsApi.update(tag.id, {
        name: name.trim(),
        slug: slug.trim() || undefined,
      })
      toast.success('Tag actualizado correctamente')
      navigate(pathFor('admin.tags.index'))
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) ?? 'Error al actualizar el tag')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!tag) {
    return (
      <AuthenticatedLayout title='Editar Tag'>
        <Main>
          <div className='flex items-center gap-4'>
            <Button type='button' variant='outline' size='icon' onClick={() => navigate(pathFor('admin.tags.index'))}>
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <p className='text-muted-foreground'>Tag no encontrado</p>
          </div>
        </Main>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout title='Editar Tag'>
      <Main>
        <form onSubmit={handleSubmit} className='grid flex-1 items-start gap-4 md:gap-8'>
          <div className='flex items-center gap-4'>
            <Button type='button' variant='outline' size='icon' onClick={() => navigate(pathFor('admin.tags.index'))}>
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>Editar Tag</h2>
              <p className='text-muted-foreground'>Modifica los datos del tag</p>
            </div>
            <div className='ml-auto flex items-center gap-2'>
              <Button type='button' variant='outline' onClick={() => navigate(pathFor('admin.tags.index'))}>
                Cancelar
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>

          <div className='max-w-2xl'>
            <Card>
              <CardHeader><CardTitle>Detalles</CardTitle></CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Nombre *</Label>
                  <Input
                    id='name'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='Nombre del tag'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='slug'>Slug</Label>
                  <Input
                    id='slug'
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder='nombre-del-tag'
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </Main>
    </AuthenticatedLayout>
  )
}
