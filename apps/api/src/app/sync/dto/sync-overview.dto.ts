import { ApiProperty } from '@nestjs/swagger';

export class MinorVersionInfoDto {
  @ApiProperty({ description: 'Minor version number' })
  minorVersion: number;

  @ApiProperty({ description: 'Size of the sync data in bytes' })
  size: number;

  @ApiProperty({ description: 'Timestamp when the version was created' })
  timestamp: string;
}

export class SyncOverviewResponseDto {
  @ApiProperty({ description: 'Current major version' })
  majorVersion: number;

  @ApiProperty({ description: 'Last update timestamp' })
  lastUpdate: string;

  @ApiProperty({ 
    description: 'Array of minor versions with their details',
    type: [MinorVersionInfoDto]
  })
  minorVersions: MinorVersionInfoDto[];
}