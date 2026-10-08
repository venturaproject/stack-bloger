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
import { categoriesApi } from '@/services/categories-api'
import { pathFor } from '@/lib/app-routes'
import { useI18n } from '@/i18n/context'

export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
}

interface CategoriesPageProps {
  categories?: Category[]
  filters?: Record<string, string | undefined>
}

export default function CategoriesPage({
  categories = [],
  filters: initialFilters = {},
}: CategoriesPageProps) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState(initialFilters.search ?? '')
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: number | null }>({ open: false, id: null })

  const filtered = search
    ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories

  const handleDeleteCategory = (id: number) => setConfirmDelete({ open: true, id })

  const confirmDeleteCategory = async () => {
    if (!confirmDelete.id) return
    const id = confirmDelete.id
    setConfirmDelete({ open: false, id: null })
    try {
      await categoriesApi.delete(id)
      toast.success(t('category_deleted_success'))
      queryClient.invalidateQueries({ queryKey: ['/api/v1/categories'] })
    } catch {
      toast.error(t('error_deleting_category'))
    }
  }

  return (
    <AuthenticatedLayout title={t('categories')}>
      <Main>
        <div className='grid flex-1 items-start gap-4 md:gap-8'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>{t('categories')}</h2>
            <p className='text-muted-foreground'>{t('categories_description')}</p>
          </div>

          <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
            <div className='relative w-full sm:w-72'>
              <Input
                placeholder={t('search_categories')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='w-full pr-9'
              />
              {search && (
                <Button type='button' variant='ghost' size='icon' aria-label='Limpiar busqueda de categorias' className='absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground' onClick={() => setSearch('')}>
                  <X className='h-4 w-4' />
                </Button>
              )}
            </div>
            <Button variant='default' size='sm' className='h-9 gap-1 sm:ml-auto' onClick={() => navigate(pathFor('admin.categories.create'))}>
              {t('create_category')}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('all_categories')}</CardTitle>
              <CardDescription>{t('categories_total', { count: categories.length })}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('name')}</TableHead>
                    <TableHead>{t('slug')}</TableHead>
                    <TableHead>{t('description')}</TableHead>
                    <TableHead className='w-24'>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className='text-center text-muted-foreground py-8'>
                        {search ? t('no_results') : t('no_categories_yet')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell className='font-medium'>{cat.name}</TableCell>
                        <TableCell>
                          <Badge variant='outline' className='text-xs font-mono'>{cat.slug}</Badge>
                        </TableCell>
                        <TableCell className='text-muted-foreground text-sm'>{cat.description ?? t('not_available')}</TableCell>
                        <TableCell>
                          <div className='flex items-center gap-1'>
                            <Button variant='ghost' size='icon' aria-label={t('edit_category')} className='h-8 w-8' onClick={() => navigate(pathFor('admin.categories.edit', cat.id))}>
                              <Pencil className='h-4 w-4' />
                            </Button>
                            <Button variant='ghost' size='icon' aria-label={t('delete_category')} className='h-8 w-8 text-destructive' onClick={() => handleDeleteCategory(cat.id)}>
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
        title={t('delete_category')}
        desc={t('category_delete_confirmation')}
        confirmText={t('delete')}
        destructive
        handleConfirm={confirmDeleteCategory}
      />
    </AuthenticatedLayout>
  )
}
