import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, EntityManager } from 'typeorm';
import { SyncMinorVersion } from './sync-minor-version.entity';
import { SyncMajorVersion } from './sync-major-version.entity';
import { Route } from '../routes/route.entity';
import { LandingSite } from '../landing-sites/landing-site.entity';
import { SyncGateway } from './sync.gateway';
import { SyncEntryDto, SyncEntityDto, SyncOverviewResponseDto, MinorVersionInfoDto } from './dto';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(SyncMinorVersion)
    private syncMinorVersionRepository: Repository<SyncMinorVersion>,
    @InjectRepository(SyncMajorVersion)
    private syncMajorVersionRepository: Repository<SyncMajorVersion>,
    @InjectRepository(Route)
    private routeRepository: Repository<Route>,
    @InjectRepository(LandingSite)
    private landingSiteRepository: Repository<LandingSite>,
    @Optional() private syncGateway: SyncGateway,
  ) {}

  async getCurrentMajorVersion(): Promise<number> {
    const currentVersion = await this.syncMajorVersionRepository.findOne({
      where: { is_current: true },
    });
    return currentVersion?.major_version || 1;
  }

  async getChangesByVersion(
    majorVersion?: number,
    fromMinorVersion?: number,
    limit: number = 100
  ): Promise<SyncEntryDto | null> {
    // Get current major version if not provided
    const currentMajorVersion = majorVersion || await this.getCurrentMajorVersion();
    
    // Check if any versions exist
    const anyVersion = await this.syncMajorVersionRepository.findOne({
      where: { major_version: currentMajorVersion }
    });
    
    if (!anyVersion) {
      return null; // Will result in 204 response
    }
    
    // Find minor versions in range
    const query = this.syncMinorVersionRepository.createQueryBuilder('sync')
      .where('sync.major_version = :majorVersion', { majorVersion: currentMajorVersion })
      .orderBy('sync.minor_version', 'ASC')
      .limit(limit);
    
    if (fromMinorVersion !== undefined) {
      query.andWhere('sync.minor_version > :fromMinorVersion', { fromMinorVersion });
    }
    
    const minorVersions = await query.getMany();
    
    if (minorVersions.length === 0) {
      // No new versions available
      const lastMinorVersion = await this.syncMinorVersionRepository.findOne({
        where: { major_version: currentMajorVersion },
        order: { minor_version: 'DESC' }
      });
      
      return {
        majorVersion: currentMajorVersion,
        fromMinorVersion: fromMinorVersion || 0,
        toMinorVersion: lastMinorVersion?.minor_version || 0,
        lastUpdate: new Date().toISOString(),
        isLatest: true,
        entities: []
      };
    }
    
    // Check if we have the latest
    const latestMinorVersion = await this.syncMinorVersionRepository.findOne({
      where: { major_version: currentMajorVersion },
      order: { minor_version: 'DESC' }
    });
    
    const toMinorVersion = minorVersions[minorVersions.length - 1].minor_version;
    const isLatest = toMinorVersion >= (latestMinorVersion?.minor_version || 0);
    
    // Flatten all entities from all minor versions
    const entities: SyncEntityDto[] = [];
    for (const version of minorVersions) {
      const versionEntities = version.data as SyncEntityDto[];
      entities.push(...versionEntities);
    }
    
    return {
      majorVersion: currentMajorVersion,
      fromMinorVersion: fromMinorVersion || 0,
      toMinorVersion,
      lastUpdate: minorVersions[minorVersions.length - 1].created_at.toISOString(),
      isLatest,
      entities
    };
  }


  async logChange(
    entityType: string,
    entityId: string,
    action: 'create' | 'update' | 'delete',
    data?: any,
  ) {
    const majorVersion = await this.getCurrentMajorVersion();
    let minorVersion: number;
    
    await this.syncMinorVersionRepository.manager.transaction(async manager => {
      const result = await this.logChangeInTransaction(
        manager,
        entityType,
        entityId,
        action,
        data,
        majorVersion
      );
      minorVersion = result.minor_version;
    });

    // Fire and forget WebSocket notification - don't await
    // This happens outside the transaction so it doesn't affect sync reliability
    if (minorVersion && this.syncGateway) {
      try {
        this.syncGateway.emitSyncUpdate(majorVersion, minorVersion);
      } catch (err) {
        // Errors are already logged in SyncGateway, just catch to prevent any issues
      }
    }
  }

  async logChangeInTransaction(
    manager: EntityManager,
    entityType: string,
    entityId: string,
    action: 'create' | 'update' | 'delete',
    data?: any,
    majorVersion?: number,
  ): Promise<SyncMinorVersion> {
    // Get major version if not provided
    if (majorVersion === undefined) {
      const currentVersion = await manager.findOne(SyncMajorVersion, {
        where: { is_current: true },
      });
      majorVersion = currentVersion?.major_version || 1;
    }

    // Calculate next minor version for this major version
    const lastEntry = await manager.findOne(SyncMinorVersion, {
      where: { major_version: majorVersion },
      order: { minor_version: 'DESC' },
    });
    const minorVersion = lastEntry ? lastEntry.minor_version + 1 : 1;

    // Create entity array (single item for now)
    const entityData: SyncEntityDto[] = [{
      entityType,
      entityId,
      entityAction: action,
      entityData: action === 'delete' ? null : data,
    }];

    const jsonData = JSON.stringify(entityData);
    const size = jsonData.length;

    // Insert new minor version entry
    const syncMinorVersion = await manager.save(SyncMinorVersion, {
      major_version: majorVersion,
      minor_version: minorVersion,
      data: entityData,
      size,
    });

    // Fire and forget WebSocket notification - don't await
    // This happens within the transaction but errors don't affect it
    if (this.syncGateway) {
      try {
        this.syncGateway.emitSyncUpdate(majorVersion, minorVersion);
      } catch (err) {
        // Errors are already logged in SyncGateway, just catch to prevent any issues
      }
    }

    return syncMinorVersion;
  }

  async getSyncOverview(): Promise<SyncOverviewResponseDto | null> {
    // Get current major version
    const currentMajorVersion = await this.getCurrentMajorVersion();
    
    // Check if any versions exist
    const anyVersion = await this.syncMajorVersionRepository.findOne({
      where: { major_version: currentMajorVersion }
    });
    
    if (!anyVersion) {
      return null; // No sync data exists yet
    }

    // Get all minor versions for current major version
    const minorVersions = await this.syncMinorVersionRepository.find({
      where: { major_version: currentMajorVersion },
      order: { minor_version: 'ASC' },
      take: 100 // Limit to most recent 100 versions
    });

    if (minorVersions.length === 0) {
      return null;
    }

    // Get the latest version for lastUpdate
    const latestVersion = minorVersions[minorVersions.length - 1];
    
    // Map minor versions to response format
    const minorVersionsInfo: MinorVersionInfoDto[] = minorVersions.map(version => ({
      minorVersion: version.minor_version,
      size: version.size,
      timestamp: version.created_at.toISOString()
    }));

    return {
      majorVersion: currentMajorVersion,
      lastUpdate: latestVersion.created_at.toISOString(),
      minorVersions: minorVersionsInfo
    };
  }

  async resetSync() {
    await this.syncMajorVersionRepository.manager.transaction(async manager => {
      // Get current major version
      const currentVersion = await manager.findOne(SyncMajorVersion, {
        where: { is_current: true },
      });
      const currentMajorVersion = currentVersion?.major_version || 0;
      const newMajorVersion = currentMajorVersion + 1;

      // Mark current version as not current
      if (currentVersion) {
        await manager.update(
          SyncMajorVersion,
          { id: currentVersion.id },
          { is_current: false },
        );
      }

      // Create new major version
      await manager.save(SyncMajorVersion, {
        major_version: newMajorVersion,
        is_current: true,
      });

      // Get all current routes from the database
      const routes = await manager.find(Route, {
        where: { enabled: true }
      });

      // Get all current landing sites from the database
      const landingSites = await manager.find(LandingSite);

      // Create sync entries for all routes
      let minorVersion = 1;
      for (const route of routes) {
        const entityData: SyncEntityDto[] = [{
          entityType: 'route',
          entityId: route.id.toString(),
          entityAction: 'create',
          entityData: route.toResponseDto(),
        }];
        
        const jsonData = JSON.stringify(entityData);
        
        await manager.save(SyncMinorVersion, {
          major_version: newMajorVersion,
          minor_version: minorVersion,
          data: entityData,
          size: jsonData.length,
        });
        minorVersion++;
      }

      // Create sync entries for all landing sites
      for (const landingSite of landingSites) {
        const entityData: SyncEntityDto[] = [{
          entityType: 'landing_site',
          entityId: landingSite.id.toString(),
          entityAction: 'create',
          entityData: landingSite.toResponseDto(),
        }];
        
        const jsonData = JSON.stringify(entityData);
        
        await manager.save(SyncMinorVersion, {
          major_version: newMajorVersion,
          minor_version: minorVersion,
          data: entityData,
          size: jsonData.length,
        });
        minorVersion++;
      }
    });

    return {
      success: true,
      majorVersion: await this.getCurrentMajorVersion(),
    };
  }
}