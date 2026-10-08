import assert from 'node:assert/strict';
import test from 'node:test';
import { CreatePostUseCase } from './create-post.use-case';
import { IPostRepository } from '../../../domain/post/repositories/post.repository.interface';
import { PostEntity } from '../../../domain/post/entities/post.entity';

function postRepository(): IPostRepository {
  const post = { id: 1, title: '', slug: '', content: '', status: 'draft', authorId: 1 } as PostEntity;
  return {
    findById: async () => post,
    findBySlug: async () => null,
    getPaginated: async () => ({ data: [], total: 0, page: 1, perPage: 20, lastPage: 0 }),
    create: async (data) => Object.assign(post, data),
    update: async (_post, data) => Object.assign(post, data),
    delete: async () => undefined,
    generateSlug: async () => 'scheduled-post',
    getStats: async () => ({ total: 0, published: 0, draft: 0, archived: 0 }),
    syncCategories: async (value) => value,
    syncTags: async (value) => value,
    findRelated: async () => [],
    incrementViews: async () => undefined,
    publishScheduled: async () => undefined,
  };
}

test('creates a scheduled post with its requested future date', async () => {
  const repository = postRepository();
  const useCase = new CreatePostUseCase(repository);
  const publishedAt = new Date(Date.now() + 60_000).toISOString();

  const post = await useCase.execute({ title: 'Scheduled post', content: '<p>Content</p>', status: 'scheduled', publishedAt }, 1);

  assert.equal(post.status, 'scheduled');
  assert.equal(post.publishedAt?.toISOString(), publishedAt);
});

test('rejects a scheduled post without a future date', async () => {
  const useCase = new CreatePostUseCase(postRepository());

  await assert.rejects(
    () => useCase.execute({ title: 'Scheduled post', content: '<p>Content</p>', status: 'scheduled' }, 1),
    /future publication date/,
  );
});
