import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { BlogLayout } from '@/layouts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bookmark, ChevronLeft, Clock, Heart, Lightbulb, MessageCircle, Send, Sparkles } from 'lucide-react'
import { pathFor } from '@/lib/app-routes'
import type { Post } from '@/pages/posts/columns'
import DOMPurify from 'dompurify'
import { useI18n } from '@/i18n/context'
import { axios } from '@/lib/axios'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/lib/auth'

const siteUrl = import.meta.env.VITE_SITE_URL || ''

function readingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

function imgSrc(url: string) {
  if (url.startsWith('http')) return url
  if (url.startsWith('/uploads/')) return `/api${url}`
  return url
}

function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY
      const docHeight = document.body.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0)
    }
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div className='fixed top-0 left-0 z-50 h-1 w-full bg-border'>
      <div
        className='h-full bg-primary transition-all duration-75'
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

interface BlogShowProps {
  post?: Post
  relatedPosts?: Post[]
  error?: string
  comments?: BlogComment[]
  engagement?: Engagement
}

interface BlogComment {
  id: number
  content: string
  createdAt: string
  user: { id: number; name: string; avatar: string | null }
  status?: 'pending' | 'approved' | 'rejected'
}

interface Engagement {
  reactionCounts: { heart: number; unicorn: number; lightbulb: number }
  commentCount: number
}

export default function BlogShow({ post, relatedPosts = [], comments = [], engagement, error }: BlogShowProps) {
  const { t, currentLang } = useI18n()
  const authStatus = useAuthStore((state) => state.status)
  const contentRef = useRef<HTMLDivElement>(null)
  const [commentText, setCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentList, setCommentList] = useState(comments)
  const [engagementState, setEngagementState] = useState<Engagement>(engagement ?? { reactionCounts: { heart: 0, unicorn: 0, lightbulb: 0 }, commentCount: 0 })
  const [bookmarked, setBookmarked] = useState(false)
  const longDateFormatter = new Intl.DateTimeFormat(currentLang === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const shortDateFormatter = new Intl.DateTimeFormat(currentLang === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  useEffect(() => {
    if (!post || sessionStorage.getItem(`viewed-post-${post.id}`)) return
    sessionStorage.setItem(`viewed-post-${post.id}`, '1')
    void axios.post(`/api/v1/public/posts/${post.slug}/view`).catch(() => undefined)
  }, [post])

  useEffect(() => {
    const container = contentRef.current
    if (!container || !post) return
    const blocks = container.querySelectorAll('pre')
    blocks.forEach((pre) => {
      if (pre.querySelector('.copy-btn')) return
      pre.style.position = 'relative'
      const btn = document.createElement('button')
      btn.className = 'copy-btn'
      btn.setAttribute('aria-label', t('blog_copy_code'))
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`
      Object.assign(btn.style, {
        position: 'absolute', top: '10px', right: '10px',
        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '6px', padding: '4px 6px', cursor: 'pointer',
        color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '4px',
        fontSize: '12px', transition: 'background 0.15s',
      })
      btn.onmouseenter = () => { btn.style.background = 'rgba(255,255,255,0.2)' }
      btn.onmouseleave = () => { btn.style.background = 'rgba(255,255,255,0.1)' }
      btn.onclick = async () => {
        const code = pre.querySelector('code')?.innerText ?? pre.innerText
        await navigator.clipboard.writeText(code)
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`
        btn.style.color = '#4ade80'
        setTimeout(() => {
          btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`
          btn.style.color = '#e2e8f0'
        }, 2000)
      }
      pre.appendChild(btn)
    })
  }, [post, t])

  useEffect(() => setCommentList(comments), [comments])
  useEffect(() => { if (engagement) setEngagementState(engagement) }, [engagement])

  if (error || !post) {
    return (
      <BlogLayout title={t('blog_post_not_found')}>
        <div className='space-y-4'>
          <Link to={pathFor('blog.index')} className='flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'>
            <ChevronLeft className='h-4 w-4' /> {t('blog_back_to_blog')}
          </Link>
          <p className='text-muted-foreground'>{error ?? t('blog_post_not_found_description')}</p>
        </div>
      </BlogLayout>
    )
  }

  const minutes = readingTime(post.content ?? '')
  const canonicalPath = `/blog/${post.slug}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.featuredImage ? imgSrc(post.featuredImage) : undefined,
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt,
    author: post.author ? { '@type': 'Person', name: post.author.name } : undefined,
    url: `${siteUrl}${canonicalPath}`,
  }

  const toggleReaction = async (type: keyof Engagement['reactionCounts']) => {
    if (authStatus !== 'authenticated') return
    const { data } = await axios.post(`/api/v1/public/posts/${post.slug}/reactions`, { type })
    setEngagementState(data.data)
  }

  const submitComment = async () => {
    const content = commentText.trim()
    if (!content || authStatus !== 'authenticated') return
    setIsSubmittingComment(true)
    try {
      const { data } = await axios.post(`/api/v1/public/posts/${post.slug}/comments`, { content })
      setCommentList((current) => [...current, data.data])
      setEngagementState((current) => ({ ...current, commentCount: current.commentCount + 1 }))
      setCommentText('')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const toggleBookmark = async () => {
    if (authStatus !== 'authenticated') return
    const { data } = await axios.post(`/api/v1/public/posts/${post.slug}/bookmark`)
    setBookmarked(data.data.bookmarked)
  }

  return (
    <BlogLayout
      title={post.title}
      description={post.excerpt ?? undefined}
      ogImage={post.featuredImage ? imgSrc(post.featuredImage) : undefined}
      canonicalPath={canonicalPath}
      jsonLd={jsonLd}
    >
      <ReadingProgress />

      <article className='space-y-8'>
        <div className='space-y-4'>
          <Link to={pathFor('blog.index')} className='flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground'>
            <ChevronLeft className='h-4 w-4' /> {t('blog_back_to_blog')}
          </Link>

          {post.categories?.length > 0 && (
            <div className='flex flex-wrap gap-1'>
              {post.categories.map((c) => (
                <Badge key={c.id} variant='secondary'>{c.name}</Badge>
              ))}
            </div>
          )}

          <h1 className='text-3xl font-bold leading-tight tracking-tight lg:text-4xl'>
            {post.title}
          </h1>

          {post.excerpt && (
            <p className='text-lg text-muted-foreground'>{post.excerpt}</p>
          )}

          <div className='flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
            {post.author && (
              <span className='font-medium text-foreground'>{post.author.name}</span>
            )}
            {post.publishedAt && (
              <time dateTime={post.publishedAt}>
                {longDateFormatter.format(new Date(post.publishedAt))}
              </time>
            )}
            <span className='flex items-center gap-1'>
              <Clock className='h-3.5 w-3.5' />
              {t('blog_reading_time', { count: minutes })}
            </span>
          </div>

          {post.tags?.length > 0 && (
            <div className='flex flex-wrap gap-1'>
              {post.tags.map((t) => (
                <Badge key={t.id} variant='outline'>{t.name}</Badge>
              ))}
            </div>
          )}
        </div>

        {post.featuredImage && (
          <img
            src={imgSrc(post.featuredImage)}
            alt={post.title}
            className='aspect-video w-full rounded-lg object-cover max-h-96'
            width={1280}
            height={720}
            loading='eager'
            fetchPriority='high'
            decoding='async'
          />
        )}

        <hr />

        {post.content && (
          <div
            ref={contentRef}
            className='prose prose-neutral dark:prose-invert max-w-none'
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
          />
        )}

        <section className='space-y-6 border-y py-8'>
          <div className='flex flex-wrap items-center gap-2'>
            {([
              ['heart', Heart, t('blog_reaction_heart')],
              ['unicorn', Sparkles, t('blog_reaction_unicorn')],
              ['lightbulb', Lightbulb, t('blog_reaction_lightbulb')],
            ] as const).map(([type, Icon, label]) => (
              <Button key={type} type='button' variant='outline' size='sm' className='gap-1.5' disabled={authStatus !== 'authenticated'} title={authStatus === 'authenticated' ? label : t('blog_login_to_react')} onClick={() => void toggleReaction(type)}><Icon className='h-4 w-4' />{engagementState.reactionCounts[type]}</Button>
            ))}
            <Button type='button' variant={bookmarked ? 'secondary' : 'outline'} size='sm' className='gap-1.5' disabled={authStatus !== 'authenticated'} title={authStatus === 'authenticated' ? t('blog_save_post') : t('blog_login_to_react')} onClick={() => void toggleBookmark()}><Bookmark className='h-4 w-4' />{t(bookmarked ? 'blog_saved_post' : 'blog_save_post')}</Button>
            <span className='ml-1 flex items-center gap-1 text-sm text-muted-foreground'><MessageCircle className='h-4 w-4' />{engagementState.commentCount}</span>
          </div>
          {authStatus !== 'authenticated' && <p className='text-sm text-muted-foreground'><Link to='/login' className='font-medium text-foreground underline'>{t('blog_login')}</Link> {t('blog_login_to_interact')}</p>}
        </section>

        <section className='space-y-5'>
          <h2 className='text-xl font-semibold'>{t('blog_comments', { count: engagementState.commentCount })}</h2>
          {authStatus === 'authenticated' && <div className='space-y-2'><Textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} maxLength={2000} placeholder={t('blog_comment_placeholder')} /><div className='flex items-center justify-between'><span className='text-xs text-muted-foreground'>{commentText.length}/2000</span><Button size='sm' disabled={!commentText.trim() || isSubmittingComment} onClick={() => void submitComment()}><Send className='mr-2 h-4 w-4' />{t('blog_publish_comment')}</Button></div></div>}
          {commentList.length === 0 ? <p className='text-sm text-muted-foreground'>{t('blog_no_comments')}</p> : <div className='space-y-4'>{commentList.map((comment) => <article key={comment.id} className='rounded-lg border bg-card p-4'><div className='mb-2 flex items-center justify-between gap-3 text-sm'><span className='font-medium'>{comment.user.name}</span><time className='text-xs text-muted-foreground' dateTime={comment.createdAt}>{shortDateFormatter.format(new Date(comment.createdAt))}</time></div><p className='whitespace-pre-wrap text-sm leading-6'>{comment.content}</p>{comment.status === 'pending' && <p className='mt-2 text-xs text-muted-foreground'>{t('blog_comment_pending')}</p>}</article>)}</div>}
        </section>

        {relatedPosts.length > 0 && (
          <section className='space-y-4 border-t pt-8'>
            <h2 className='text-xl font-semibold'>{t('blog_related_posts')}</h2>
            <div className='grid gap-4 sm:grid-cols-3'>
              {relatedPosts.map((related) => (
                <Link
                  key={related.id}
                  to={pathFor('blog.show', related.slug)}
                  className='group space-y-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors'
                >
                  {related.featuredImage && (
                    <img
                      src={imgSrc(related.featuredImage)}
                      alt={related.title}
                      className='w-full rounded-md object-cover h-32'
                      width={384}
                      height={128}
                      loading='lazy'
                    />
                  )}
                  <p className='text-sm font-medium leading-snug group-hover:underline underline-offset-4'>
                    {related.title}
                  </p>
                  {related.publishedAt && (
                    <p className='text-xs text-muted-foreground'>
                      {shortDateFormatter.format(new Date(related.publishedAt))}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </BlogLayout>
  )
}
