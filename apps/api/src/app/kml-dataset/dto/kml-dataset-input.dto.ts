import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { KmlDatasetInput } from '@ghanawaters/shared-models';

export class KmlDatasetInputDto implements KmlDatasetInput {
  @ApiProperty({
    description: 'KML content as string',
    required: false,
  })
  @IsOptional()
  @IsString()
  kml?: string;

  @ApiProperty({
    description: 'Name of the KML dataset',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Whether the KML dataset is enabled',
    default: true,
  })
  @IsBoolean()
  enabled: boolean = true;
}