import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { NwNmMessage } from './nwnm-message.entity';

@Entity('nwnm_message_part')
export class NwNmMessagePart {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique identifier for the message part', example: 1 })
  id: number;

  @Column('integer')
  message_db_id: number;

  @ManyToOne(() => NwNmMessage, message => message.parts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_db_id' })
  message: NwNmMessage;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Geometry',
    srid: 4326,
    nullable: true
  })
  @ApiProperty({ description: 'PostGIS geometry for this part (Point, LineString, or Polygon)' })
  geometry: string;

  toResponseDto() {
    return {
      geometry: this.geometry ? JSON.parse(this.geometry as unknown as string) : null,
    };
  }
}
