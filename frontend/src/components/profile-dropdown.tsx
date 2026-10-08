import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { useAuthStore } from '@/lib/auth'
import { axios } from '@/lib/axios'
import { navigateTo } from '@/lib/navigation'
import { useI18n } from '@/i18n/context'

function getInitials(name?: string): string {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
}

export function ProfileDropdown() {
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  const { t } = useI18n()

  async function handleLogout() {
    try { await axios.post('/api/v1/auth/logout') } catch {}
    logout()
    navigateTo('/login')
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src={user?.avatar ?? '/images/default-avatar.png'} alt={`@${user?.name}`} />
            <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>{user?.name}</p>
            <p className='text-xs leading-none text-muted-foreground'>{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to='/admin/settings'>
              {t('account')}
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to='/admin/settings'>
              {t('settings')}
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href='/blog' target='_blank' rel='noopener noreferrer' className='flex items-center'>
            Ver blog
            <ExternalLink className='ml-auto h-4 w-4' />
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          {t('log_out')}
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
