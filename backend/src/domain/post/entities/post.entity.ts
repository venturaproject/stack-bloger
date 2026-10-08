import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { CategoryEntity } from './category.entity';
import { TagEntity } from './tag.entity';

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'archived';

@Entity('posts')
export class PostEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ unique: true, length: 255 })
  slug: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  excerpt: string | null;

  @Column({ type: 'varchar', nullable: true })
  featuredImage: string | null;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: PostStatus;

  @Column({ nullable: true, type: 'timestamp' })
  publishedAt: Date | null;

  @Column({ type: 'integer', default: 0 })
  viewCount: number;

  @Column({ name: 'author_id' })
  authorId: number;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: UserEntity;

  @ManyToMany(() => CategoryEntity, (category) => category.posts, { cascade: false })
  @JoinTable({
    name: 'post_categories',
    joinColumn: { name: 'post_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: CategoryEntity[];

  @ManyToMany(() => TagEntity, (tag) => tag.posts, { cascade: false })
  @JoinTable({
    name: 'post_tags',
    joinColumn: { name: 'post_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: TagEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
