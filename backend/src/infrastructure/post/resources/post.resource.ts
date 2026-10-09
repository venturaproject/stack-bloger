import { PostEntity } from '../../../domain/post/entities/post.entity';
import { normalizeAvatarUrl } from '../../user/avatar-url';

export class PostResource {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featuredImage: string | null;
  status: string;
  publishedAt: string | null;
  viewCount: number;
  author: { id: number; name: string; avatar: string | null } | null;
  categories: Array<{ id: number; name: string; slug: string }>;
  tags: Array<{ id: number; name: string; slug: string }>;
  createdAt: string;
  updatedAt: string;

  constructor(post: PostEntity) {
    this.id = post.id;
    this.title = post.title;
    this.slug = post.slug;
    this.content = post.content;
    this.excerpt = post.excerpt;
    this.featuredImage = post.featuredImage;
    this.status = post.status;
    this.publishedAt = post.publishedAt?.toISOString() ?? null;
    this.viewCount = post.viewCount;
    this.author = post.author
      ? { id: post.author.id, name: post.author.name, avatar: normalizeAvatarUrl(post.author.settings?.avatar) }
      : null;
    this.categories = (post.categories ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    }));
    this.tags = (post.tags ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
    }));
    this.createdAt = post.createdAt.toISOString();
    this.updatedAt = post.updatedAt.toISOString();
  }

  static from(post: PostEntity): PostResource {
    return new PostResource(post);
  }

  static collection(posts: PostEntity[]): PostResource[] {
    return posts.map((p) => new PostResource(p));
  }
}
