import {AppSidebar} from "@/components/layout/app-sidebar"
import {Header} from '@/components/layout/header'
import {ProfileDropdown} from '@/components/profile-dropdown'
import {Search} from '@/components/search'
import NotificationButton from '@/components/notification/notification-button'
import SkipToMain from '@/components/skip-to-main'

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {ThemeSwitch} from "@/components/theme-switch"
import { useEffect } from "react"
import type React from 'react'

const appName = import.meta.env.VITE_APP_NAME || 'Shadcn Laravel Admin'

type AuthenticatedLayoutProps = {
  children: React.ReactNode
  title?: string
  showHeader?: boolean
  withTopNav?: boolean
}

export function AuthenticatedLayout({
    children,
    title,
    showHeader = true,
    withTopNav: _withTopNav = true,
  }: AuthenticatedLayoutProps) {

  useEffect(() => {
    document.title = title ? `${title} - ${appName}` : appName
  }, [title])

  return (
    <>
      <SkipToMain />
      <SidebarProvider>
        <AppSidebar/>
        <SidebarInset>
          {showHeader && <Header>
            <div className='ml-auto flex items-center space-x-4'>
              <Search/>
              <NotificationButton/>
              <ThemeSwitch/>
              <ProfileDropdown/>
            </div>
          </Header>}

          {children}
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}
