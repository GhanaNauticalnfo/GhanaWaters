import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Waypoint } from '@ghanawaters/shared-models';
import { RouteResponseDto } from './dto/route-response.dto';

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  notes: string;

  @Column('jsonb', { default: [] })
  waypoints: Waypoint[];


  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  last_updated: Date;

  toResponseDto(): RouteResponseDto {
    const dto: RouteResponseDto = {
      id: this.id,
      name: this.name,
      notes: this.notes,
      waypoints: this.waypoints,
      enabled: this.enabled,
      created: this.created.toISOString(),
      last_updated: this.last_updated.toISOString(),
    };
    return dto;
  }
}