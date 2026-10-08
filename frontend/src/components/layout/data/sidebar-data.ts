import {
  IconBrowserCheck,
  IconHelp,
  IconLayoutDashboard,
  IconNotification,
  IconPalette,
  IconSettings,
  IconTag,
  IconTool,
  IconUserCog,
  IconUsers,
  IconFolder,
  IconShield,
  IconKey,
  IconWriting,
} from '@tabler/icons-react'
import { type SidebarData } from '../types'
import MayorLogo from '../mayor-logo'

export const sidebarData: SidebarData = {
  teams: [
    {
      name: 'Blog CMS',
      logo: MayorLogo,
      plan: 'Plataforma de contenidos',
    },
  ],
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/admin',
          icon: IconLayoutDashboard,
        },
      ],
    },
    {
      title: 'Blog',
      items: [
        {
          title: 'Posts',
          url: '/admin/posts',
          icon: IconWriting,
        },
        {
          title: 'Categorías',
          url: '/admin/categories',
          icon: IconFolder,
        },
        {
          title: 'Tags',
          url: '/admin/tags',
          icon: IconTag,
        },
      ],
    },
    {
      title: 'Control de Acceso',
      items: [
        {
          title: 'Usuarios',
          url: '/admin/users',
          icon: IconUsers,
          permission: 'users.view',
        },
        {
          title: 'Roles',
          url: '/admin/roles',
          icon: IconShield,
          permission: 'roles.view',
        },
        {
          title: 'Permisos',
          url: '/admin/permissions',
          icon: IconKey,
          permission: 'permissions.view',
        },
      ],
    },
    {
      title: 'Otros',
      items: [
        {
          title: 'Configuración',
          icon: IconSettings,
          items: [
            {
              title: 'Perfil',
              url: '/admin/settings',
              icon: IconUserCog,
            },
            {
              title: 'Cuenta',
              url: '/admin/settings/account',
              icon: IconTool,
            },
            {
              title: 'Apariencia',
              url: '/admin/settings/appearance',
              icon: IconPalette,
            },
            {
              title: 'Notificaciones',
              url: '/admin/settings/notifications',
              icon: IconNotification,
            },
            {
              title: 'Visualización',
              url: '/admin/settings/display',
              icon: IconBrowserCheck,
            },
          ],
        },
        {
          title: 'Centro de Ayuda',
          url: '/admin/help-center',
          icon: IconHelp,
        },
      ],
    },
  ],
}
