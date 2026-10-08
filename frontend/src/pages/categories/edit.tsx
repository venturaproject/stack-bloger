import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AuthenticatedLayout } from '@/layouts'
import { Main } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'
import { categoriesApi } from '@/services/categories-api'
import { pathFor } from '@/lib/app-routes'
import { getApiErrorMessage } from '@/lib/api-error'
import type { Category } from './index'

interface EditCategoryProps {
  category?: Category
}

export default function EditCategory({ category }: EditCategoryProps) {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState(category?.name ?? '')
  const [slug, setSlug] = useState(category?.slug ?? '')
  const [description, setDescription] = useState(category?.description ?? '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category?.id) return
    if (!name.trim()) { toast.error('El nombre es obligatorio'); return }

    setIsSubmitting(true)
    try {
      await categoriesApi.update(category.id, {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
      })
      toast.success('Categoría actualizada correctamente')
      navigate(pathFor('admin.categories.index'))
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) ?? 'Error al actualizar la categoría')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!category) {
    return (
      <AuthenticatedLayout title='Editar Categoría'>
        <Main>
          <div className='flex items-center gap-4'>
            <Button type='button' variant='outline' size='icon' onClick={() => navigate(pathFor('admin.categories.index'))}>
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <p className='text-muted-foreground'>Categoría no encontrada</p>
          </div>
        </Main>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout title='Editar Categoría'>
      <Main>
        <form onSubmit={handleSubmit} className='grid flex-1 items-start gap-4 md:gap-8'>
          <div className='flex items-center gap-4'>
            <Button type='button' variant='outline' size='icon' onClick={() => navigate(pathFor('admin.categories.index'))}>
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>Editar Categoría</h2>
              <p className='text-muted-foreground'>Modifica los datos de la categoría</p>
            </div>
            <div className='ml-auto flex items-center gap-2'>
              <Button type='button' variant='outline' onClick={() => navigate(pathFor('admin.categories.index'))}>
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
                    placeholder='Nombre de la categoría'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='slug'>Slug</Label>
                  <Input
                    id='slug'
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder='nombre-de-la-categoria'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='description'>Descripción</Label>
                  <Textarea
                    id='description'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder='Descripción opcional de la categoría'
                    rows={3}
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
