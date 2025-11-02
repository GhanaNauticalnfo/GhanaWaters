import { Module } from '@nestjs/common';
import { NwnmController } from './nwnm.controller';
import { NwnmService } from './nwnm.service';

@Module({
  controllers: [NwnmController],
  providers: [NwnmService],
  exports: [NwnmService],
})
export class NwnmModule {}
