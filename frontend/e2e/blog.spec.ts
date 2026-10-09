import { expect, test, type Page } from '@playwright/test'

const articles = [
  {
    id: 11,
    title: 'API security checklist',
    slug: 'api-security-checklist',
    content: '<h2>Protecting APIs</h2><p>Validate each request.</p>',
    excerpt: 'Practical security checks for APIs.',
    featuredImage: null,
    status: 'published' as const,
    publishedAt: '2026-04-15T10:00:00.000Z',
    author: { id: 1, name: 'Editor', avatar: null },
    categories: [{ id: 1, name: 'Security', slug: 'security' }],
    tags: [{ id: 1, name: 'API', slug: 'api' }],
    createdAt: '2026-04-15T10:00:00.000Z',
    updatedAt: '2026-04-15T10:00:00.000Z',
  },
  {
    id: 12,
    title: 'Improving the editor',
    slug: 'improving-the-editor',
    content: '<p>A guide to a better writing workflow.</p>',
    excerpt: 'Small improvements for writers.',
    featuredImage: null,
    status: 'published' as const,
    publishedAt: '2026-04-10T10:00:00.000Z',
    author: { id: 2, name: 'Author', avatar: null },
    categories: [{ id: 2, name: 'Writing', slug: 'writing' }],
    tags: [],
    createdAt: '2026-04-10T10:00:00.000Z',
    updatedAt: '2026-04-10T10:00:00.000Z',
  },
]

async function installPublicApiMocks(page: Page) {
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ status: 401, json: { message: 'Unauthorized' } }))
  await page.route('**/api/v1/branding', (route) => route.fulfill({ json: { brandName: 'Test Blog' } }))
  await page.route('**/api/v1/public/posts**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    const slug = path.split('/').at(-1)
    if (path.endsWith('/related')) return route.fulfill({ json: { data: [] } })
    if (path.endsWith('/comments')) return route.fulfill({ json: { data: [] } })
    if (path.endsWith('/engagement')) {
      return route.fulfill({ json: { data: { reactionCounts: { heart: 2, unicorn: 1, lightbulb: 0 }, commentCount: 0 } } })
    }
    if (path.endsWith('/view')) return route.fulfill({ json: { success: true } })
    if (slug && slug !== 'posts') {
      const post = articles.find((article) => article.slug === slug)
      return post
        ? route.fulfill({ json: { data: post } })
        : route.fulfill({ status: 404, json: { message: 'Not found' } })
    }

    const query = url.searchParams.get('search')?.toLowerCase() ?? ''
    const pageNumber = Number(url.searchParams.get('page') ?? '1')
    const filtered = articles.filter((article) => `${article.title} ${article.excerpt} ${article.content}`.toLowerCase().includes(query))
    const pageItems = pageNumber === 1 ? filtered : []
    return route.fulfill({
      json: {
        data: pageItems,
        meta: { total: filtered.length, page: pageNumber, perPage: 1, lastPage: Math.max(filtered.length, 1) },
      },
    })
  })
}

test.beforeEach(async ({ page }) => {
  await installPublicApiMocks(page)
})

test('renders cards and switches to the compact horizontal view', async ({ page }) => {
  await page.goto('/blog')

  await expect(page.getByRole('link', { name: 'API security checklist' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Improving the editor' })).toBeVisible()

  await page.getByRole('button', { name: 'Vista horizontal' }).click()
  await expect(page).toHaveURL(/view=table/)
  await expect(page.locator('section.divide-y article')).toHaveCount(2)
  await expect(page.getByText('Practical security checks for APIs.')).toBeVisible()

  await page.getByRole('button', { name: 'Vista de tarjetas' }).click()
  await expect(page).not.toHaveURL(/view=table/)
  await expect(page.locator('section.grid article')).toHaveCount(2)
})

test('filters automatically while typing and clears the search without a submit button', async ({ page }) => {
  await page.goto('/blog')
  const search = page.getByPlaceholder('Buscar artículos...')

  await search.fill('security')
  await expect(page).toHaveURL(/search=security/)
  await expect(page.getByRole('link', { name: 'API security checklist' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Improving the editor' })).toHaveCount(0)

  await page.locator('[aria-label="Limpiar búsqueda"]').click()
  await expect(page).not.toHaveURL(/search=/)
  await expect(page.getByRole('link', { name: 'Improving the editor' })).toBeVisible()
})

test('shows an actionable empty state when there are no search matches', async ({ page }) => {
  await page.goto('/blog')
  await page.getByPlaceholder('Buscar artículos...').fill('no matching article')

  await expect(page.getByText('No se encontraron artículos con esa búsqueda.')).toBeVisible()
  await page.locator('[aria-label="Limpiar búsqueda"]').click()
  await expect(page.getByRole('link', { name: 'API security checklist' })).toBeVisible()
})

test('paginates through the URL and preserves the search query', async ({ page }) => {
  await page.goto('/blog?search=a')
  await expect(page.getByRole('link', { name: 'API security checklist' })).toBeVisible()

  await page.getByRole('button', { name: 'Siguiente' }).click()
  await expect(page).toHaveURL(/search=a.*page=2|page=2.*search=a/)
  await expect(page.getByText('No se encontraron artículos con esa búsqueda.')).toBeVisible()
})

test('renders article content, metadata, and sign-in prompts for engagement', async ({ page }) => {
  await page.goto('/blog/api-security-checklist')

  await expect(page.getByRole('heading', { name: 'API security checklist' })).toBeVisible()
  await expect(page.getByText('Protecting APIs')).toBeVisible()
  await expect(page.getByRole('button', { name: /Me gusta:/ })).toBeDisabled()
  await expect(page.getByRole('link', { name: 'Inicia sesión' })).toBeVisible()
  const structuredData = await page.locator('#blog-jsonld').evaluate((element) => JSON.parse(element.textContent ?? '{}'))
  expect(structuredData['@type']).toBe('BlogPosting')
})
