import { useQuery } from '@tanstack/react-query'
import { AuthenticatedLayout } from "@/layouts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Main } from '@/components/layout/main'
import { MetricStatCard } from '@/components/metric-stat-card'
import { axios } from '@/lib/axios'
import { FileText, CheckCircle, Clock, Archive, FolderOpen, Tag, Link, Eye } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { pathFor } from '@/lib/app-routes'

interface DashboardData {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  archivedPosts: number
  totalCategories: number
  totalTags: number
  publishedThisMonth: number
  recentPosts: Array<{
    id: number
    title: string
    slug: string
    status: string
    publishedAt: string | null
    author: { id: number; name: string } | null
  }>
  popularPosts: Array<{
    id: number
    title: string
    slug: string
    viewCount: number
  }>
}

const sparkline = [2, 4, 3, 5, 4, 6, 5, 7]

export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => axios.get('/api/v1/dashboard').then(r => r.data),
  })

  return (
    <AuthenticatedLayout title="Dashboard">
      <Main>
        <div className='mb-4 flex items-center justify-between'>
          <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
        </div>

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6'>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className='h-36 w-full rounded-xl' />
            ))
          ) : (
            <>
              <MetricStatCard
                title="Total Posts"
                value={data?.totalPosts ?? 0}
                subtitle="Artículos en total"
                icon={FileText}
                trend={0}
                sparklineColor="#6366f1"
                sparklineData={sparkline}
              />
              <MetricStatCard
                title="Publicados"
                value={data?.publishedPosts ?? 0}
                subtitle="Visibles en el blog"
                icon={CheckCircle}
                trend={0}
                sparklineColor="#10b981"
                sparklineData={[3,5,4,6,5,7,6,8]}
              />
              <MetricStatCard
                title="Borradores"
                value={data?.draftPosts ?? 0}
                subtitle="En edición"
                icon={Clock}
                trend={0}
                sparklineColor="#f59e0b"
                sparklineData={[1,2,2,3,2,3,2,3]}
              />
              <MetricStatCard
                title="Este Mes"
                value={data?.publishedThisMonth ?? 0}
                subtitle="Publicados este mes"
                icon={Archive}
                trend={0}
                sparklineColor="#3b82f4"
                sparklineData={[0,1,1,2,1,2,1,3]}
              />
              <MetricStatCard
                title="Categorías"
                value={data?.totalCategories ?? 0}
                subtitle="Categorías activas"
                icon={FolderOpen}
                trend={0}
                sparklineColor="#8b5cf6"
                sparklineData={[1,1,2,2,3,3,3,4]}
              />
              <MetricStatCard
                title="Tags"
                value={data?.totalTags ?? 0}
                subtitle="Etiquetas creadas"
                icon={Tag}
                trend={0}
                sparklineColor="#ec4899"
                sparklineData={[2,3,3,4,4,5,5,6]}
              />
            </>
          )}
        </div>

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Posts Recientes</CardTitle>
              <CardDescription>Los últimos artículos creados o editados</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className='space-y-3'>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className='h-10 w-full' />
                  ))}
                </div>
              ) : !data?.recentPosts?.length ? (
                <p className='text-sm text-muted-foreground'>No hay posts aún</p>
              ) : (
                <div className='divide-y'>
                  {data.recentPosts.map((post) => (
                    <div key={post.id} className='flex items-center justify-between py-3 first:pt-0 last:pb-0'>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium truncate'>{post.title}</p>
                        <p className='text-xs text-muted-foreground'>{post.author?.name ?? '—'}</p>
                      </div>
                      <div className='flex items-center gap-2 ml-4'>
                        <Badge variant={post.status === 'published' ? 'default' : post.status === 'draft' ? 'secondary' : 'outline'} className='text-xs'>
                          {post.status === 'published' ? 'Publicado' : post.status === 'draft' ? 'Borrador' : 'Archivado'}
                        </Badge>
                        {post.status === 'published' && (
                          <a href={pathFor('blog.show', post.slug)} className='text-muted-foreground hover:text-foreground' target='_blank' rel='noopener noreferrer'>
                            <Link className='h-3.5 w-3.5' />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Posts más leídos</CardTitle>
              <CardDescription>Lecturas acumuladas de artículos publicados</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {isLoading ? (
                <div className='space-y-3'>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className='h-8 w-full' />
                  ))}
                </div>
              ) : (
                !data?.popularPosts?.length ? (
                  <p className='text-sm text-muted-foreground'>Aún no hay lecturas registradas</p>
                ) : data.popularPosts.map((post) => (
                  <div key={post.id} className='flex items-center justify-between border-b py-3 last:border-0 last:pb-0'>
                    <a href={pathFor('blog.show', post.slug)} target='_blank' rel='noopener noreferrer' className='min-w-0 truncate text-sm font-medium hover:underline'>
                      {post.title}
                    </a>
                    <span className='ml-4 flex items-center gap-1 text-sm text-muted-foreground'><Eye className='h-3.5 w-3.5' />{post.viewCount}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </Main>
    </AuthenticatedLayout>
  )
}
