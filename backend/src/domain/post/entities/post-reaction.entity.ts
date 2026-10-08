import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { PostEntity } from './post.entity';
import { UserEntity } from '../../user/entities/user.entity';

export type ReactionType = 'heart' | 'unicorn' | 'lightbulb';

@Entity('post_reactions')
@Unique(['postId', 'userId', 'type'])
export class PostReactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'post_id' })
  postId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'varchar', length: 20 })
  type: ReactionType;

  @ManyToOne(() => PostEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: PostEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @CreateDateColumn()
  createdAt: Date;
}
