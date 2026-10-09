import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserOrmEntity } from './user.orm.entity';
import { CategoryOrmEntity } from './category.orm.entity';
import { TagOrmEntity } from './tag.orm.entity';

@Entity('posts')
export class PostOrmEntity {
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
  status: 'draft' | 'scheduled' | 'published' | 'archived';

  @Column({ nullable: true, type: 'timestamp' })
  publishedAt: Date | null;

  @Column({ type: 'integer', default: 0 })
  viewCount: number;

  @Column({ name: 'author_id' })
  authorId: number;

  @ManyToOne(() => UserOrmEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: UserOrmEntity;

  @ManyToMany(() => CategoryOrmEntity, (category) => category.posts)
  @JoinTable({
    name: 'post_categories',
    joinColumn: { name: 'post_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: CategoryOrmEntity[];

  @ManyToMany(() => TagOrmEntity, (tag) => tag.posts)
  @JoinTable({
    name: 'post_tags',
    joinColumn: { name: 'post_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: TagOrmEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
