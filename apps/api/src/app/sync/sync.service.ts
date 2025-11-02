import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, EntityManager } from 'typeorm';
import { SyncMinorVersion } from './sync-minor-version.entity';
import { SyncMajorVersion } from './sync-major-version.entity';
import { Route } from '../routes/route.entity';
import { LandingSite } from '../landing-sites/landing-site.entity';
import { SyncGateway } from './sync.gateway';
import { SyncEntry, SyncEntity, SyncOverviewResponse, MinorVersionInfo } from '@ghanawaters/shared-models';
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

  async getCurrentSyncVersion(): Promise<number> {
    const currentVersion = await this.syncMajorVersionRepository.findOne({
      where: { is_current: true },
    });
    return currentVersion?.major_version || 1;
  }

  async getChangesByVersion(
    syncVersion?: number,
    fromMinorVersion?: number,
    limit: number = 100
  ): Promise<SyncEntry | null> {
    // Get current sync version if not provided
    const currentSyncVersion = syncVersion || await this.getCurrentSyncVersion();
    
    // Check if any versions exist
    const anyVersion = await this.syncMajorVersionRepository.findOne({
      where: { major_version: currentSyncVersion }
    });
    
    if (!anyVersion) {
      return null; // Will result in 204 response
    }
    
    // Find minor versions in range
    const query = this.syncMinorVersionRepository.createQueryBuilder('sync')
      .where('sync.major_version = :syncVersion', { syncVersion: currentSyncVersion })
      .orderBy('sync.minor_version', 'ASC')
      .limit(limit);
    
    if (fromMinorVersion !== undefined) {
      query.andWhere('sync.minor_version > :fromMinorVersion', { fromMinorVersion });
    }
    
    const minorVersions = await query.getMany();
    
    if (minorVersions.length === 0) {
      // No new versions available
      const lastMinorVersion = await this.syncMinorVersionRepository.findOne({
        where: { major_version: currentSyncVersion },
        order: { minor_version: 'DESC' }
      });
      
      return {
        majorVersion: currentSyncVersion,
        fromMinorVersion: fromMinorVersion || 0,
        toMinorVersion: lastMinorVersion?.minor_version || 0,
        lastUpdate: new Date().toISOString(),
        hasMoreEntities: false,
        entities: []
      };
    }
    
    // Check if we have the latest
    const latestMinorVersion = await this.syncMinorVersionRepository.findOne({
      where: { major_version: currentSyncVersion },
      order: { minor_version: 'DESC' }
    });
    
    const toMinorVersion = minorVersions[minorVersions.length - 1].minor_version;
    const hasMoreEntities = toMinorVersion < (latestMinorVersion?.minor_version || 0);
    
    // Flatten all entities from all minor versions
    const entities: SyncEntity[] = [];
    for (const version of minorVersions) {
      const versionEntities = version.data as SyncEntity[];
      entities.push(...versionEntities);
    }
    
    return {
      majorVersion: currentSyncVersion,
      fromMinorVersion: fromMinorVersion || 0,
      toMinorVersion,
      lastUpdate: minorVersions[minorVersions.length - 1].created_at.toISOString(),
      hasMoreEntities,
      entities
    };
  }


  async logChange(
    entityType: string,
    entityId: string,
    action: 'create' | 'update' | 'delete',
    data?: any,
  ) {
    const syncVersion = await this.getCurrentSyncVersion();
    let minorVersion: number;
    
    await this.syncMinorVersionRepository.manager.transaction(async manager => {
      const result = await this.logChangeInTransaction(
        manager,
        entityType,
        entityId,
        action,
        data,
        syncVersion
      );
      minorVersion = result.minor_version;
    });

    // Only send WebSocket notification after successful transaction commit
    // This ensures we don't notify about changes that weren't persisted
    if (minorVersion && this.syncGateway) {
      // Schedule notification asynchronously to not block the response
      setImmediate(() => {
        try {
          this.syncGateway.emitSyncUpdate(syncVersion, minorVersion);
        } catch (err) {
          // Log WebSocket errors but don't affect the sync operation
          console.warn('WebSocket notification failed:', err.message);
        }
      });
    }
  }

  async logChangeInTransaction(
    manager: EntityManager,
    entityType: string,
    entityId: string,
    action: 'create' | 'update' | 'delete',
    data?: any,
    syncVersion?: number,
  ): Promise<SyncMinorVersion> {
    // Get major version if not provided
    if (syncVersion === undefined) {
      const currentVersion = await manager.findOne(SyncMajorVersion, {
        where: { is_current: true },
      });
      syncVersion = currentVersion?.major_version || 1;
    }

    // Calculate next minor version for this major version
    const lastEntry = await manager.findOne(SyncMinorVersion, {
      where: { major_version: syncVersion },
      order: { minor_version: 'DESC' },
    });
    const minorVersion = lastEntry ? lastEntry.minor_version + 1 : 1;

    // Create entity array (single item for now)
    const entityData: SyncEntity[] = [{
      entityType,
      entityId,
      entityAction: action,
      entityData: action === 'delete' ? null : data,
    }];

    const jsonData = JSON.stringify(entityData);
    const size = jsonData.length;

    // Insert new minor version entry
    const syncMinorVersion = await manager.save(SyncMinorVersion, {
      major_version: syncVersion,
      minor_version: minorVersion,
      data: entityData,
      size,
    });

    // WebSocket notification is now handled after transaction commit in logChange()
    // This ensures notifications are only sent for successfully persisted changes

    return syncMinorVersion;
  }

  async getSyncOverview(): Promise<SyncOverviewResponse | null> {
    // Get current major version
    const currentSyncVersion = await this.getCurrentSyncVersion();
    
    // Check if any versions exist
    const anyVersion = await this.syncMajorVersionRepository.findOne({
      where: { major_version: currentSyncVersion }
    });
    
    if (!anyVersion) {
      return null; // No sync data exists yet
    }

    // Get all minor versions for current major version
    const minorVersions = await this.syncMinorVersionRepository.find({
      where: { major_version: currentSyncVersion },
      order: { minor_version: 'ASC' },
      take: 100 // Limit to most recent 100 versions
    });

    if (minorVersions.length === 0) {
      return null;
    }

    // Get the latest version for lastUpdate
    const latestVersion = minorVersions[minorVersions.length - 1];
    
    // Map minor versions to response format
    const minorVersionsInfo: MinorVersionInfo[] = minorVersions.map(version => ({
      minorVersion: version.minor_version,
      size: version.size,
      timestamp: version.created_at.toISOString()
    }));

    return {
      majorVersion: currentSyncVersion,
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
      const currentSyncVersion = currentVersion?.major_version || 0;
      const newMajorVersion = currentSyncVersion + 1;

      // Mark current version as not current
      if (currentVersion) {
        await manager.update(
          SyncMajorVersion,
          { major_version: currentVersion.major_version },
          { is_current: false },
        );
      }

      // Create new major version
      const newMajorVersionEntity = new SyncMajorVersion();
      newMajorVersionEntity.major_version = newMajorVersion;
      newMajorVersionEntity.is_current = true;
      await manager.save(newMajorVersionEntity);

      // Get all current routes from the database
      const routes = await manager.find(Route, {
        where: { enabled: true }
      });

      // Get all current landing sites from the database
      const landingSites = await manager.find(LandingSite);

      // Create sync entries for all routes
      let minorVersion = 1;
      for (const route of routes) {
        const entityData: SyncEntity[] = [{
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
        const entityData: SyncEntity[] = [{
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
      syncVersion: await this.getCurrentSyncVersion(),
    };
  }
}