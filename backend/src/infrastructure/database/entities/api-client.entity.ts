import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('api_clients')
export class ApiClientEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_id', unique: true, length: 64 })
  clientId: string;

  @Column({ length: 120 })
  name: string;

  @Column({ name: 'secret_hash', type: 'varchar', length: 100 })
  secretHash: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  scopes: string[];

  @Column({ default: true })
  active: boolean;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date | null;

  @Column({ name: 'created_by', type: 'integer' })
  createdBy: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
