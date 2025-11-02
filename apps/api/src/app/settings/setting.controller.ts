import { Controller, Get, Put, Body, Param, Inject, forwardRef, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SettingService } from './setting.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { SettingResponseDto } from './dto/setting-response.dto';
import { DatabaseService } from '../database/database.service';
import { UpdateRetentionDto } from './dto/update-database-settings.dto';
import { SETTING_KEYS } from './constants/settings.constants';

@ApiTags('settings')
@Controller('settings')
export class SettingController {
  private readonly logger = new Logger(SettingController.name);

  constructor(
    private readonly settingService: SettingService,
    @Inject(forwardRef(() => DatabaseService))
    private readonly databaseService: DatabaseService,
  ) {}

  @Get()
  findAll(): Promise<SettingResponseDto[]> {
    return this.settingService.findAll();
  }

  @Get('database')
  @ApiOperation({ summary: 'Get database settings and statistics' })
  @ApiResponse({ status: 200, description: 'Database settings retrieved successfully' })
  async getDatabaseSettings() {
    try {
      this.logger.log('Getting database settings and statistics');
      
      const retentionDays = await this.settingService.getSettingValue(
        SETTING_KEYS.DATABASE_TELEMETRY_RETENTION_DAYS
      );
      this.logger.log(`Retrieved retention days: ${retentionDays}`);
      
      const statistics = await this.databaseService.getDatabaseStatistics();
      this.logger.log('Retrieved database statistics successfully');
      
      return {
        retentionDays: parseInt(retentionDays, 10),
        ...statistics
      };
    } catch (error) {
      this.logger.error('Error getting database settings', error);
      throw error;
    }
  }

  @Put('database')
  @ApiOperation({ summary: 'Update database settings' })
  @ApiResponse({ status: 200, description: 'Database settings updated successfully' })
  async updateDatabaseSettings(@Body() dto: UpdateRetentionDto) {
    await this.settingService.updateSetting(
      SETTING_KEYS.DATABASE_TELEMETRY_RETENTION_DAYS,
      dto.retentionDays.toString()
    );
    
    return { success: true };
  }

  @Get(':key')
  findOne(@Param('key') key: string): Promise<SettingResponseDto> {
    return this.settingService.findOne(key);
  }

  @Put(':key')
  update(
    @Param('key') key: string,
    @Body() updateSettingDto: UpdateSettingDto,
  ): Promise<SettingResponseDto> {
    return this.settingService.update(key, updateSettingDto);
  }
}