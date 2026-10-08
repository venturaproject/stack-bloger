import { axios } from '@/lib/axios'

export interface CategoryPayload {
  name: string
  slug?: string
  description?: string
}

export const categoriesApi = {
  async create(data: CategoryPayload) {
    const res = await axios.post('/api/v1/categories', data)
    return res.data
  },

  async update(id: number | string, data: Partial<CategoryPayload>) {
    const res = await axios.put(`/api/v1/categories/${id}`, data)
    return res.data
  },

  async delete(id: number | string): Promise<void> {
    await axios.delete(`/api/v1/categories/${id}`)
  },
}
