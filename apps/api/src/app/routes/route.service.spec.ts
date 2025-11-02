import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { RouteService } from './route.service';
import { Route } from './route.entity';
import { SyncService } from '../sync/sync.service';

describe('RouteService', () => {
  let service: RouteService;
  let repository: Repository<Route>;
  let syncService: SyncService;

  const mockRoute: Partial<Route> = {
    id: 1,
    name: 'Test Route',
    notes: 'Test Notes',
    waypoints: [
      { lat: 5.5509, lng: -0.1975, order: 1 },
      { lat: 5.5609, lng: -0.1875, order: 2 },
    ],
    enabled: true,
    created: new Date('2025-01-01T12:00:00Z'),
    last_updated: new Date('2025-01-01T12:00:00Z'),
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    manager: {
      transaction: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    },
  };

  const mockSyncService = {
    logChange: jest.fn(),
    logChangeInTransaction: jest.fn(),
  };


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RouteService,
        {
          provide: getRepositoryToken(Route),
          useValue: mockRepository,
        },
        {
          provide: SyncService,
          useValue: mockSyncService,
        },
      ],
    }).compile();

    service = module.get<RouteService>(RouteService);
    repository = module.get<Repository<Route>>(getRepositoryToken(Route));
    syncService = module.get<SyncService>(SyncService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of routes', async () => {
      const mockRouteEntity = {
        ...mockRoute,
        toResponseDto: jest.fn().mockReturnValue({
          id: 1,
          name: 'Test Route',
          notes: 'Test Notes',
          waypoints: mockRoute.waypoints,
          enabled: true,
          created: '2025-01-01T12:00:00.000Z',
          last_updated: '2025-01-01T12:00:00.000Z',
        }),
      };
      const routes = [mockRouteEntity as Route];
      mockRepository.find.mockResolvedValue(routes);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        order: { last_updated: 'DESC' },
      });
      expect(mockRouteEntity.toResponseDto).toHaveBeenCalledWith();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a route by id', async () => {
      const mockRouteEntity = {
        ...mockRoute,
        toResponseDto: jest.fn().mockReturnValue({
          id: 1,
          name: 'Test Route',
          notes: 'Test Notes',
          waypoints: mockRoute.waypoints,
          enabled: true,
          created: '2025-01-01T12:00:00.000Z',
          last_updated: '2025-01-01T12:00:00.000Z',
        }),
      };
      mockRepository.findOne.mockResolvedValue(mockRouteEntity);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockRouteEntity.toResponseDto).toHaveBeenCalledWith();
    });

    it('should throw NotFoundException when route not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a route and log to sync', async () => {
      const createData = {
        name: 'New Route',
        waypoints: [
          { lat: 5.5, lng: -0.2, order: 1 },
          { lat: 5.6, lng: -0.1, order: 2 }
        ],
        enabled: true,
      };
      const createdRoute = { ...mockRoute, ...createData };

      // Mock the transaction behavior
      mockRepository.manager.transaction.mockImplementation(async (callback) => {
        const manager = {
          create: jest.fn().mockReturnValue(createdRoute),
          save: jest.fn().mockResolvedValue(createdRoute),
        };
        return await callback(manager);
      });

      const result = await service.create(createData);

      expect(mockRepository.manager.transaction).toHaveBeenCalled();
      expect(mockSyncService.logChangeInTransaction).toHaveBeenCalledWith(
        expect.any(Object),
        'route',
        '1',
        'create',
        expect.objectContaining({
          type: 'Feature',
          id: 1,
          geometry: expect.objectContaining({
            type: 'LineString',
            coordinates: [[-0.2, 5.5], [-0.1, 5.6]],
          }),
          properties: expect.objectContaining({
            name: 'New Route',
          }),
        })
      );
      expect(result).toEqual(createdRoute);
    });
  });

  describe('update', () => {
    it('should update a route and log to sync', async () => {
      const updateData = { name: 'Updated Route', waypoints: mockRoute.waypoints || [], enabled: true };
      const updatedRoute = { ...mockRoute, ...updateData };

      // Mock the transaction behavior
      mockRepository.manager.transaction.mockImplementation(async (callback) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(mockRoute),
          save: jest.fn().mockResolvedValue(updatedRoute),
        };
        return await callback(manager);
      });

      const result = await service.update(1, updateData);

      expect(mockRepository.manager.transaction).toHaveBeenCalled();
      expect(mockSyncService.logChangeInTransaction).toHaveBeenCalledWith(
        expect.any(Object),
        'route',
        '1',
        'update',
        expect.objectContaining({
          type: 'Feature',
          geometry: expect.any(Object),
          properties: expect.objectContaining({
            name: 'Updated Route',
          }),
        })
      );
      expect(result).toEqual(updatedRoute);
    });

    it('should throw NotFoundException when route not found', async () => {
      const updateData = { name: 'Updated', waypoints: [
        { lat: 5.5, lng: -0.2, order: 1 },
        { lat: 5.6, lng: -0.1, order: 2 }
      ], enabled: true };
      
      // Mock the transaction behavior to throw NotFoundException
      mockRepository.manager.transaction.mockImplementation(async (callback) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(null),
        };
        return await callback(manager);
      });
      
      await expect(service.update(999, updateData)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a route and log to sync', async () => {
      // Mock the transaction behavior
      mockRepository.manager.transaction.mockImplementation(async (callback) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(mockRoute),
          remove: jest.fn().mockResolvedValue(mockRoute),
        };
        return await callback(manager);
      });

      await service.remove(1);

      expect(mockRepository.manager.transaction).toHaveBeenCalled();
      expect(mockSyncService.logChangeInTransaction).toHaveBeenCalledWith(
        expect.any(Object),
        'route',
        '1',
        'delete'
      );
    });

    it('should throw NotFoundException when route not found', async () => {
      // Mock the transaction behavior to throw NotFoundException
      mockRepository.manager.transaction.mockImplementation(async (callback) => {
        const manager = {
          findOne: jest.fn().mockResolvedValue(null),
        };
        return await callback(manager);
      });

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('convertToGeoJson', () => {
    it('should convert route to valid GeoJSON', async () => {
      // Create a route service instance to test the private method
      const testRoute: Route = {
        id: 1,
        name: 'Test Route',
        notes: 'Test',
        waypoints: [
          { lat: 5.5, lng: -0.2, order: 2 },
          { lat: 5.6, lng: -0.1, order: 1 },
          { lat: 5.7, lng: -0.3, order: 3 },
        ],
        enabled: true,
        created: new Date(),
        last_updated: new Date(),
        toResponseDto: jest.fn(),
      };

      // Mock the transaction behavior
      mockRepository.manager.transaction.mockImplementation(async (callback) => {
        const manager = {
          create: jest.fn().mockReturnValue(testRoute),
          save: jest.fn().mockResolvedValue(testRoute),
        };
        return await callback(manager);
      });

      await service.create(testRoute);

      // Check that sync was called with properly sorted waypoints
      expect(mockSyncService.logChangeInTransaction).toHaveBeenCalledWith(
        expect.any(Object),
        'route',
        '1',
        'create',
        expect.objectContaining({
          geometry: {
            type: 'LineString',
            coordinates: [
              [-0.1, 5.6], // order: 1
              [-0.2, 5.5], // order: 2
              [-0.3, 5.7], // order: 3
            ],
          },
        })
      );
    });
  });
});