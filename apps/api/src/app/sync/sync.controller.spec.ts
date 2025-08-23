import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { SyncEntryDto } from './dto';

describe('SyncController', () => {
  let controller: SyncController;
  let service: SyncService;
  let mockResponse: Partial<Response>;

  const mockSyncService = {
    getChangesByVersion: jest.fn(),
    getCurrentSyncVersion: jest.fn(),
    resetSync: jest.fn(),
  };

  beforeEach(async () => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        {
          provide: SyncService,
          useValue: mockSyncService,
        },
      ],
    }).compile();

    controller = module.get<SyncController>(SyncController);
    service = module.get<SyncService>(SyncService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('syncData', () => {
    it('should return sync data with version parameters', async () => {
      const mockSyncEntryDto: SyncEntryDto = {
        majorVersion: 1,
        fromMinorVersion: 0,
        toMinorVersion: 5,
        lastUpdate: '2025-01-01T12:00:00Z',
        hasMoreEntities: false,
        entities: [
          {
            entityType: 'route',
            entityId: '123',
            entityAction: 'create',
            entityData: { test: 'data' },
          },
        ],
      };
      mockSyncService.getChangesByVersion.mockResolvedValue(mockSyncEntryDto);

      await controller.syncData(
        mockResponse as Response,
        '1',
        '0',
        '100'
      );

      expect(service.getChangesByVersion).toHaveBeenCalledWith(1, 0, 100);
      expect(mockResponse.json).toHaveBeenCalledWith(mockSyncEntryDto);
    });

    it('should use default values when no parameters provided', async () => {
      const mockSyncEntryDto: SyncEntryDto = {
        majorVersion: 1,
        fromMinorVersion: 0,
        toMinorVersion: 3,
        lastUpdate: '2025-01-01T12:00:00Z',
        hasMoreEntities: false,
        entities: [],
      };
      mockSyncService.getChangesByVersion.mockResolvedValue(mockSyncEntryDto);

      await controller.syncData(mockResponse as Response);

      expect(service.getChangesByVersion).toHaveBeenCalledWith(undefined, undefined, 100);
      expect(mockResponse.json).toHaveBeenCalledWith(mockSyncEntryDto);
    });

    it('should return 204 when no versions exist', async () => {
      mockSyncService.getChangesByVersion.mockResolvedValue(null);

      await controller.syncData(
        mockResponse as Response,
        '999',
        '0'
      );

      expect(service.getChangesByVersion).toHaveBeenCalledWith(999, 0, 100);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should handle invalid version strings', async () => {
      const mockSyncEntryDto: SyncEntryDto = {
        majorVersion: 1,
        fromMinorVersion: 0,
        toMinorVersion: 1,
        lastUpdate: '2025-01-01T12:00:00Z',
        hasMoreEntities: false,
        entities: [],
      };
      mockSyncService.getChangesByVersion.mockResolvedValue(mockSyncEntryDto);

      await controller.syncData(
        mockResponse as Response,
        'invalid',
        'invalid',
        'invalid'
      );

      // Should parse as NaN 
      expect(service.getChangesByVersion).toHaveBeenCalledWith(NaN, NaN, NaN);
      expect(mockResponse.json).toHaveBeenCalledWith(mockSyncEntryDto);
    });
  });

  describe('resetSync', () => {
    it('should call service resetSync method', async () => {
      const mockResult = { success: true, majorVersion: 2 };
      mockSyncService.resetSync.mockResolvedValue(mockResult);

      const result = await controller.resetSync();

      expect(service.resetSync).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });
  });
});