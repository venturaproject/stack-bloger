import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PostEntity } from './post.entity';
import { UserEntity } from '../../user/entities/user.entity';

export type CommentStatus = 'pending' | 'approved' | 'rejected';

@Entity('post_comments')
export class PostCommentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'post_id' })
  postId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: CommentStatus;

  @ManyToOne(() => PostEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: PostEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @CreateDateColumn()
  createdAt: Date;
}
