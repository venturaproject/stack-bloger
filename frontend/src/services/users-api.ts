import { axios } from '@/lib/axios'

export const usersApi = {
  async delete(id: string | number): Promise<void> {
    await axios.delete(`/api/v1/users/${id}`)
  },
}
