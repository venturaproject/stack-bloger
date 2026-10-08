import { useEffect } from 'react'
import { IconCheck, IconMoon, IconSun } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-context'
import { useI18n } from '@/i18n/context'
import { axios } from '@/lib/axios'
import { useAuthStore } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()
  const authStatus = useAuthStore((state) => state.status)

  useEffect(() => {
    if (authStatus !== 'authenticated') return
    axios.get('/api/v1/settings').then(({ data }) => {
      const savedTheme = data.data.theme
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
        setTheme(savedTheme)
      }
    }).catch(() => undefined)
  }, [authStatus, setTheme])

  const changeTheme = (nextTheme: 'light' | 'dark' | 'system') => {
    setTheme(nextTheme)
    if (authStatus !== 'authenticated') return
    void axios.put('/api/v1/settings/appearance', { theme: nextTheme }).catch(() => undefined)
  }

  /* Update theme-color meta tag
   * when theme is updated */
  useEffect(() => {
    const themeColor = theme === 'dark' ? '#020817' : '#fff'
    const metaThemeColor = document.querySelector("meta[name='theme-color']")
    if (metaThemeColor) metaThemeColor.setAttribute('content', themeColor)
  }, [theme])

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='scale-95 rounded-full'>
          <IconSun className='size-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
          <IconMoon className='absolute size-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
          <span className='sr-only'>{t('theme_display_mode')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={() => changeTheme('light')}>
          {t('light')}{' '}
          <IconCheck
            size={14}
            className={cn('ml-auto', theme !== 'light' && 'hidden')}
          />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeTheme('dark')}>
          {t('dark')}
          <IconCheck
            size={14}
            className={cn('ml-auto', theme !== 'dark' && 'hidden')}
          />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeTheme('system')}>
          {t('system')}
          <IconCheck
            size={14}
            className={cn('ml-auto', theme !== 'system' && 'hidden')}
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
