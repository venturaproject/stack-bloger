import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { axios } from '@/lib/axios'

export function useListPage<T>(endpoint: string, extraParams?: Record<string, string>) {
  const [searchParams] = useSearchParams()

  const params: Record<string, string> = { ...extraParams }
  searchParams.forEach((value, key) => { params[key] = value })

  const queryKey = [endpoint, params]

  const { data, isLoading, error, refetch } = useQuery<T>({
    queryKey,
    queryFn: () =>
      axios
        .get(endpoint, { params })
        .then((r) => r.data),
  })

  return { data, isLoading, error, refetch }
}
