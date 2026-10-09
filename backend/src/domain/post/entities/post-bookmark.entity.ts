import { PostEntity } from './post.entity';
import { UserEntity } from '../../user/entities/user.entity';

export class PostBookmarkEntity {
  id: number;

  postId: number;

  userId: number;

  post: PostEntity;

  user: UserEntity;

  createdAt: Date;
}
