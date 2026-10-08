import React from 'react'
import { cn } from '@/lib/utils'

interface MainProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

export const Main = ({ fixed, id = 'main-content', ...props }: MainProps) => {
  return (
    <main
      id={id}
      tabIndex={-1}
      className={cn(
        'peer-[.header-fixed]/header:mt-16',
        'px-4 py-6',
        fixed && 'fixed-main flex flex-col flex-grow overflow-hidden'
      )}
      {...props}
    />
  )
}

Main.displayName = 'Main'
