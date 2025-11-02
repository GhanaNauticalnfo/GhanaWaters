import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { NwnmService } from './nwnm.service';
import { Public } from '../auth/decorators';

@ApiTags('nwnm')
@Controller('nwnm')
export class NwnmController {
  constructor(private readonly nwnmService: NwnmService) {}

  @Get('messages')
  @Public()
  @ApiQuery({ name: 'lang', required: false, description: 'Language code', example: 'en' })
  @ApiResponse({ description: 'List of NW/NM navigation warnings from Niord' })
  async getMessages(@Query('lang') lang?: string) {
    return this.nwnmService.getMessages(lang || 'en');
  }
}
