import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncMinorVersion } from './sync-minor-version.entity';
import { SyncMajorVersion } from './sync-major-version.entity';
import { Route } from '../routes/route.entity';
import { LandingSite } from '../landing-sites/landing-site.entity';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { SyncGateway } from './sync.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([SyncMinorVersion, SyncMajorVersion, Route, LandingSite])],
  controllers: [SyncController],
  providers: [SyncService, SyncGateway], // Using WebSocket for real-time sync notifications
  exports: [SyncService, SyncGateway],
})
export class SyncModule {}