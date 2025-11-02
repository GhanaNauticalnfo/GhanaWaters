import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeoPoint, LandingSiteResponse } from '@ghanawaters/shared-models';

export class LandingSiteResponseDto implements LandingSiteResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  description: string;

  @ApiProperty({
    description: 'Position as GeoJSON Point',
    example: {
      type: 'Point',
      coordinates: [-0.017, 5.619]
    }
  })
  location: GeoPoint;

  @ApiProperty({ description: 'Whether the landing site is active' })
  active: boolean;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  updated_at: string;

}