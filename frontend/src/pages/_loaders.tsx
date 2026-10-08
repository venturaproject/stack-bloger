import { lazy, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useListPage } from '@/hooks/use-list-page'
import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router-dom'
import { axios } from '@/lib/axios'

type ApiData = ReturnType<typeof JSON.parse>
type Permission = { name: string }
type PermissionGroup = {
  key: string
  label: string
  permissions: Array<{ name: string; action: string; actionLabel: string }>
}

// ── Roles ──────────────────────────────────────────────────────────────────────
const RolesPage = lazy(() => import('./roles/index'))
export function RolesLoader() {
  const { data, isLoading, error, refetch } = useListPage<ApiData>('/api/v1/roles')
  if (isLoading) return <PageSkeleton />
  if (error) return <LoaderError onRetry={() => void refetch()} />
  return <LoaderPage><RolesPage roles={data?.roles} filters={data?.filters ?? {}} /></LoaderPage>
}

// ── Permissions ────────────────────────────────────────────────────────────────
const PermissionsPage = lazy(() => import('./permissions/index'))
export function PermissionsLoader() {
  const { data, isLoading, error, refetch } = useListPage<ApiData>('/api/v1/permissions')
  if (isLoading) return <PageSkeleton />
  if (error) return <LoaderError onRetry={() => void refetch()} />
  return <LoaderPage><PermissionsPage permissions={data?.permissions} groups={data?.groups ?? []} filters={data?.filters ?? {}} /></LoaderPage>
}

// ── Users ──────────────────────────────────────────────────────────────────────
const UsersPage = lazy(() => import('./users/index'))
export function UsersLoader() {
  const { data, isLoading, error, refetch } = useListPage<ApiData>('/api/v1/users')
  if (isLoading) return <PageSkeleton />
  if (error) return <LoaderError onRetry={() => void refetch()} />
  const users = data ? {
    data:         data.data ?? [],
    current_page: data.meta?.page ?? 1,
    last_page:    data.meta?.lastPage ?? 1,
    per_page:     data.meta?.perPage ?? 20,
    total:        data.meta?.total ?? 0,
  } : undefined
  const stats = data?.stats ? {
    total:        data.stats.total      ?? 0,
    activos:      data.stats.active     ?? 0,
    inactivos:    data.stats.inactive   ?? 0,
    suspendidos:  data.stats.suspended  ?? 0,
  } : undefined
  const filters = data?.filters ?? {}
  return <LoaderPage><UsersPage users={users} filters={filters} roles={[]} stats={stats} /></LoaderPage>
}

// ── Users detail loaders ───────────────────────────────────────────────────────
const UsersCreate = lazy(() => import('./users/create'))
export function UsersCreateLoader() {
  const { data, isLoading, isError, refetch } = useQuery<ApiData>({
    queryKey: ['/api/v1/roles', 'simple'],
    queryFn: () => axios.get('/api/v1/roles').then(r => r.data),
  })
  if (isLoading) return <PageSkeleton />
  if (isError) return <LoaderError onRetry={() => void refetch()} />
  const roles = data?.roles?.data ?? []
  return <LoaderPage><UsersCreate roles={roles} /></LoaderPage>
}

const UsersEdit = lazy(() => import('./users/edit'))
export function UsersEditLoader() {
  const { id } = useParams<{ id: string }>()
  const { data: userData, isLoading: loadingUser, isError: userError, refetch: refetchUser } = useQuery<ApiData>({
    queryKey: ['/api/v1/users', id],
    queryFn: () => axios.get(`/api/v1/users/${id}`).then(r => r.data),
    enabled: !!id,
  })
  const { data: rolesData, isLoading: loadingRoles, isError: rolesError, refetch: refetchRoles } = useQuery<ApiData>({
    queryKey: ['/api/v1/roles', 'simple'],
    queryFn: () => axios.get('/api/v1/roles').then(r => r.data),
  })
  const { data: permsData, isLoading: loadingPerms, isError: permsError, refetch: refetchPerms } = useQuery<ApiData>({
    queryKey: ['/api/v1/permissions', 'all'],
    queryFn: () => axios.get('/api/v1/permissions?per_page=500').then(r => r.data),
  })
  if (loadingUser || loadingRoles || loadingPerms) return <PageSkeleton />
  if (userError || rolesError || permsError) return <LoaderError onRetry={() => {
    void refetchUser()
    void refetchRoles()
    void refetchPerms()
  }} />
  const roles = rolesData?.roles?.data ?? []
  const permissions = permsData?.permissions?.data ?? []
  const groupedPermissions = (permissions as Permission[]).reduce<Record<string, PermissionGroup>>((acc, p) => {
    const [resource, action = p.name] = p.name.split('.')
    if (!acc[resource]) acc[resource] = { key: resource, label: resource, permissions: [] }
    acc[resource].permissions.push({ name: p.name, action, actionLabel: action })
    return acc
  }, {})
  return <LoaderPage><UsersEdit
    user={userData?.data}
    roles={roles}
    userRoles={userData?.userRoles ?? []}
    permissions={permissions}
    groupedPermissions={groupedPermissions}
    userPermissions={userData?.userPermissions ?? []}
    effectivePermissions={userData?.effectivePermissions ?? []}
    hasFullAccess={userData?.hasFullAccess ?? false}
  /></LoaderPage>
}

const UsersShow = lazy(() => import('./users/show'))
export function UsersShowLoader() {
  const { id } = useParams<{ id: string }>()
  const { data: userData, isLoading, isError: userError, refetch: refetchUser } = useQuery<ApiData>({
    queryKey: ['/api/v1/users', id, 'show'],
    queryFn: () => axios.get(`/api/v1/users/${id}`).then(r => r.data),
    enabled: !!id,
  })
  const { data: permsData, isLoading: loadingPerms, isError: permsError, refetch: refetchPerms } = useQuery<ApiData>({
    queryKey: ['/api/v1/permissions', 'all'],
    queryFn: () => axios.get('/api/v1/permissions?per_page=500').then(r => r.data),
  })
  if (isLoading || loadingPerms) return <PageSkeleton />
  if (userError || permsError) return <LoaderError onRetry={() => {
    void refetchUser()
    void refetchPerms()
  }} />
  const permissions = permsData?.permissions?.data ?? []
  const groupedPermissions = (permissions as Permission[]).reduce<Record<string, PermissionGroup>>((acc, p) => {
    const [resource, action = p.name] = p.name.split('.')
    if (!acc[resource]) acc[resource] = { key: resource, label: resource, permissions: [] }
    acc[resource].permissions.push({ name: p.name, action, actionLabel: action })
    return acc
  }, {})
  return <LoaderPage><UsersShow
    user={userData?.data}
    userPermissions={userData?.userPermissions ?? []}
    effectivePermissions={userData?.effectivePermissions ?? []}
    hasFullAccess={userData?.hasFullAccess ?? false}
    groupedPermissions={groupedPermissions}
  /></LoaderPage>
}

// ── Posts ──────────────────────────────────────────────────────────────────────
const PostsPage = lazy(() => import('./posts/index'))
export function PostsLoader() {
  const { data, isLoading, error, refetch } = useListPage<ApiData>('/api/v1/posts')
  if (isLoading) return <PageSkeleton />
  if (error) return <LoaderError onRetry={() => void refetch()} />
  const posts = data ? {
    data:         data.data ?? [],
    current_page: data.meta?.page ?? 1,
    last_page:    data.meta?.lastPage ?? 1,
    per_page:     data.meta?.perPage ?? 20,
    total:        data.meta?.total ?? 0,
  } : undefined
  return <LoaderPage><PostsPage posts={posts} filters={data?.filters ?? {}} stats={data?.stats} /></LoaderPage>
}

const PostsCreate = lazy(() => import('./posts/create'))
export function PostsCreateLoader() {
  const { data: catData, isLoading: loadingCats, isError: catsError, refetch: refetchCats } = useQuery<ApiData>({
    queryKey: ['/api/v1/categories', 'all'],
    queryFn: () => axios.get('/api/v1/categories').then(r => r.data),
  })
  const { data: tagData, isLoading: loadingTags, isError: tagsError, refetch: refetchTags } = useQuery<ApiData>({
    queryKey: ['/api/v1/tags', 'all'],
    queryFn: () => axios.get('/api/v1/tags').then(r => r.data),
  })
  if (loadingCats || loadingTags) return <PageSkeleton />
  if (catsError || tagsError) return <LoaderError onRetry={() => {
    void refetchCats()
    void refetchTags()
  }} />
  return <LoaderPage><PostsCreate categories={catData?.data ?? []} tags={tagData?.data ?? []} /></LoaderPage>
}

const PostsEdit = lazy(() => import('./posts/edit'))
export function PostsEditLoader() {
  const { id } = useParams<{ id: string }>()
  const { data: postData, isLoading: loadingPost, isError: postError, refetch: refetchPost } = useQuery<ApiData>({
    queryKey: ['/api/v1/posts', id],
    queryFn: () => axios.get(`/api/v1/posts/${id}`).then(r => r.data),
    enabled: !!id,
  })
  const { data: catData, isLoading: loadingCats, isError: catsError, refetch: refetchCats } = useQuery<ApiData>({
    queryKey: ['/api/v1/categories', 'all'],
    queryFn: () => axios.get('/api/v1/categories').then(r => r.data),
  })
  const { data: tagData, isLoading: loadingTags, isError: tagsError, refetch: refetchTags } = useQuery<ApiData>({
    queryKey: ['/api/v1/tags', 'all'],
    queryFn: () => axios.get('/api/v1/tags').then(r => r.data),
  })
  if (loadingPost || loadingCats || loadingTags) return <PageSkeleton />
  if (postError || catsError || tagsError) return <LoaderError onRetry={() => {
    void refetchPost()
    void refetchCats()
    void refetchTags()
  }} />
  return <LoaderPage><PostsEdit post={postData?.data} categories={catData?.data ?? []} tags={tagData?.data ?? []} /></LoaderPage>
}

// ── Categories ─────────────────────────────────────────────────────────────────
const CategoriesPage = lazy(() => import('./categories/index'))
export function CategoriesLoader() {
  const { data, isLoading, isError, refetch } = useQuery<ApiData>({
    queryKey: ['/api/v1/categories'],
    queryFn: () => axios.get('/api/v1/categories').then(r => r.data),
  })
  if (isLoading) return <PageSkeleton />
  if (isError) return <LoaderError onRetry={() => void refetch()} />
  return <LoaderPage><CategoriesPage categories={data?.data ?? []} /></LoaderPage>
}

const CategoriesCreate = lazy(() => import('./categories/create'))
export function CategoriesCreateLoader() {
  return <LoaderPage><CategoriesCreate /></LoaderPage>
}

const CategoriesEdit = lazy(() => import('./categories/edit'))
export function CategoriesEditLoader() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError, refetch } = useQuery<ApiData>({
    queryKey: ['/api/v1/categories', id],
    queryFn: () => axios.get(`/api/v1/categories/${id}`).then(r => r.data),
    enabled: !!id,
  })
  if (isLoading) return <PageSkeleton />
  if (isError) return <LoaderError onRetry={() => void refetch()} />
  return <LoaderPage><CategoriesEdit category={data?.data} /></LoaderPage>
}

// ── Tags ───────────────────────────────────────────────────────────────────────
const TagsPage = lazy(() => import('./tags/index'))
export function TagsLoader() {
  const { data, isLoading, isError, refetch } = useQuery<ApiData>({
    queryKey: ['/api/v1/tags'],
    queryFn: () => axios.get('/api/v1/tags').then(r => r.data),
  })
  if (isLoading) return <PageSkeleton />
  if (isError) return <LoaderError onRetry={() => void refetch()} />
  return <LoaderPage><TagsPage tags={data?.data ?? []} /></LoaderPage>
}

const TagsCreate = lazy(() => import('./tags/create'))
export function TagsCreateLoader() {
  return <LoaderPage><TagsCreate /></LoaderPage>
}

const TagsEdit = lazy(() => import('./tags/edit'))
export function TagsEditLoader() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError, refetch } = useQuery<ApiData>({
    queryKey: ['/api/v1/tags', id],
    queryFn: () => axios.get(`/api/v1/tags/${id}`).then(r => r.data),
    enabled: !!id,
  })
  if (isLoading) return <PageSkeleton />
  if (isError) return <LoaderError onRetry={() => void refetch()} />
  return <LoaderPage><TagsEdit tag={data?.data} /></LoaderPage>
}

// ── Public Blog ────────────────────────────────────────────────────────────────
import BlogIndex from './blog/index'
export function BlogIndexLoader() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')
  const search = searchParams.get('search') ?? ''
  const view = searchParams.get('view') === 'table' ? 'table' : 'cards'
  const { data, isLoading, isError, isFetching } = useQuery<ApiData>({
    queryKey: ['/api/v1/public/posts', page, search],
    queryFn: () => axios.get('/api/v1/public/posts', { params: { page, ...(search ? { search } : {}) } }).then(r => r.data),
    retry: 1,
    placeholderData: (previousData: ApiData | undefined) => previousData,
  })
  if (isLoading) return <PageSkeleton />
  if (isError) return <BlogIndex error='No se pudieron cargar los artículos.' />
  const posts = data ? {
    data:         data.data ?? [],
    current_page: data.meta?.page ?? 1,
    last_page:    data.meta?.lastPage ?? 1,
    per_page:     data.meta?.perPage ?? 20,
    total:        data.meta?.total ?? 0,
  } : undefined
  const updateParams = (next: { page?: number; search?: string; view?: 'cards' | 'table' }) => {
    const params = new URLSearchParams()
    const nextPage = next.page ?? page
    const nextSearch = next.search ?? search
    const nextView = next.view ?? view
    if (nextPage > 1) params.set('page', String(nextPage))
    if (nextSearch) params.set('search', nextSearch)
    if (nextView === 'table') params.set('view', 'table')
    setSearchParams(params)
  }
  return <BlogIndex posts={posts} search={search} view={view} isUpdating={isFetching} onSearchChange={(value) => updateParams({ search: value, page: 1 })} onViewChange={(value) => updateParams({ view: value })} onPageChange={(value) => updateParams({ page: value })} />
}

import BlogShow from './blog/show'
export function BlogShowLoader() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading, isError } = useQuery<ApiData>({
    queryKey: ['/api/v1/public/posts', slug],
    queryFn: () => axios.get(`/api/v1/public/posts/${slug}`).then(r => r.data),
    enabled: !!slug,
    retry: 1,
  })
  const { data: relatedData } = useQuery<ApiData>({
    queryKey: ['/api/v1/public/posts', slug, 'related'],
    queryFn: () => axios.get(`/api/v1/public/posts/${slug}/related`).then(r => r.data),
    enabled: !!slug,
  })
  const { data: commentsData } = useQuery<ApiData>({
    queryKey: ['/api/v1/public/posts', slug, 'comments'],
    queryFn: () => axios.get(`/api/v1/public/posts/${slug}/comments`).then(r => r.data),
    enabled: !!slug,
  })
  const { data: engagementData } = useQuery<ApiData>({
    queryKey: ['/api/v1/public/posts', slug, 'engagement'],
    queryFn: () => axios.get(`/api/v1/public/posts/${slug}/engagement`).then(r => r.data),
    enabled: !!slug,
  })
  if (isLoading) return <PageSkeleton />
  if (isError) return <BlogShow error='No se pudo cargar el artículo. Inténtalo de nuevo más tarde.' />
  return <BlogShow post={data?.data} relatedPosts={relatedData?.data ?? []} comments={commentsData?.data ?? []} engagement={engagementData?.data} />
}

// ── Shared loading state ───────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className='p-6 space-y-4'>
      <Skeleton className='h-8 w-48' />
      <Skeleton className='h-10 w-full' />
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className='h-12 w-full' />
      ))}
    </div>
  )
}

function LoaderPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
}

function LoaderError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className='p-6'>
      <div className='max-w-md rounded-lg border bg-card p-6 text-card-foreground shadow-sm'>
        <h1 className='text-lg font-semibold'>Unable to load this page</h1>
        <p className='mt-2 text-sm text-muted-foreground'>Check your connection and try again.</p>
        <Button className='mt-4' onClick={onRetry}>Retry</Button>
      </div>
    </div>
  )
}
