import { axios } from '@/lib/axios'

export interface ApiClientRecord {
  id: string
  name: string
  client_id: string
  scopes: string[]
  active: boolean
  last_used_at: string | null
  created_at: string
}

export interface CreateApiClientPayload {
  name: string
  scopes: string[]
}

export interface CreateApiClientResponse {
  client: ApiClientRecord
  secret: string
}

export const AVAILABLE_SCOPES = [
  { value: 'dispositivos:read', label: 'Dispositivos (lectura)' },
  { value: 'telefonos:read',    label: 'Teléfonos (lectura)' },
  { value: 'trabajadores:read', label: 'Trabajadores (lectura)' },
  { value: '*',                 label: 'Acceso completo (*)' },
]

export const apiClientsApi = {
  async list(): Promise<ApiClientRecord[]> {
    const { data } = await axios.get('/api/v1/api-clients')
    return data
  },

  async create(payload: CreateApiClientPayload): Promise<CreateApiClientResponse> {
    const { data } = await axios.post('/api/v1/api-clients', payload)
    return data
  },

  async revoke(id: string): Promise<void> {
    await axios.delete(`/api/v1/api-clients/${id}`)
  },
}
