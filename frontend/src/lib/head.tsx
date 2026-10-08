import { useEffect } from 'react'

const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'App'

export function Head({ title }: { title?: string }) {
  useEffect(() => {
    document.title = title ? `${title} - ${APP_NAME}` : APP_NAME
  }, [title])
  return null
}
