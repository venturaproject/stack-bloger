import { axios } from '@/lib/axios'

export interface TagPayload {
  name: string
  slug?: string
}

export const tagsApi = {
  async create(data: TagPayload) {
    const res = await axios.post('/api/v1/tags', data)
    return res.data
  },

  async update(id: number | string, data: Partial<TagPayload>) {
    const res = await axios.put(`/api/v1/tags/${id}`, data)
    return res.data
  },

  async delete(id: number | string): Promise<void> {
    await axios.delete(`/api/v1/tags/${id}`)
  },
}
