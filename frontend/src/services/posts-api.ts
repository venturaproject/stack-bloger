import { axios } from '@/lib/axios'

export interface PostPayload {
  title: string
  slug?: string
  content: string
  excerpt?: string
  featuredImage?: string
  status?: 'draft' | 'scheduled' | 'published' | 'archived'
  publishedAt?: string
  categoryIds?: number[]
  tagIds?: number[]
}

export const postsApi = {
  async create(data: PostPayload) {
    const res = await axios.post('/api/v1/posts', data)
    return res.data
  },

  async update(id: number | string, data: Partial<PostPayload>) {
    const res = await axios.put(`/api/v1/posts/${id}`, data)
    return res.data
  },

  async delete(id: number | string): Promise<void> {
    await axios.delete(`/api/v1/posts/${id}`)
  },
}
