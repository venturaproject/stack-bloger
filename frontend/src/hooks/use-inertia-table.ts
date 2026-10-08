import { useCallback, useEffect, useRef, useState } from 'react'
import { router } from '@/lib/router'
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants'

interface UseInertiaTableOptions<T> {
  routeName: string
  initialFilters: T
  initialPerPage: number
  onNavigate?: () => void
}

export function useInertiaTable<T extends Record<string, string | undefined>>({
  routeName,
  initialFilters,
  initialPerPage,
  onNavigate,
}: UseInertiaTableOptions<T>) {
  const [filters, setFilters] = useState<T>(initialFilters)
  const [searchTerm, setSearchTerm] = useState(initialFilters?.search ?? '')
  const [perPage, setPerPage] = useState(initialPerPage)
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Limpieza del timer al desmontar
  useEffect(() => () => clearTimeout(debounceTimer.current), [])

  const navigate = useCallback((newFilters: T) => {
    setFilters(newFilters)
    onNavigate?.()
    router.get(route(routeName), newFilters, { preserveState: true, replace: true })
  }, [routeName, onNavigate])

  const handleSearch = useCallback(
    (value: string) => {
      setSearchTerm(value)
      clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => {
        navigate({ ...filters, search: value || undefined })
      }, SEARCH_DEBOUNCE_MS)
    },
    [filters, navigate],
  )

  const handlePageChange = (page: number) => {
    router.get(
      route(routeName),
      { ...filters, page, per_page: perPage },
      { preserveState: true, replace: true }
    )
  }

  const handlePerPageChange = (value: string) => {
    const newPerPage = parseInt(value)
    setPerPage(newPerPage)
    router.get(
      route(routeName),
      { ...filters, page: 1, per_page: newPerPage },
      { preserveState: true, replace: true }
    )
  }

  return {
    filters,
    searchTerm,
    setSearchTerm,
    perPage,
    navigate,
    handleSearch,
    handlePageChange,
    handlePerPageChange,
  }
}
