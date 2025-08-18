// kml-dataset.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { KmlDatasetResponseDto } from './dto';

@Entity()
export class KmlDataset {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  last_updated: Date;

  @Column('text', { nullable: true })
  kml?: string;

  @Column('varchar', { length: 255, nullable: true })
  name?: string;

  @Column('boolean', { default: true })
  enabled: boolean;

  toResponseDto(): KmlDatasetResponseDto {
    return {
      id: this.id,
      created: this.created.toISOString(),
      last_updated: this.last_updated.toISOString(),
      kml: this.kml,
      name: this.name,
      enabled: this.enabled,
    };
  }
}