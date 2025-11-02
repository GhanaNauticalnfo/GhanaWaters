import { ApiProperty } from '@nestjs/swagger';
import { KmlDatasetResponse } from '@ghanawaters/shared-models';

export class KmlDatasetResponseDto implements KmlDatasetResponse {
  @ApiProperty({
    description: 'Unique identifier for the KML dataset',
  })
  id: number;

  @ApiProperty({
    description: 'Creation timestamp',
  })
  created: string;

  @ApiProperty({
    description: 'Last updated timestamp',
  })
  last_updated: string;

  @ApiProperty({
    description: 'KML content as string',
    required: false,
  })
  kml?: string;

  @ApiProperty({
    description: 'Name of the KML dataset',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'Whether the KML dataset is enabled',
  })
  enabled: boolean;
}