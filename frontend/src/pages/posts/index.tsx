import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AuthenticatedLayout } from '@/layouts'
import { Main } from '@/components/layout'
import { MetricStatCard } from '@/components/metric-stat-card'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { FileText, CheckCircle, Clock, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'
import {
  DataTable,
  DataTablePagination,
  DataTableViewOptions,
  BulkSelectionBar,
} from '@/components/data-table'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTableFilters } from '@/hooks/use-table-filters'
import { useBulkSelection } from '@/hooks/use-bulk-selection'
import { useColumnReorder } from '@/hooks/use-column-reorder'
import { buildPostColumns, postColumnLabels, Post } from './columns'
import { postsApi } from '@/services/posts-api'
import { pathFor } from '@/lib/app-routes'

interface PostStats {
  total: number
  published: number
  draft: number
  archived: number
}

interface PostsPageProps {
  posts?: {
    data: Post[]
    current_page?: number
    last_page?: number
    per_page?: number
    total?: number
  }
  filters?: Record<string, string | undefined>
  stats?: PostStats
}

export default function PostsPage({
  posts = { data: [], current_page: 1, last_page: 1, per_page: 20, total: 0 },
  filters: initialFilters = {},
  stats = { total: 0, published: 0, draft: 0, archived: 0 },
}: PostsPageProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: number | null }>({ open: false, id: null })

  const pagination = {
    current_page: posts.current_page ?? 1,
    last_page:    posts.last_page ?? 1,
    per_page:     posts.per_page ?? 20,
    total:        posts.total ?? posts.data.length,
  }

  const pageIds = posts.data.map((p) => p.id)
  const bulk = useBulkSelection(pageIds, pagination.total)

  const { searchTerm, handleSearch, handlePageChange, handlePerPageChange, perPage } =
    useTableFilters<Record<string, string | undefined>>({
      basePath:       pathFor('admin.posts.index'),
      initialFilters: initialFilters ?? {},
      initialPerPage: pagination.per_page,
      onNavigate:     bulk.clearSelection,
    })

  const handleDeletePost = (id: number) => setConfirmDelete({ open: true, id })

  const confirmDeletePost = async () => {
    if (!confirmDelete.id) return
    const id = confirmDelete.id
    setConfirmDelete({ open: false, id: null })
    try {
      await postsApi.delete(id)
      toast.success('Post eliminado correctamente')
      queryClient.invalidateQueries({ queryKey: ['/api/v1/posts'] })
    } catch {
      toast.error('Error al eliminar el post')
    }
  }

  const columns = buildPostColumns({
    selectedIds:     bulk.selectedIds,
    allPageSelected: bulk.allPageSelected,
    toggleSelectAll: bulk.toggleSelectAll,
    toggleSelectRow: bulk.toggleSelectRow,
    onEdit:   (id) => navigate(pathFor('admin.posts.edit', id)),
    onView:   (post) => window.open(pathFor('blog.show', post.slug), '_blank', 'noopener,noreferrer'),
    onDelete: handleDeletePost,
  })

  const { columnVisibility, setColumnVisibility, handleDragStart, handleDrop } =
    useColumnReorder(columns.map((c) => c.id as string))

  const table = useReactTable({
    data:    posts.data,
    columns,
    state:   { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <AuthenticatedLayout title='Posts'>
      <Main>
        <div className='grid flex-1 items-start gap-4 md:gap-8'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Posts</h2>
            <p className='text-muted-foreground'>Gestiona los artículos del blog</p>
          </div>

          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <MetricStatCard title='Total Posts' value={stats.total} subtitle='Artículos totales' icon={FileText} trend={0} sparklineColor='#6366f1' sparklineData={[4,6,5,7,6,8,7,9]} detailsLabel='Total' />
            <MetricStatCard title='Publicados' value={stats.published} subtitle='Visibles en el blog' icon={CheckCircle} trend={0} sparklineColor='#10b981' sparklineData={[3,5,4,6,5,7,6,8]} detailsLabel='Publicados' />
            <MetricStatCard title='Borradores' value={stats.draft} subtitle='En edición' icon={Clock} trend={0} sparklineColor='#f59e0b' sparklineData={[2,3,2,4,3,3,2,3]} detailsLabel='Borradores' />
            <MetricStatCard title='Archivados' value={stats.archived} subtitle='Contenido archivado' icon={Archive} trend={0} sparklineColor='#94a3b8' sparklineData={[1,2,1,2,1,2,1,2]} detailsLabel='Archivados' />
          </div>

          <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
            <div className='relative w-full sm:w-72'>
              <Input
                placeholder='Buscar posts...'
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className='w-full pr-9'
              />
              {searchTerm && (
                <Button type='button' variant='ghost' size='icon' className='absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground' onClick={() => handleSearch('')}>
                  <X className='h-4 w-4' />
                </Button>
              )}
            </div>
            <div className='flex items-center gap-2 sm:ml-auto'>
              <DataTableViewOptions table={table} columnLabels={postColumnLabels()} />
              <Button variant='default' size='sm' className='h-9 gap-1' onClick={() => navigate(pathFor('admin.posts.create'))}>
                Nuevo Post
              </Button>
            </div>
          </div>

          <BulkSelectionBar
            visible={bulk.selectedIds.size > 0}
            selectedCount={bulk.selectedCount}
            total={pagination.total}
            allPageSelected={bulk.allPageSelected}
            selectAllRecords={bulk.selectAllRecords}
            onSelectAllRecords={() => bulk.setSelectAllRecords(true)}
            onSelectPageOnly={() => bulk.setSelectAllRecords(false)}
            onClearSelection={bulk.clearSelection}
            countLabel={`${bulk.selectedCount} ${bulk.selectedCount === 1 ? 'post seleccionado' : 'posts seleccionados'}`}
            selectAllLabel={`Seleccionar los ${pagination.total} posts`}
            actions={null}
          />

          <Card>
            <CardHeader>
              <CardTitle>Todos los Posts</CardTitle>
              <CardDescription>Lista de artículos del blog</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                table={table}
                colCount={columns.length}
                emptyMessage='No se encontraron posts'
                onDragStart={handleDragStart}
                onDrop={handleDrop}
              />
            </CardContent>
            <DataTablePagination
              currentPage={pagination.current_page}
              lastPage={pagination.last_page}
              perPage={perPage}
              total={pagination.total}
              selectedCount={bulk.selectedCount}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
            />
          </Card>
        </div>
      </Main>

      <ConfirmDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete((prev) => ({ ...prev, open }))}
        title='Eliminar Post'
        desc='¿Estás seguro de que deseas eliminar este post? Esta acción no se puede deshacer.'
        confirmText='Eliminar'
        destructive
        handleConfirm={confirmDeletePost}
      />
    </AuthenticatedLayout>
  )
}
