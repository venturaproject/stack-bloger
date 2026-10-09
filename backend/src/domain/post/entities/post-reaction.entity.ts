import { PostEntity } from './post.entity';
import { UserEntity } from '../../user/entities/user.entity';

export type ReactionType = 'heart' | 'unicorn' | 'lightbulb';

export class PostReactionEntity {
  id: number;

  postId: number;

  userId: number;

  type: ReactionType;

  post: PostEntity;

  user: UserEntity;

  createdAt: Date;
}
