import { PostEntity } from './post.entity';
import { UserEntity } from '../../user/entities/user.entity';

export type CommentStatus = 'pending' | 'approved' | 'rejected';

export class PostCommentEntity {
  id: number;

  postId: number;

  userId: number;

  content: string;

  status: CommentStatus;

  post: PostEntity;

  user: UserEntity;

  createdAt: Date;
}
