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
  { value: 'posts:read',        label: 'Artículos publicados (lectura)' },
  { value: 'categories:read',   label: 'Categorías (lectura)' },
  { value: 'tags:read',         label: 'Etiquetas (lectura)' },
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

  async issueToken(clientId: string, clientSecret: string) {
    const payload = new URLSearchParams({ grant_type: 'client_credentials' })
    const { data } = await axios.post('/api/v1/oauth/token', payload, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      auth: { username: clientId, password: clientSecret },
    })
    return data as { access_token: string; token_type: 'Bearer'; expires_in: number; scope: string }
  },
}
