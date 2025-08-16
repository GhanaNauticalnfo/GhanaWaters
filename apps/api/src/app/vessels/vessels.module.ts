// vessels.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vessel } from './vessel.entity';
import { VesselType } from './type/vessel-type.entity';
import { Device, DeviceAuthService, DeviceController, DeviceGateway } from './device';
import { VesselService } from './vessel.service';
import { VesselController } from './vessel.controller';
import { VesselTypeController } from './type/vessel-type.controller';
import { VesselTypeService } from './type/vessel-type.service';
import { VesselTelemetry } from './tracking/vessel-telemetry.entity';
import { TrackingService } from './tracking/tracking.service';
import { TrackingController } from './tracking/tracking.controller';
import { TrackingGateway } from './tracking/tracking.gateway';
import { TelemetryExportService } from './tracking/telemetry-export.service';
import { SyncModule } from '../sync/sync.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vessel,
      VesselType,
      Device,
      VesselTelemetry,
    ]),
    SyncModule,
  ],
  providers: [
    VesselService,
    DeviceAuthService,
    VesselTypeService,
    TrackingService,
    TrackingGateway,
    DeviceGateway,
    TelemetryExportService,
  ],
  controllers: [
    VesselTypeController,
    VesselController,
    TrackingController,
    DeviceController,
  ],
  exports: [
    VesselService,
    VesselTypeService,
    TrackingService,
    TrackingGateway,
  ],
})
export class VesselsModule {}