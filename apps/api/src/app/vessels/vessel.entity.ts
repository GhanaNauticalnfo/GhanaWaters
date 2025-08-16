// vessel.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VesselTelemetry } from './tracking/vessel-telemetry.entity';
import { VesselType } from './type/vessel-type.entity';
import { Device } from './device/device.entity';
import { VesselResponseDto } from './dto/vessel-response.dto';
import { GeoPoint, DeviceState } from '@ghanawaters/shared-models';

@Entity()
export class Vessel {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique identifier for the vessel', example: 1 })
  id: number;

  @CreateDateColumn()
  @ApiProperty({ description: 'Timestamp when the vessel was created', type: Date })
  created: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Timestamp when the vessel was last updated', type: Date })
  last_updated: Date;

  @Column('varchar', { length: 255 })
  @ApiProperty({ description: 'Name of the vessel', example: 'MV Ghana Star' })
  name: string;

  @ManyToOne(() => VesselType, vesselType => vesselType.vessels, { nullable: false })
  @JoinColumn({ name: 'vessel_type_id' })
  @ApiProperty({ description: 'Vessel type', type: () => VesselType })
  vessel_type: VesselType;

  @Column('integer', { nullable: true })
  latest_position_id: number;

  @ManyToOne(() => VesselTelemetry)
  @JoinColumn({ name: 'latest_position_id' })
  @ApiPropertyOptional({ description: 'Latest tracking position for this vessel', type: () => VesselTelemetry })
  latest_position: VesselTelemetry;

  @OneToMany(() => Device, device => device.vessel)
  @ApiPropertyOptional({ description: 'Devices associated with this vessel', type: () => [Device] })
  devices?: Device[];

  toResponseDto(coordinates?: GeoPoint): VesselResponseDto {
    const dto: VesselResponseDto = {
      id: this.id,
      created: this.created,
      last_updated: this.last_updated,
      name: this.name,
      vessel_type: this.vessel_type?.toResponseDto(),
    };

    // Include latest position data if available
    if (this.latest_position) {
      dto.latest_position_timestamp = this.latest_position.timestamp;
      dto.latest_position_speed = this.latest_position.speed_knots;
      dto.latest_position_heading = this.latest_position.heading_degrees;
      
      if (coordinates) {
        dto.latest_position_coordinates = coordinates;
      }
    }

    // Check if vessel has any active devices
    if (this.devices) {
      dto.has_active_device = this.devices.some(device => device.state === DeviceState.ACTIVE);
    }

    return dto;
  }
}