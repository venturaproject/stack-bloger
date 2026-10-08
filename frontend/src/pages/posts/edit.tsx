import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AuthenticatedLayout } from '@/layouts'
import { Main } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { MinimalTiptapEditor } from '@/components/ui/minimal-tiptap'
import { FeaturedImageUpload } from '@/components/ui/featured-image-upload'
import { postsApi } from '@/services/posts-api'
import { pathFor } from '@/lib/app-routes'
import { getApiErrorMessage } from '@/lib/api-error'
import { axios } from '@/lib/axios'
import type { Post } from './columns'

interface Category { id: number; name: string; slug: string }
interface Tag { id: number; name: string; slug: string }

interface EditPostPageProps {
  post?: Post
  categories?: Category[]
  tags?: Tag[]
}

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await axios.post('/api/v1/uploads/image', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.url
}

export default function EditPost({ post, categories = [], tags = [] }: EditPostPageProps) {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [title, setTitle] = useState(post?.title ?? '')
  const [slug, setSlug] = useState(post?.slug ?? '')
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '')
  const [content, setContent] = useState(post?.content ?? '')
  const [featuredImage, setFeaturedImage] = useState<string | null>(post?.featuredImage ?? null)
  const [status, setStatus] = useState<'draft' | 'scheduled' | 'published' | 'archived'>(post?.status ?? 'draft')
  const [publishedAt, setPublishedAt] = useState(post?.publishedAt ? post.publishedAt.slice(0, 16) : '')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    (post?.categories ?? []).map((c) => c.id)
  )
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(
    (post?.tags ?? []).map((t) => t.id)
  )

  const toggleCategory = (id: number) =>
    setSelectedCategoryIds((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id])

  const toggleTag = (id: number) =>
    setSelectedTagIds((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id])

  const uploader = useCallback(uploadImage, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!post?.id) return
    if (!title.trim()) { toast.error('El título es obligatorio'); return }
    if (!content.trim()) { toast.error('El contenido es obligatorio'); return }
    if (status === 'scheduled' && (!publishedAt || new Date(publishedAt) <= new Date())) { toast.error('Selecciona una fecha futura para programar el post'); return }

    setIsSubmitting(true)
    try {
      await postsApi.update(post.id, {
        title: title.trim(),
        slug: slug.trim() || undefined,
        content,
        excerpt: excerpt.trim() || undefined,
        featuredImage: featuredImage ?? undefined,
        status,
        publishedAt: status === 'scheduled' ? new Date(publishedAt).toISOString() : undefined,
        categoryIds: selectedCategoryIds,
        tagIds: selectedTagIds,
      })
      toast.success('Post actualizado correctamente')
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) ?? 'Error al actualizar el post')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!post) {
    return (
      <AuthenticatedLayout title='Editar Post'>
        <Main>
          <div className='flex items-center gap-4'>
            <Button type='button' variant='outline' size='icon' onClick={() => navigate(pathFor('admin.posts.index'))}>
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <p className='text-muted-foreground'>Post no encontrado</p>
          </div>
        </Main>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout title='Editar Post'>
      <Main>
        <form onSubmit={handleSubmit} className='grid flex-1 items-start gap-4 md:gap-8'>
          <div className='flex items-center gap-4'>
            <Button type='button' variant='outline' size='icon' onClick={() => navigate(pathFor('admin.posts.index'))}>
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <div>
              <h2 className='text-2xl font-bold tracking-tight'>Editar Post</h2>
              <p className='text-muted-foreground'>Modifica el contenido del artículo</p>
            </div>
            <div className='ml-auto flex items-center gap-2'>
              {status === 'published' && (
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => window.open(pathFor('blog.show', post.slug), '_blank', 'noopener,noreferrer')}
                >
                  <ExternalLink className='mr-2 h-4 w-4' />
                  Ver publicación
                </Button>
              )}
              <Button type='button' variant='outline' onClick={() => navigate(pathFor('admin.posts.index'))}>
                Cancelar
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
            <div className='lg:col-span-2 space-y-4'>
              <Card>
                <CardHeader><CardTitle>Contenido</CardTitle></CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='title'>Título *</Label>
                    <Input id='title' value={title} onChange={(e) => setTitle(e.target.value)} placeholder='Título del artículo' />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='slug'>Slug</Label>
                    <Input id='slug' value={slug} onChange={(e) => setSlug(e.target.value)} placeholder='url-del-articulo' />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='excerpt'>Extracto</Label>
                    <Textarea id='excerpt' value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder='Breve descripción (opcional)' rows={3} />
                  </div>
                  <div className='space-y-2'>
                    <Label>Contenido *</Label>
                    <MinimalTiptapEditor
                      value={content}
                      onChange={(val) => setContent(typeof val === 'string' ? val : val?.toString() ?? '')}
                      className='min-h-[500px]'
                      editorContentClassName='p-5 min-h-[400px]'
                      output='html'
                      placeholder='Escribe el contenido...'
                      immediatelyRender={false}
                      uploader={uploader}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className='space-y-4'>
              <Card>
                <CardHeader><CardTitle>Estado</CardTitle></CardHeader>
                <CardContent>
                  <Select value={status} onValueChange={(val) => setStatus(val as typeof status)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value='draft'>Borrador</SelectItem>
                      <SelectItem value='scheduled'>Programado</SelectItem>
                      <SelectItem value='published'>Publicado</SelectItem>
                      <SelectItem value='archived'>Archivado</SelectItem>
                    </SelectContent>
                  </Select>
                  {status === 'scheduled' && (
                    <div className='mt-4 space-y-2'>
                      <Label htmlFor='publishedAt'>Fecha de publicación</Label>
                      <Input id='publishedAt' type='datetime-local' value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Imagen destacada</CardTitle></CardHeader>
                <CardContent>
                  <FeaturedImageUpload value={featuredImage} onChange={setFeaturedImage} />
                </CardContent>
              </Card>

              {categories.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Categorías</CardTitle></CardHeader>
                  <CardContent className='space-y-2'>
                    {categories.map((cat) => (
                      <div key={cat.id} className='flex items-center gap-2'>
                        <Checkbox id={`cat-${cat.id}`} checked={selectedCategoryIds.includes(cat.id)} onCheckedChange={() => toggleCategory(cat.id)} />
                        <Label htmlFor={`cat-${cat.id}`} className='cursor-pointer'>{cat.name}</Label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {tags.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
                  <CardContent className='flex flex-wrap gap-2'>
                    {tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTagIds.includes(tag.id) ? 'default' : 'outline'}
                        className='cursor-pointer'
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </form>
      </Main>
    </AuthenticatedLayout>
  )
}
