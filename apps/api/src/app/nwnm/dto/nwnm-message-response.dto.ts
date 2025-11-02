import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NwNmMessagePartResponseDto {
  @ApiPropertyOptional({ description: 'Part type' })
  type?: string;

  @ApiPropertyOptional({ description: 'GeoJSON geometry object' })
  geometry?: any;

  @ApiPropertyOptional({ description: 'Event dates' })
  eventDates?: any[];
}

export class NwNmMessageResponseDto {
  @ApiProperty({ description: 'Message ID', example: 123 })
  id: number | string;

  @ApiPropertyOptional({ description: 'Short message ID', example: 'NW-123' })
  shortId?: string;

  @ApiProperty({ description: 'Main message type: NW or NM', example: 'NW' })
  mainType: 'NW' | 'NM';

  @ApiPropertyOptional({ description: 'Specific message type', example: 'LOCAL_WARNING' })
  type?: string;

  @ApiPropertyOptional({
    description: 'Message status',
    example: 'PUBLISHED',
    enum: ['PUBLISHED', 'DRAFT', 'VERIFIED', 'CANCELLED', 'EXPIRED', 'DELETED']
  })
  status?: string;

  @ApiPropertyOptional({ description: 'Message title' })
  title?: string;

  @ApiPropertyOptional({ description: 'Message description/details' })
  description?: string;

  @ApiPropertyOptional({ description: 'Publication start date (ISO 8601)' })
  publishDateFrom?: string;

  @ApiPropertyOptional({ description: 'Publication end date (ISO 8601)' })
  publishDateTo?: string;

  @ApiPropertyOptional({ description: 'Follow-up date (ISO 8601)' })
  followUpDate?: string;

  @ApiPropertyOptional({ description: 'Affected geographic areas', type: 'array' })
  areas?: any[];

  @ApiPropertyOptional({ description: 'Multi-language descriptions', type: 'array' })
  descs?: any[];

  @ApiProperty({ description: 'Geometry parts', type: [NwNmMessagePartResponseDto] })
  parts: NwNmMessagePartResponseDto[];
}
