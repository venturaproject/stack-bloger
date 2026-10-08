import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';
import { PostEntity } from './post.entity';
import { UserEntity } from '../../user/entities/user.entity';

@Entity('post_bookmarks')
@Unique(['postId', 'userId'])
export class PostBookmarkEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'post_id' })
  postId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => PostEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: PostEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @CreateDateColumn()
  createdAt: Date;
}
