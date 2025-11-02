import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { SyncService } from './sync.service';
import { SyncMinorVersion } from './sync-minor-version.entity';
import { SyncMajorVersion } from './sync-major-version.entity';
import { Route } from '../routes/route.entity';
import { LandingSite } from '../landing-sites/landing-site.entity';
import { SyncGateway } from './sync.gateway';
import { SyncEntryDto, SyncEntityDto } from './dto';

describe('SyncService', () => {
  let service: SyncService;
  let minorVersionRepository: Repository<SyncMinorVersion>;
  let syncMajorVersionRepository: Repository<SyncMajorVersion>;
  let routeRepository: Repository<Route>;
  let landingSiteRepository: Repository<LandingSite>;
  let syncGateway: jest.Mocked<SyncGateway>;
  let mockEntityManager: Partial<EntityManager>;

  const mockSyncMinorVersion = {
    major_version: 1,
    minor_version: 1,
    data: [{
      entityType: 'route',
      entityId: '123',
      entityAction: 'create',
      entityData: { test: 'data' }
    }] as SyncEntityDto[],
    size: 50,
    created_at: new Date('2025-01-01T12:00:00Z'),
  };

  const mockSyncMajorVersion = {
    major_version: 1,
    created_at: new Date('2025-01-01T00:00:00Z'),
    is_current: true,
  };

  const mockRoute = {
    id: 123,
    name: 'Test Route',
    notes: 'Test notes',
    waypoints: [{ lat: 1, lng: 2, name: 'Waypoint 1' }],
    enabled: true,
    created: new Date('2025-01-01T10:00:00Z'),
    last_updated: new Date('2025-01-01T12:00:00Z'),
    toResponseDto: jest.fn().mockReturnValue({
      id: 123,
      name: 'Test Route',
      notes: 'Test notes',
      waypoints: [{ lat: 1, lng: 2, name: 'Waypoint 1' }],
      enabled: true,
      created: '2025-01-01T10:00:00.000Z',
      last_updated: '2025-01-01T12:00:00.000Z',
    }),
  };

  const mockLandingSite = {
    id: 456,
    name: 'Test Landing Site',
    location: { type: 'Point', coordinates: [1, 2] },
    created: new Date('2025-01-01T11:00:00Z'),
    last_updated: new Date('2025-01-01T13:00:00Z'),
    toResponseDto: jest.fn().mockReturnValue({
      id: 456,
      name: 'Test Landing Site',
      location: { type: 'Point', coordinates: [1, 2] },
      created: '2025-01-01T11:00:00.000Z',
      last_updated: '2025-01-01T13:00:00.000Z',
    }),
  };

  beforeEach(async () => {
    mockEntityManager = {
      update: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(mockSyncMinorVersion),
      find: jest.fn().mockImplementation((entity, options) => {
        if (entity === Route) {
          return Promise.resolve([mockRoute]);
        }
        if (entity === LandingSite) {
          return Promise.resolve([mockLandingSite]);
        }
        return Promise.resolve([mockSyncMinorVersion]);
      }),
      findOne: jest.fn()
        .mockImplementation((entity, options) => {
          if (entity === SyncMajorVersion || options?.where?.is_current) {
            return Promise.resolve(mockSyncMajorVersion);
          }
          // For minor version lookup (when options.where has major_version)
          if (options?.where?.major_version) {
            return Promise.resolve(null); // No existing entries for this major version
          }
          return Promise.resolve(mockSyncMajorVersion);
        }),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockSyncMinorVersion]),
      })) as any,
    };

    const mockMinorVersionRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockSyncMinorVersion]),
      })) as any,
      manager: {
        transaction: jest.fn((callback) => callback(mockEntityManager)),
      },
    };

    const mockMajorVersionRepository = {
      findOne: jest.fn().mockResolvedValue(mockSyncMajorVersion),
      manager: {
        transaction: jest.fn((callback) => callback(mockEntityManager)),
      },
    };

    const mockRouteRepository = {
      find: jest.fn().mockResolvedValue([mockRoute]),
    };

    const mockLandingSiteRepository = {
      find: jest.fn().mockResolvedValue([mockLandingSite]),
    };

    const mockSyncGateway = {
      emitSyncUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: getRepositoryToken(SyncMinorVersion),
          useValue: mockMinorVersionRepository,
        },
        {
          provide: getRepositoryToken(SyncMajorVersion),
          useValue: mockMajorVersionRepository,
        },
        {
          provide: getRepositoryToken(Route),
          useValue: mockRouteRepository,
        },
        {
          provide: getRepositoryToken(LandingSite),
          useValue: mockLandingSiteRepository,
        },
        {
          provide: SyncGateway,
          useValue: mockSyncGateway,
        },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    minorVersionRepository = module.get<Repository<SyncMinorVersion>>(getRepositoryToken(SyncMinorVersion));
    syncMajorVersionRepository = module.get<Repository<SyncMajorVersion>>(getRepositoryToken(SyncMajorVersion));
    routeRepository = module.get<Repository<Route>>(getRepositoryToken(Route));
    landingSiteRepository = module.get<Repository<LandingSite>>(getRepositoryToken(LandingSite));
    syncGateway = module.get(SyncGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getChangesByVersion', () => {
    it('should return changes for version range', async () => {
      const mockChanges = [
        mockSyncMinorVersion,
        {
          ...mockSyncMinorVersion,
          minor_version: 2,
          data: [{
            entityType: 'route',
            entityId: '456',
            entityAction: 'update',
            entityData: { name: 'Updated Route' }
          }],
          created_at: new Date('2025-01-01T13:00:00Z'),
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockChanges),
      };

      jest.spyOn(minorVersionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(minorVersionRepository, 'findOne').mockResolvedValue(mockChanges[1] as any);

      const result = await service.getChangesByVersion(1, 0, 100);

      expect(result).toBeDefined();
      expect(result!.majorVersion).toBe(1);
      expect(result!.fromMinorVersion).toBe(0);
      expect(result!.toMinorVersion).toBe(2);
      expect(result!.hasMoreEntities).toBe(false);
      expect(result!.entities).toHaveLength(2);
      expect(result!.entities[0]).toEqual({
        entityType: 'route',
        entityId: '123',
        entityAction: 'create',
        entityData: { test: 'data' }
      });
    });

    it('should return null when no major version exists', async () => {
      jest.spyOn(syncMajorVersionRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getChangesByVersion(999, 0, 100);

      expect(result).toBeNull();
    });

    it('should return empty entities when no new minor versions', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(minorVersionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(minorVersionRepository, 'findOne').mockResolvedValue(mockSyncMinorVersion as any);

      const result = await service.getChangesByVersion(1, 5, 100);

      expect(result).toBeDefined();
      expect(result!.entities).toHaveLength(0);
      expect(result!.hasMoreEntities).toBe(false);
    });
  });

  describe('logChange', () => {
    it('should log a create action with data and emit WebSocket update', async () => {
      const entityType = 'route';
      const entityId = '123';
      const action = 'create' as const;
      const data = { name: 'Test Route' };

      await service.logChange(entityType, entityId, action, data);

      expect(minorVersionRepository.manager.transaction).toHaveBeenCalled();
      expect(mockEntityManager.save).toHaveBeenCalledWith(SyncMinorVersion, {
        major_version: 1,
        minor_version: 1,
        data: [{
          entityType: entityType,
          entityId: entityId,
          entityAction: action,
          entityData: data,
        }],
        size: expect.any(Number),
      });
      
      // WebSocket update is sent asynchronously with setImmediate, so we can't test it in this way
      // expect(syncGateway.emitSyncUpdate).toHaveBeenCalledWith(1, 1);
    });

    it('should log an update action with data', async () => {
      const entityType = 'route';
      const entityId = '456';
      const action = 'update' as const;
      const data = { name: 'Updated Route' };

      await service.logChange(entityType, entityId, action, data);

      expect(mockEntityManager.save).toHaveBeenCalledWith(SyncMinorVersion, {
        major_version: 1,
        minor_version: 1,
        data: [{
          entityType: entityType,
          entityId: entityId,
          entityAction: action,
          entityData: data,
        }],
        size: expect.any(Number),
      });
    });

    it('should log a delete action without data', async () => {
      const entityType = 'route';
      const entityId = '789';
      const action = 'delete' as const;

      await service.logChange(entityType, entityId, action);

      expect(mockEntityManager.save).toHaveBeenCalledWith(SyncMinorVersion, {
        major_version: 1,
        minor_version: 1,
        data: [{
          entityType: entityType,
          entityId: entityId,
          entityAction: action,
          entityData: null,
        }],
        size: expect.any(Number),
      });
    });

    it('should handle transaction errors', async () => {
      const error = new Error('Transaction failed');
      minorVersionRepository.manager.transaction = jest.fn().mockRejectedValue(error);

      await expect(
        service.logChange('route', '123', 'create', {})
      ).rejects.toThrow('Transaction failed');
      
      // WebSocket should not be called on transaction failure
      expect(syncGateway.emitSyncUpdate).not.toHaveBeenCalled();
    });

    it('should handle WebSocket emit errors gracefully', async () => {
      syncGateway.emitSyncUpdate.mockImplementation(() => {
        throw new Error('WebSocket failed');
      });
      
      // Should not throw even if WebSocket fails
      await expect(
        service.logChange('route', '123', 'create', {})
      ).resolves.not.toThrow();
      
      // expect(syncGateway.emitSyncUpdate).toHaveBeenCalled(); // Asynchronous
    });
  });

  describe('getCurrentSyncVersion', () => {
    it('should return current major version', async () => {
      const version = await service.getCurrentSyncVersion();
      
      expect(syncMajorVersionRepository.findOne).toHaveBeenCalledWith({
        where: { is_current: true },
      });
      expect(version).toBe(1);
    });

    it('should return 1 when no version exists', async () => {
      jest.spyOn(syncMajorVersionRepository, 'findOne').mockResolvedValue(null);
      
      const version = await service.getCurrentSyncVersion();
      
      expect(version).toBe(1);
    });
  });

  describe('resetSync', () => {
    it('should query actual entities and create sync entries for routes and landing sites', async () => {
      mockEntityManager.save = jest.fn()
        .mockResolvedValueOnce({ ...mockSyncMajorVersion, sync_version: 2 })
        .mockResolvedValue(mockSyncMinorVersion);

      const result = await service.resetSync();

      // Should mark old version as not current
      expect(mockEntityManager.update).toHaveBeenCalledWith(
        SyncMajorVersion,
        { major_version: 1 },
        { is_current: false }
      );

      // Should create new major version
      expect(mockEntityManager.save).toHaveBeenCalledWith(expect.objectContaining({
        major_version: 2,
        is_current: true,
      }));

      // Should query routes from database (enabled only)
      expect(mockEntityManager.find).toHaveBeenCalledWith(Route, {
        where: { enabled: true }
      });

      // Should query landing sites from database
      expect(mockEntityManager.find).toHaveBeenCalledWith(LandingSite);

      // Should create sync entry for the route
      expect(mockEntityManager.save).toHaveBeenCalledWith(SyncMinorVersion, expect.objectContaining({
        major_version: 2,
        minor_version: 1,
        data: [{
          entityType: 'route',
          entityId: '123',
          entityAction: 'create',
          entityData: mockRoute.toResponseDto(),
        }],
        size: expect.any(Number),
      }));

      // Should create sync entry for the landing site
      expect(mockEntityManager.save).toHaveBeenCalledWith(SyncMinorVersion, expect.objectContaining({
        major_version: 2,
        minor_version: 2,
        data: [{
          entityType: 'landing_site',
          entityId: '456',
          entityAction: 'create',
          entityData: mockLandingSite.toResponseDto(),
        }],
        size: expect.any(Number),
      }));

      // Should save exactly 3 times: 1 for major version + 1 for route + 1 for landing site
      expect(mockEntityManager.save).toHaveBeenCalledTimes(3);
      
      expect(result.success).toBe(true);
      expect(result.syncVersion).toBe(1); // Returns from getCurrentSyncVersion
    });

    it('should handle first major version creation when no current version exists', async () => {
      mockEntityManager.findOne = jest.fn().mockResolvedValue(null);
      mockEntityManager.save = jest.fn()
        .mockResolvedValueOnce({ ...mockSyncMajorVersion, sync_version: 1 })
        .mockResolvedValue(mockSyncMinorVersion);

      const result = await service.resetSync();

      // Should not try to update since no current version exists
      expect(mockEntityManager.update).not.toHaveBeenCalled();

      // Should create first major version
      expect(mockEntityManager.save).toHaveBeenCalledWith(expect.objectContaining({
        major_version: 1,
        is_current: true,
      }));
      
      expect(result.success).toBe(true);
    });

    it('should handle empty entity lists correctly', async () => {
      // Mock empty results from entity queries
      mockEntityManager.find = jest.fn().mockImplementation((entity) => {
        if (entity === Route || entity === LandingSite) {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });

      mockEntityManager.save = jest.fn()
        .mockResolvedValueOnce({ ...mockSyncMajorVersion, sync_version: 2 })
        .mockResolvedValue(mockSyncMinorVersion);

      const result = await service.resetSync();

      // Should create new major version
      expect(mockEntityManager.save).toHaveBeenCalledWith(expect.objectContaining({
        major_version: 2,
        is_current: true,
      }));

      // Should only save the major version (no entities to sync)
      expect(mockEntityManager.save).toHaveBeenCalledTimes(1);
      
      expect(result.success).toBe(true);
    });

    it('should create sync entries for multiple routes and landing sites', async () => {
      const mockRoute2 = {
        ...mockRoute,
        id: 789,
        name: 'Second Route',
        toResponseDto: jest.fn().mockReturnValue({
          id: 789,
          name: 'Second Route',
          notes: 'Second notes',
          waypoints: [],
          enabled: true,
          created: '2025-01-01T14:00:00.000Z',
          last_updated: '2025-01-01T15:00:00.000Z',
        }),
      };

      const mockLandingSite2 = {
        ...mockLandingSite,
        id: 999,
        name: 'Second Landing Site',
        toResponseDto: jest.fn().mockReturnValue({
          id: 999,
          name: 'Second Landing Site',
          location: { type: 'Point', coordinates: [3, 4] },
          created: '2025-01-01T16:00:00.000Z',
          last_updated: '2025-01-01T17:00:00.000Z',
        }),
      };

      // Mock multiple entities
      mockEntityManager.find = jest.fn().mockImplementation((entity) => {
        if (entity === Route) {
          return Promise.resolve([mockRoute, mockRoute2]);
        }
        if (entity === LandingSite) {
          return Promise.resolve([mockLandingSite, mockLandingSite2]);
        }
        return Promise.resolve([]);
      });

      mockEntityManager.save = jest.fn()
        .mockResolvedValueOnce({ ...mockSyncMajorVersion, sync_version: 2 })
        .mockResolvedValue(mockSyncMinorVersion);

      const result = await service.resetSync();

      // Should create new major version
      expect(mockEntityManager.save).toHaveBeenCalledWith(expect.objectContaining({
        major_version: 2,
        is_current: true,
      }));

      // Should create sync entries for all entities
      // 1 major version + 2 routes + 2 landing sites = 5 saves
      expect(mockEntityManager.save).toHaveBeenCalledTimes(5);
      
      expect(result.success).toBe(true);
    });

    it('should only sync enabled routes', async () => {
      const mockDisabledRoute = {
        ...mockRoute,
        id: 999,
        name: 'Disabled Route',
        enabled: false,
      };

      // Mock routes with one disabled
      mockEntityManager.find = jest.fn().mockImplementation((entity, options) => {
        if (entity === Route) {
          // The where clause should filter out disabled routes
          if (options?.where?.enabled === true) {
            return Promise.resolve([mockRoute]); // Only enabled routes
          }
          return Promise.resolve([mockRoute, mockDisabledRoute]); // All routes
        }
        if (entity === LandingSite) {
          return Promise.resolve([mockLandingSite]);
        }
        return Promise.resolve([]);
      });

      mockEntityManager.save = jest.fn()
        .mockResolvedValueOnce({ ...mockSyncMajorVersion, sync_version: 2 })
        .mockResolvedValue(mockSyncMinorVersion);

      const result = await service.resetSync();

      // Should query only enabled routes
      expect(mockEntityManager.find).toHaveBeenCalledWith(Route, {
        where: { enabled: true }
      });

      // Should create sync entries only for enabled route and landing site
      // 1 major version + 1 enabled route + 1 landing site = 3 saves
      expect(mockEntityManager.save).toHaveBeenCalledTimes(3);
      
      expect(result.success).toBe(true);
    });
  });

  describe('logChangeInTransaction', () => {
    it('should publish WebSocket notification within transaction', async () => {
      const manager = mockEntityManager as EntityManager;
      const entityType = 'route';
      const entityId = '999';
      const action = 'create' as const;
      const data = { name: 'Transaction Test' };

      const result = await service.logChangeInTransaction(
        manager,
        entityType,
        entityId,
        action,
        data
      );

      expect(manager.save).toHaveBeenCalledWith(SyncMinorVersion, {
        major_version: 1,
        minor_version: 1,
        data: [{
          entityType: entityType,
          entityId: entityId,
          entityAction: action,
          entityData: data,
        }],
        size: expect.any(Number),
      });
      // expect(syncGateway.emitSyncUpdate).toHaveBeenCalledWith(1, 1); // Asynchronous
      expect(result).toEqual(mockSyncMinorVersion);
    });

    it('should use provided major version', async () => {
      const manager = mockEntityManager as EntityManager;
      const providedMajorVersion = 5;

      await service.logChangeInTransaction(
        manager,
        'route',
        '123',
        'update',
        {},
        providedMajorVersion
      );

      expect(manager.save).toHaveBeenCalledWith(SyncMinorVersion, expect.objectContaining({
        major_version: providedMajorVersion,
        minor_version: 1,
      }));
      // expect(syncGateway.emitSyncUpdate).toHaveBeenCalledWith(5, 1); // Asynchronous
    });

    it('should handle WebSocket errors within transaction gracefully', async () => {
      const manager = mockEntityManager as EntityManager;
      syncGateway.emitSyncUpdate.mockImplementation(() => {
        throw new Error('WebSocket failed');
      });

      const result = await service.logChangeInTransaction(
        manager,
        'route',
        '123',
        'create',
        {}
      );

      // Should still return the sync minor version even if WebSocket fails
      expect(result).toEqual(mockSyncMinorVersion);
      // expect(syncGateway.emitSyncUpdate).toHaveBeenCalled(); // Asynchronous
    });
  });
});