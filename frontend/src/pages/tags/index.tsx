import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AuthenticatedLayout } from '@/layouts'
import { Main } from '@/components/layout'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X, Pencil, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { tagsApi } from '@/services/tags-api'
import { pathFor } from '@/lib/app-routes'

export interface Tag {
  id: number
  name: string
  slug: string
  createdAt: string
  updatedAt: string
}

interface TagsPageProps {
  tags?: Tag[]
  filters?: Record<string, string | undefined>
}

export default function TagsPage({ tags = [], filters: initialFilters = {} }: TagsPageProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState(initialFilters.search ?? '')
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: number | null }>({ open: false, id: null })

  const filtered = search
    ? tags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : tags

  const handleDeleteTag = (id: number) => setConfirmDelete({ open: true, id })

  const confirmDeleteTag = async () => {
    if (!confirmDelete.id) return
    const id = confirmDelete.id
    setConfirmDelete({ open: false, id: null })
    try {
      await tagsApi.delete(id)
      toast.success('Tag eliminado correctamente')
      queryClient.invalidateQueries({ queryKey: ['/api/v1/tags'] })
    } catch {
      toast.error('Error al eliminar el tag')
    }
  }

  return (
    <AuthenticatedLayout title='Tags'>
      <Main>
        <div className='grid flex-1 items-start gap-4 md:gap-8'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Tags</h2>
            <p className='text-muted-foreground'>Etiquetas para clasificar y filtrar el contenido</p>
          </div>

          <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
            <div className='relative w-full sm:w-72'>
              <Input
                placeholder='Buscar tags...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='w-full pr-9'
              />
              {search && (
                <Button type='button' variant='ghost' size='icon' aria-label='Limpiar búsqueda de tags' className='absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground' onClick={() => setSearch('')}>
                  <X className='h-4 w-4' />
                </Button>
              )}
            </div>
            <Button variant='default' size='sm' className='h-9 gap-1 sm:ml-auto' onClick={() => navigate(pathFor('admin.tags.create'))}>
              Nuevo Tag
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Todos los Tags</CardTitle>
              <CardDescription>{tags.length} tag{tags.length !== 1 ? 's' : ''} en total</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead className='w-24'>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className='text-center text-muted-foreground py-8'>
                        {search ? 'No se encontraron resultados' : 'No hay tags aún'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((tag) => (
                      <TableRow key={tag.id}>
                        <TableCell>
                          <Badge variant='secondary' className='text-sm'>{tag.name}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline' className='text-xs font-mono'>{tag.slug}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-1'>
                            <Button variant='ghost' size='icon' aria-label={`Editar tag ${tag.name}`} className='h-8 w-8' onClick={() => navigate(pathFor('admin.tags.edit', tag.id))}>
                              <Pencil className='h-4 w-4' />
                            </Button>
                            <Button variant='ghost' size='icon' aria-label={`Eliminar tag ${tag.name}`} className='h-8 w-8 text-destructive' onClick={() => handleDeleteTag(tag.id)}>
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </Main>

      <ConfirmDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete((prev) => ({ ...prev, open }))}
        title='Eliminar Tag'
        desc='¿Estás seguro de que deseas eliminar este tag? Los posts no se eliminarán.'
        confirmText='Eliminar'
        destructive
        handleConfirm={confirmDeleteTag}
      />
    </AuthenticatedLayout>
  )
}
