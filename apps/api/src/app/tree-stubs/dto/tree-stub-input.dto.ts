import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TreeStubInputDto as TreeStubInputInterface } from '@ghanawaters/shared-models';

export class TreeStubInputDto implements TreeStubInputInterface {
  @ApiProperty({
    description: 'ID of the tree stub group this belongs to',
  })
  @IsNumber()
  group_id: number;

  @ApiProperty({
    description: 'Geometry as GeoJSON string or WKT',
  })
  @IsString()
  geometry: string;
}