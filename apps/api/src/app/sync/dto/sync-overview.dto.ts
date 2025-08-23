import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MinorVersionInfo, SyncOverviewResponse } from '@ghanawaters/shared-models';

export class MinorVersionInfoDto implements MinorVersionInfo {
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

export class SyncOverviewResponseDto implements SyncOverviewResponse {
  @ApiProperty({ description: 'Current sync version' })
  @IsNumber()
  majorVersion: number; // Keep API field name for backward compatibility

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