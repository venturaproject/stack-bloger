import {
  IconBrowserCheck,
  IconHelp,
  IconKey,
  IconLayoutDashboard,
  IconNotification,
  IconPalette,
  IconSettings,
  IconUserCog,
  IconUsers,
  IconArticle,
  IconTag,
  IconFolder,
  IconPhoto,
} from '@tabler/icons-react'
import { type SidebarData } from '../types'
import MayorLogo from '../mayor-logo'
import { useI18n } from '@/i18n/context'
import { useBranding } from '@/context/branding-context'

export const DynamicSidebarData = () => {
  const { t } = useI18n()
  const { brandName } = useBranding()

  const sidebarData: SidebarData = {
    teams: [
      {
        name: brandName,
        logo: MayorLogo,
        plan: 'Content Management',
      },
    ],
    navGroups: [
      {
        title: t('general'),
        items: [
          {
            title: t('dashboard'),
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
            icon: IconArticle,
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
        title: t('access_control'),
        items: [
          {
            title: t('users'),
            url: '/admin/users',
            icon: IconUsers,
            permission: 'users.view',
          },
        ],
      },
      {
        title: t('others'),
        items: [
          {
            title: t('configuration'),
            icon: IconSettings,
            items: [
              {
                title: t('profile'),
                url: '/admin/settings',
                icon: IconUserCog,
              },
              {
                title: t('permissions'),
                url: '/admin/settings/permissions',
                icon: IconKey,
              },
              {
                title: t('appearance'),
                url: '/admin/settings/appearance',
                icon: IconPalette,
              },
              {
                title: t('notifications'),
                url: '/admin/settings/notifications',
                icon: IconNotification,
              },
              {
                title: t('display'),
                url: '/admin/settings/display',
                icon: IconBrowserCheck,
              },
              {
                title: t('branding'),
                url: '/admin/settings/branding',
                icon: IconPhoto,
              },
            ],
          },
          {
            title: t('help_center'),
            url: '/admin/help-center',
            icon: IconHelp,
          },
        ],
      },
    ],
  };

  return sidebarData;
};
