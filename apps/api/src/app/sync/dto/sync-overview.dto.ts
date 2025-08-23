import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MinorVersionInfoDto {
  @ApiProperty({ description: 'Minor version number' })
  @IsNumber()
  minorVersion: number;

  @ApiProperty({ description: 'Size of the sync data in bytes' })
  @IsNumber()
  size: number;

  @ApiProperty({ description: 'Timestamp when the version was created' })
  @IsString()
  timestamp: string;
}

export class SyncOverviewResponseDto {
  @ApiProperty({ description: 'Current major version' })
  @IsNumber()
  majorVersion: number;

  @ApiProperty({ description: 'Last update timestamp' })
  @IsString()
  lastUpdate: string;

  @ApiProperty({ 
    description: 'Array of minor versions with their details',
    type: [MinorVersionInfoDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MinorVersionInfoDto)
  minorVersions: MinorVersionInfoDto[];
}