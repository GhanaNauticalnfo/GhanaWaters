import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('sync_major_version')
export class SyncMajorVersion {
  @PrimaryColumn({ type: 'int' })
  major_version: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'boolean', default: false })
  is_current: boolean;
}