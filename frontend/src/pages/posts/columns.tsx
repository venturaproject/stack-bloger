import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ExternalLink, MoreHorizontal, Pencil, Trash2, ImageIcon } from 'lucide-react'

function imgSrc(url: string) {
  if (url.startsWith('http')) return url
  if (url.startsWith('/uploads/')) return `/api${url}`
  return url
}

export interface Post {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string | null
  featuredImage: string | null
  status: 'draft' | 'scheduled' | 'published' | 'archived'
  publishedAt: string | null
  author: { id: number; name: string } | null
  categories: Array<{ id: number; name: string; slug: string }>
  tags: Array<{ id: number; name: string; slug: string }>
  createdAt: string
  updatedAt: string
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  published: { label: 'Publicado', variant: 'default' },
  draft:     { label: 'Borrador',  variant: 'secondary' },
  archived:  { label: 'Archivado', variant: 'outline' },
  scheduled: { label: 'Programado', variant: 'outline' },
}

interface PostColumnsConfig {
  selectedIds: Set<string | number>
  allPageSelected: boolean
  toggleSelectAll: (checked: boolean) => void
  toggleSelectRow: (id: number, checked: boolean) => void
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  onView?: (post: Post) => void
}

export function buildPostColumns(config: PostColumnsConfig): ColumnDef<Post>[] {
  return [
    {
      id: 'select',
      header: () => (
        <Checkbox
          checked={config.allPageSelected}
          onCheckedChange={(v) => config.toggleSelectAll(v === true)}
          aria-label='Seleccionar todos'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={config.selectedIds.has(row.original.id)}
          onCheckedChange={(v) => config.toggleSelectRow(Number(row.original.id), v === true)}
          aria-label='Seleccionar fila'
        />
      ),
      size: 40,
    },
    {
      id: 'featuredImage',
      header: '',
      cell: ({ row }) => {
        const url = row.original.featuredImage
        if (!url) return <ImageIcon className='h-4 w-4 text-muted-foreground/30' />
        return (
          <img
            src={imgSrc(url)}
            alt=''
            className='h-10 w-14 rounded object-cover'
          />
        )
      },
      size: 72,
    },
    {
      accessorKey: 'title',
      header: 'Título',
      cell: ({ row }) => (
        <div>
          <div className='font-medium'>{row.original.title}</div>
          <div className='text-xs text-muted-foreground'>{row.original.slug}</div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const cfg = statusConfig[row.original.status] ?? statusConfig.draft
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>
      },
    },
    {
      accessorKey: 'categories',
      header: 'Categorías',
      cell: ({ row }) => (
        <div className='flex flex-wrap gap-1'>
          {(row.original.categories ?? []).map((c) => (
            <Badge key={c.id} variant='outline' className='text-xs'>{c.name}</Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'author',
      header: 'Autor',
      cell: ({ row }) => row.original.author?.name ?? '—',
    },
    {
      accessorKey: 'publishedAt',
      header: 'Publicado',
      cell: ({ row }) => {
        if (!row.original.publishedAt) return '—'
        return new Date(row.original.publishedAt).toLocaleDateString('es-ES')
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon' className='h-8 w-8'>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {row.original.status === 'published' && config.onView && (
              <DropdownMenuItem onClick={() => config.onView?.(row.original)}>
                <ExternalLink className='mr-2 h-4 w-4' /> Ver publicación
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => config.onEdit(row.original.id)}>
              <Pencil className='mr-2 h-4 w-4' /> Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='text-destructive' onClick={() => config.onDelete(row.original.id)}>
              <Trash2 className='mr-2 h-4 w-4' /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 50,
    },
  ]
}

export const postColumnLabels = () => ({
  select:        'Sel.',
  featuredImage: 'Imagen',
  title:         'Título',
  status:        'Estado',
  categories:    'Categorías',
  author:        'Autor',
  publishedAt:   'Publicado',
  actions:       'Acciones',
})
