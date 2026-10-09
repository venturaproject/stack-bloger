import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { PostOrmEntity } from './post.orm.entity';
import { UserOrmEntity } from './user.orm.entity';

@Entity('post_reactions')
@Unique(['postId', 'userId', 'type'])
export class PostReactionOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'post_id' })
  postId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'varchar', length: 20 })
  type: 'heart' | 'unicorn' | 'lightbulb';

  @ManyToOne(() => PostOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: PostOrmEntity;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserOrmEntity;

  @CreateDateColumn()
  createdAt: Date;
}
