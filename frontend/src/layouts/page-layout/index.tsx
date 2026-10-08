import { Header } from "./header";
import { PropsWithChildren } from 'react';
import SkipToMain from '@/components/skip-to-main'

export function PageLayout({
    children,
    title,
  }: PropsWithChildren<{ title?: string }>) {
  return (
    <>
      <SkipToMain />
      <Header title={title}/>
      <main id='main-content' tabIndex={-1}>
        {children}
      </main>
    </>
  )
}
