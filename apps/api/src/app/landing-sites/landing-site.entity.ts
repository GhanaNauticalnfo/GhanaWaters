import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { GeoPoint } from '@ghanawaters/shared-models';
import { LandingSiteResponseDto } from './dto/landing-site-response.dto';

@Entity('landing_sites')
export class LandingSite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    transformer: {
      from: (value: any) => {
        if (!value) return null;
        // TypeORM returns GeoJSON string for geography types
        if (typeof value === 'string') {
          return JSON.parse(value);
        }
        return value;
      },
      to: (value: GeoPoint) => value,
    },
  })
  @Index({ spatial: true })
  location: GeoPoint;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  toResponseDto(): LandingSiteResponseDto {
    const dto: LandingSiteResponseDto = {
      id: this.id,
      name: this.name,
      description: this.description,
      location: this.location,
      active: this.active,
      created_at: this.created_at.toISOString(),
      updated_at: this.updated_at.toISOString(),
    };


    return dto;
  }
}