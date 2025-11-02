import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NwNmMessagePartResponseDto {
  @ApiPropertyOptional({ description: 'GeoJSON geometry object' })
  geometry?: any;
}

export class NwNmMessageResponseDto {
  @ApiProperty({ description: 'Message ID', example: 'NW-123' })
  id: string;

  @ApiProperty({ description: 'Message type: NW or NM', example: 'NW' })
  mainType: string;

  @ApiPropertyOptional({ description: 'Message title' })
  title?: string;

  @ApiPropertyOptional({ description: 'Message description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Publication date' })
  publishDate?: string;

  @ApiProperty({ description: 'Whether the message is active' })
  active: boolean;

  @ApiProperty({ description: 'Geometry parts', type: [NwNmMessagePartResponseDto] })
  parts: NwNmMessagePartResponseDto[];
}
