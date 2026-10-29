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
