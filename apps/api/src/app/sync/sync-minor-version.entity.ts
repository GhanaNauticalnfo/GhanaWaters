import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('sync_minor_version')
@Index(['created_at'])
@Index(['major_version', 'minor_version', 'created_at'])
export class SyncMinorVersion {
  @PrimaryColumn({ type: 'int' })
  major_version: number;

  @PrimaryColumn({ type: 'int' })
  minor_version: number;

  @Column({ type: 'jsonb' })
  data: any;

  @Column({ type: 'int' })
  size: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}