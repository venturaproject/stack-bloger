import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToOne, JoinColumn,
} from 'typeorm';
import type { UserOrmEntity } from './user.orm.entity';

@Entity('user_settings')
export class UserSettingsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', unique: true })
  userId: number;

  @Column({ type: 'varchar', nullable: true })
  avatar: string | null;

  @Column({ type: 'varchar', nullable: true })
  theme: string | null;

  @Column({ type: 'varchar', nullable: true })
  font: string | null;

  @Column({ type: 'varchar', nullable: true })
  language: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  notificationType: string | null;

  @Column({ type: 'boolean', default: false })
  communicationEmails: boolean;

  @Column({ type: 'boolean', default: true })
  securityEmails: boolean;

  @Column({ type: 'boolean', default: false })
  mobileNotifications: boolean;

  @Column({ type: 'jsonb', nullable: true })
  displayItems: string[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne('UserOrmEntity', (u: UserOrmEntity) => u.settings)
  @JoinColumn({ name: 'user_id' })
  user: UserOrmEntity;
}
