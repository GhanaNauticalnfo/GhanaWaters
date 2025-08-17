import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, EntityManager } from 'typeorm';
import { SyncLog } from './sync-log.entity';
import { SyncVersion } from './sync-version.entity';
import { SyncGateway } from './sync.gateway';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(SyncLog)
    private syncLogRepository: Repository<SyncLog>,
    @InjectRepository(SyncVersion)
    private syncVersionRepository: Repository<SyncVersion>,
    @Optional() private syncGateway: SyncGateway,
  ) {}

  async getCurrentMajorVersion(): Promise<number> {
    const currentVersion = await this.syncVersionRepository.findOne({
      where: { is_current: true },
    });
    return currentVersion?.major_version || 1;
  }

  async getChangesSince(since: Date) {
    const majorVersion = await this.getCurrentMajorVersion();
    
    const changes = await this.syncLogRepository.find({
      where: {
        created_at: MoreThan(since),
        major_version: majorVersion,
      },
      order: {
        created_at: 'ASC',
        major_version: 'ASC',
        minor_version: 'ASC',
      },
    });

    return {
      version: new Date().toISOString(),
      majorVersion,
      data: changes.map(change => ({
        major_version: change.major_version,
        minor_version: change.minor_version,
        entity_type: change.entity_type,
        entity_id: change.entity_id,
        action: change.action,
        data: change.data,
        created_at: change.created_at.toISOString(),
      })),
    };
  }

  async getSyncEntryByVersion(majorVersion: number, minorVersion: number) {
    const entry = await this.syncLogRepository.findOne({
      where: { 
        major_version: majorVersion,
        minor_version: minorVersion 
      },
    });
    
    if (!entry) {
      return null;
    }
    
    return {
      majorVersion: entry.major_version,
      minorVersion: entry.minor_version,
      entityType: entry.entity_type,
      entityId: entry.entity_id,
      action: entry.action,
      data: entry.data,
      createdAt: entry.created_at.toISOString(),
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
    
    await this.syncLogRepository.manager.transaction(async manager => {
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
  ): Promise<SyncLog> {
    // Get major version if not provided
    if (majorVersion === undefined) {
      const currentVersion = await manager.findOne(SyncVersion, {
        where: { is_current: true },
      });
      majorVersion = currentVersion?.major_version || 1;
    }

    // Calculate next minor version for this major version
    const lastEntry = await manager.findOne(SyncLog, {
      where: { major_version: majorVersion },
      order: { minor_version: 'DESC' },
    });
    const minorVersion = lastEntry ? lastEntry.minor_version + 1 : 1;

    // Mark previous entries for this entity as not latest
    await manager.update(
      SyncLog,
      { entity_id: entityId, entity_type: entityType, is_latest: true },
      { is_latest: false },
    );

    // Insert new entry with composite primary key
    const syncLog = await manager.save(SyncLog, {
      major_version: majorVersion,
      minor_version: minorVersion,
      entity_type: entityType,
      entity_id: entityId,
      action: action,
      data: action === 'delete' ? null : data,
      is_latest: true,
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

    return syncLog;
  }

  async resetSync() {
    await this.syncLogRepository.manager.transaction(async manager => {
      // Get current major version
      const currentVersion = await manager.findOne(SyncVersion, {
        where: { is_current: true },
      });
      const currentMajorVersion = currentVersion?.major_version || 0;
      const newMajorVersion = currentMajorVersion + 1;

      // Mark current version as not current
      if (currentVersion) {
        await manager.update(
          SyncVersion,
          { id: currentVersion.id },
          { is_current: false },
        );
      }

      // Create new major version
      await manager.save(SyncVersion, {
        major_version: newMajorVersion,
        is_current: true,
      });

      // Get all current entities (is_latest = true)
      const currentEntities = await manager.find(SyncLog, {
        where: { is_latest: true },
      });

      // Mark all existing entries as not latest
      await manager.update(
        SyncLog,
        { is_latest: true },
        { is_latest: false },
      );

      // Create new entries for all current entities with new major version
      // Start minor version at 1 for the new major version
      let minorVersion = 1;
      for (const entity of currentEntities) {
        // Only create entries for non-deleted entities
        if (entity.action !== 'delete' && entity.data) {
          await manager.save(SyncLog, {
            major_version: newMajorVersion,
            minor_version: minorVersion,
            entity_type: entity.entity_type,
            entity_id: entity.entity_id,
            action: 'create',
            data: entity.data,
            is_latest: true,
          });
          minorVersion++;
        }
      }
    });

    return {
      success: true,
      majorVersion: await this.getCurrentMajorVersion(),
    };
  }
}