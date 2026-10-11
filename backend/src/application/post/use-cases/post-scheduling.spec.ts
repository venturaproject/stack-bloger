import assert from 'node:assert/strict';
import test from 'node:test';
import { CommandBus, CqrsModule, QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { POST_REPOSITORY } from '../../../domain/post/repositories/post.repository.interface';
import { CreatePostHandler } from '../handlers/post-command.handlers';
import { GetPostByIdHandler, GetPostListHandler } from '../handlers/post-query.handlers';
import { CreatePostCommand } from '../commands/post.commands';
import { GetPostByIdQuery, GetPostListQuery } from '../queries/post.queries';
import { IPostRepository } from '../../../domain/post/repositories/post.repository.interface';
import { PostEntity } from '../../../domain/post/entities/post.entity';

function postRepository(): IPostRepository {
  const post = { id: 1, title: '', slug: '', content: '', status: 'draft', authorId: 1 } as PostEntity;
  return {
    findById: async () => post,
    findBySlug: async () => null,
    getPaginated: async () => ({ data: [post], total: 1, page: 1, perPage: 20, lastPage: 1 }),
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
  const handler = new CreatePostHandler(repository);
  const publishedAt = new Date(Date.now() + 60_000).toISOString();

  const post = await handler.execute(new CreatePostCommand({ title: 'Scheduled post', content: '<p>Content</p>', status: 'scheduled', publishedAt }, 1));

  assert.equal(post.status, 'scheduled');
  assert.equal(post.publishedAt?.toISOString(), publishedAt);
});

test('rejects a scheduled post without a future date', async () => {
  const handler = new CreatePostHandler(postRepository());

  await assert.rejects(
    () => handler.execute(new CreatePostCommand({ title: 'Scheduled post', content: '<p>Content</p>', status: 'scheduled' }, 1)),
    /future publication date/,
  );
});

test('dispatches post commands and queries through the CQRS buses', async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [CqrsModule],
    providers: [
      CreatePostHandler,
      GetPostByIdHandler,
      GetPostListHandler,
      { provide: POST_REPOSITORY, useValue: postRepository() },
    ],
  }).compile();
  const app = moduleRef.createNestApplication();
  try {
    await app.init();
    const commandBus = app.get(CommandBus);
    const queryBus = app.get(QueryBus);
    const created = await commandBus.execute(new CreatePostCommand({ title: 'CQRS post', content: '<p>Body</p>' }, 1));
    const found = await queryBus.execute(new GetPostByIdQuery(created.id));
    const page = await queryBus.execute(new GetPostListQuery({ status: 'draft' }));

    assert.equal(found.title, 'CQRS post');
    assert.equal(page.data[0]?.id, created.id);
  } finally {
    await app.close();
  }
});
