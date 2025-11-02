import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { NwNmMessagePart } from './nwnm-message-part.entity';

@Entity('nwnm_message')
export class NwNmMessage {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique database identifier', example: 1 })
  db_id: number;

  @Column('varchar', { length: 255, unique: true })
  @ApiProperty({ description: 'External message ID from source system', example: 'NW-123' })
  id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  @ApiProperty({ description: 'Timestamp when the message was created in our system', type: Date })
  created: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  @ApiProperty({ description: 'Timestamp when the message was last updated', type: Date })
  last_updated: Date;

  @Column('varchar', { length: 2 })
  @ApiProperty({ description: 'Message type: NW (Navigation Warning) or NM (Notice to Mariners)', example: 'NW' })
  main_type: string;

  @Column('varchar', { length: 255, nullable: true })
  @ApiProperty({ description: 'Message title', example: 'Warning: Obstruction in shipping lane' })
  title?: string;

  @Column('text', { nullable: true })
  @ApiProperty({ description: 'Message description', example: 'Submerged wreck reported at coordinates...' })
  description?: string;

  @Column('timestamptz', { nullable: true })
  @ApiProperty({ description: 'Publication date from source', type: Date })
  publish_date?: Date;

  @Column('boolean', { default: true })
  @ApiProperty({ description: 'Whether the message is currently active', example: true })
  active: boolean;

  @OneToMany(() => NwNmMessagePart, part => part.message, { cascade: true })
  @ApiProperty({ description: 'Geometry parts associated with this message', type: () => [NwNmMessagePart] })
  parts: NwNmMessagePart[];

  toResponseDto() {
    return {
      id: this.id,
      mainType: this.main_type,
      title: this.title,
      description: this.description,
      publishDate: this.publish_date?.toISOString(),
      active: this.active,
      parts: this.parts?.map(part => part.toResponseDto()) || [],
    };
  }
}
