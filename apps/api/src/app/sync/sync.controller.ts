import { Controller, Get, Post, Query, Param, NotFoundException, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { Public, Roles } from '../auth/decorators';
import { SyncService } from './sync.service';
import { SyncEntryDto, SyncOverviewResponseDto } from './dto';

@ApiTags('sync')
@Controller('data')
export class SyncController {
  constructor(private syncService: SyncService) {}

  @Get('sync/overview')
  @Public()
  @ApiOperation({
    summary: 'Get sync overview',
    description: 'Returns overview of sync system including current major version and minor version details'
  })
  @ApiResponse({
    status: 200,
    description: 'Sync overview data',
    type: SyncOverviewResponseDto
  })
  @ApiResponse({
    status: 204,
    description: 'No sync data available'
  })
  async getSyncOverview(@Res() res: Response): Promise<void> {
    const result = await this.syncService.getSyncOverview();
    
    if (!result) {
      // Return 204 No Content when no versions exist yet
      res.status(204).send();
      return;
    }
    
    res.json(result);
  }

  @Get('sync')
  @Public()
  @ApiOperation({
    summary: 'Sync data',
    description: 'Returns sync entries for mobile apps and admin interface. Used for incremental data synchronization.'
  })
  @ApiQuery({ name: 'majorVersion', required: false, description: 'Major version to sync from' })
  @ApiQuery({ name: 'fromMinorVersion', required: false, description: 'Minor version to sync from (exclusive)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of minor versions to return (default: 100)' })
  @ApiResponse({
    status: 200,
    description: 'Sync data entries',
    type: SyncEntryDto
  })
  @ApiResponse({
    status: 204,
    description: 'No sync data available'
  })
  async syncData(
    @Res() res: Response,
    @Query('majorVersion') majorVersion?: string,
    @Query('fromMinorVersion') fromMinorVersion?: string,
    @Query('limit') limit?: string
  ): Promise<void> {
    const parsedMajorVersion = majorVersion ? parseInt(majorVersion, 10) : undefined;
    const parsedFromMinorVersion = fromMinorVersion ? parseInt(fromMinorVersion, 10) : undefined;
    const parsedLimit = limit ? parseInt(limit, 10) : 100;

    const result = await this.syncService.getChangesByVersion(
      parsedMajorVersion,
      parsedFromMinorVersion,
      parsedLimit
    );

    if (!result) {
      // Return 204 No Content when no versions exist yet
      res.status(204).send();
      return;
    }

    res.json(result);
  }


  @Post('sync/reset')
  @Roles('admin')
  @ApiOperation({
    summary: 'Reset sync',
    description: 'Creates a new major version and compacts all sync entries. Mobile apps will reset their local data on next sync.'
  })
  @ApiResponse({
    status: 200,
    description: 'Sync reset successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        majorVersion: { type: 'number' }
      }
    }
  })
  async resetSync() {
    return this.syncService.resetSync();
  }
}