import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class NwNmMessagePartInputDto {
  @ApiProperty({ description: 'GeoJSON geometry object' })
  @IsOptional()
  geometry?: any;
}

export class NwNmMessageInputDto {
  @ApiProperty({ description: 'External message ID', example: 'NW-123' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Message type: NW or NM', example: 'NW' })
  @IsString()
  @IsNotEmpty()
  main_type: string;

  @ApiPropertyOptional({ description: 'Message title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Message description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Publication date' })
  @IsDateString()
  @IsOptional()
  publish_date?: string;

  @ApiPropertyOptional({ description: 'Whether the message is active', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Geometry parts', type: [NwNmMessagePartInputDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => NwNmMessagePartInputDto)
  parts?: NwNmMessagePartInputDto[];
}
