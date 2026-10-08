import { BookOpen } from 'lucide-react'

interface BlogLogoProps {
  className?: string
  isCollapsed?: boolean
}

const BlogLogo = ({ className = '', isCollapsed = false }: BlogLogoProps) => {
  if (isCollapsed) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <BookOpen className="h-6 w-6" />
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <BookOpen className="h-6 w-6 shrink-0" />
      <span className="font-semibold text-base leading-tight">Blog CMS</span>
    </div>
  )
}

export default BlogLogo
