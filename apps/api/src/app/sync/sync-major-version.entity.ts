import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('sync_major_version')
export class SyncMajorVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  major_version: number;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'boolean', default: false })
  is_current: boolean;
}