import './index.css'
import '@/lib/route'

import React, { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/lib/auth'
import { axios } from '@/lib/axios'
import { setNavigate } from '@/lib/navigation'
import { useNavigate } from 'react-router-dom'
import { Providers } from '@/providers'
import { ErrorBoundary } from '@/components/error-boundary'

// ── Auth guard ────────────────────────────────────────────────────────────────

function NavigateSetter() {
  const navigate = useNavigate()
  React.useEffect(() => { setNavigate(navigate) }, [navigate])
  return null
}

function AuthSync() {
  const setAuth = useAuthStore(state => state.setAuth)
  const logout = useAuthStore(state => state.logout)
  const requestId = React.useRef(0)

  React.useEffect(() => {
    const currentRequest = ++requestId.current
    const authVersion = useAuthStore.getState().authVersion
    axios.get('/api/v1/auth/me')
      .then(res => {
        if (currentRequest !== requestId.current || authVersion !== useAuthStore.getState().authVersion) return
        const data = res.data?.data
        if (data) {
          setAuth(
            {
              id: data.id,
              name: data.name,
              email: data.email,
              username: data.username ?? null,
              role: data.roles?.[0] ?? 'user',
              avatar: data.avatar ?? null,
            },
            data.permissions ?? [],
            data.roles ?? [],
          )
        } else {
          logout()
        }
      })
      .catch(() => {
        if (currentRequest === requestId.current && authVersion === useAuthStore.getState().authVersion) logout()
      })
  }, [logout, setAuth])
  return null
}

function RequireAuth() {
  const status = useAuthStore(state => state.status)
  if (status === 'loading') return <AuthLoading />
  if (status !== 'authenticated') return <Navigate to="/login" replace />
  return <Outlet />
}

function RequireGuest() {
  const status = useAuthStore(state => state.status)
  if (status === 'loading') return <AuthLoading />
  if (status === 'authenticated') return <Navigate to="/admin" replace />
  return <Outlet />
}

function AuthLoading() {
  return <div className='min-h-screen' aria-busy='true' aria-label='Checking your session' />
}

// ── Lazy pages ────────────────────────────────────────────────────────────────

const S = (c: React.ReactNode) => <Suspense fallback={null}>{c}</Suspense>

const SignIn = lazy(() => import('@/pages/auth/sign-in/sign-in-2'))
const Dashboard = lazy(() => import('@/pages/dashboard/index'))
const RolesCreate = lazy(() => import('@/pages/roles/create'))
const RolesEdit = lazy(() => import('@/pages/roles/edit'))
const PermissionsCreate = lazy(() => import('@/pages/permissions/create'))
const PermissionsEdit = lazy(() => import('@/pages/permissions/edit'))
const SettingsProfile = lazy(() => import('@/pages/settings/profile'))
const SettingsAccount = lazy(() => import('@/pages/settings/account'))
const SettingsPermissions = lazy(() => import('@/pages/settings/permissions'))
const SettingsAppearance = lazy(() => import('@/pages/settings/appearance'))
const SettingsNotifications = lazy(() => import('@/pages/settings/notifications'))
const SettingsDisplay = lazy(() => import('@/pages/settings/display'))
const SettingsBranding = lazy(() => import('@/pages/settings/branding'))
const NotFound = lazy(() => import('@/pages/errors/not-found-error'))

// Keep admin page modules out of the initial application bundle. Each loader
// lazy-loads its rendered page only after its route has been selected.
const RolesLoader = lazy(() => import('@/pages/_loaders').then(({ RolesLoader }) => ({ default: RolesLoader })))
const PermissionsLoader = lazy(() => import('@/pages/_loaders').then(({ PermissionsLoader }) => ({ default: PermissionsLoader })))
const UsersLoader = lazy(() => import('@/pages/_loaders').then(({ UsersLoader }) => ({ default: UsersLoader })))
const UsersCreateLoader = lazy(() => import('@/pages/_loaders').then(({ UsersCreateLoader }) => ({ default: UsersCreateLoader })))
const UsersEditLoader = lazy(() => import('@/pages/_loaders').then(({ UsersEditLoader }) => ({ default: UsersEditLoader })))
const UsersShowLoader = lazy(() => import('@/pages/_loaders').then(({ UsersShowLoader }) => ({ default: UsersShowLoader })))
const PostsLoader = lazy(() => import('@/pages/_loaders').then(({ PostsLoader }) => ({ default: PostsLoader })))
const PostsCreateLoader = lazy(() => import('@/pages/_loaders').then(({ PostsCreateLoader }) => ({ default: PostsCreateLoader })))
const PostsEditLoader = lazy(() => import('@/pages/_loaders').then(({ PostsEditLoader }) => ({ default: PostsEditLoader })))
const CategoriesLoader = lazy(() => import('@/pages/_loaders').then(({ CategoriesLoader }) => ({ default: CategoriesLoader })))
const CategoriesCreateLoader = lazy(() => import('@/pages/_loaders').then(({ CategoriesCreateLoader }) => ({ default: CategoriesCreateLoader })))
const CategoriesEditLoader = lazy(() => import('@/pages/_loaders').then(({ CategoriesEditLoader }) => ({ default: CategoriesEditLoader })))
const TagsLoader = lazy(() => import('@/pages/_loaders').then(({ TagsLoader }) => ({ default: TagsLoader })))
const TagsCreateLoader = lazy(() => import('@/pages/_loaders').then(({ TagsCreateLoader }) => ({ default: TagsCreateLoader })))
const TagsEditLoader = lazy(() => import('@/pages/_loaders').then(({ TagsEditLoader }) => ({ default: TagsEditLoader })))
const BlogIndexLoader = lazy(() => import('@/pages/_loaders').then(({ BlogIndexLoader }) => ({ default: BlogIndexLoader })))
const BlogShowLoader = lazy(() => import('@/pages/_loaders').then(({ BlogShowLoader }) => ({ default: BlogShowLoader })))

// ── Router ────────────────────────────────────────────────────────────────────

const router = createBrowserRouter([
  {
    element: (<><NavigateSetter /><AuthSync /><Outlet /></>),
    children: [
      {
        element: <RequireGuest />,
        children: [
          { path: '/login', element: S(<SignIn status={undefined} canResetPassword={false} />) },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          { path: '/admin', element: S(<Dashboard />) },
          // Users
          { path: '/admin/users', element: S(<UsersLoader />) },
          { path: '/admin/users/create', element: S(<UsersCreateLoader />) },
          { path: '/admin/users/:id/edit', element: S(<UsersEditLoader />) },
          { path: '/admin/users/:id', element: S(<UsersShowLoader />) },
          // Roles
          { path: '/admin/roles', element: S(<RolesLoader />) },
          { path: '/admin/roles/create', element: S(<RolesCreate />) },
          { path: '/admin/roles/:id/edit', element: S(<RolesEdit />) },
          // Permissions
          { path: '/admin/permissions', element: S(<PermissionsLoader />) },
          { path: '/admin/permissions/create', element: S(<PermissionsCreate />) },
          { path: '/admin/permissions/:id/edit', element: S(<PermissionsEdit />) },
          // Posts
          { path: '/admin/posts', element: S(<PostsLoader />) },
          { path: '/admin/posts/create', element: S(<PostsCreateLoader />) },
          { path: '/admin/posts/:id/edit', element: S(<PostsEditLoader />) },
          // Categories
          { path: '/admin/categories', element: S(<CategoriesLoader />) },
          { path: '/admin/categories/create', element: S(<CategoriesCreateLoader />) },
          { path: '/admin/categories/:id/edit', element: S(<CategoriesEditLoader />) },
          // Tags
          { path: '/admin/tags', element: S(<TagsLoader />) },
          { path: '/admin/tags/create', element: S(<TagsCreateLoader />) },
          { path: '/admin/tags/:id/edit', element: S(<TagsEditLoader />) },
          // Settings
          { path: '/admin/settings', element: S(<SettingsProfile />) },
          { path: '/admin/settings/account', element: S(<SettingsAccount />) },
          { path: '/admin/settings/permissions', element: S(<SettingsPermissions />) },
          { path: '/admin/settings/appearance', element: S(<SettingsAppearance />) },
          { path: '/admin/settings/notifications', element: S(<SettingsNotifications />) },
          { path: '/admin/settings/display', element: S(<SettingsDisplay />) },
          { path: '/admin/settings/branding', element: S(<SettingsBranding />) },
        ],
      },
      // Public blog (no auth required)
      { path: '/blog', element: S(<BlogIndexLoader />) },
      { path: '/blog/:slug', element: S(<BlogShowLoader />) },
      { path: '/', element: <Navigate to="/admin" replace /> },
      { path: '*', element: S(<NotFound />) },
    ],
  },
])

// ── Mount ─────────────────────────────────────────────────────────────────────

const appElement = document.getElementById('app')!

createRoot(appElement).render(
  <StrictMode>
    <ErrorBoundary>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </ErrorBoundary>
  </StrictMode>,
)
