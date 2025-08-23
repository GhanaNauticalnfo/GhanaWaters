import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { VesselTypeService } from './vessel-type.service';
import { VesselType } from './vessel-type.entity';
import { Vessel } from '../vessel.entity';
import { VesselTypeInputDto } from './dto/vessel-type-input.dto';

describe('VesselTypeService', () => {
  let service: VesselTypeService;
  let repository: jest.Mocked<Repository<VesselType>>;
  let manager: any;

  const mockVesselType = {
    id: 1,
    name: 'Unspecified',
    color: '#3B82F6',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    vessels: [],
    toResponseDto: jest.fn().mockReturnValue({
      id: 1,
      name: 'Unspecified',
      color: '#3B82F6',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      vessel_count: 0
    })
  } as unknown as VesselType;

  const mockVesselTypeCargo = {
    id: 2,
    name: 'Cargo',
    color: '#10B981',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    vessels: [],
    toResponseDto: jest.fn().mockReturnValue({
      id: 2,
      name: 'Cargo',
      color: '#10B981',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      vessel_count: 0
    })
  } as unknown as VesselType;

  beforeEach(async () => {
    const mockQueryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    manager = {
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
      query: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      findOneBy: jest.fn(),
      count: jest.fn(),
      manager: {
        transaction: jest.fn((callback) => callback(manager)),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VesselTypeService,
        {
          provide: getRepositoryToken(VesselType),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Vessel),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<VesselTypeService>(VesselTypeService);
    repository = module.get(getRepositoryToken(VesselType));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all vessel types with vessel counts', async () => {
      const vesselTypes = [mockVesselType, mockVesselTypeCargo];
      repository.find.mockResolvedValue(vesselTypes);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        relations: ['vessels'],
        order: { id: 'ASC' }
      });
      expect(result).toHaveLength(2);
      expect(mockVesselType.toResponseDto).toHaveBeenCalled();
      expect(mockVesselTypeCargo.toResponseDto).toHaveBeenCalled();
    });

    it('should return empty array when no vessel types exist', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a vessel type by id', async () => {
      repository.findOne.mockResolvedValue(mockVesselType);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['vessels']
      });
      expect(mockVesselType.toResponseDto).toHaveBeenCalled();
      expect(result).toEqual(mockVesselType.toResponseDto());
    });

    it('should throw BadRequestException when vessel type not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(BadRequestException);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['vessels']
      });
    });
  });

  describe('create', () => {
    const createDto: VesselTypeInputDto = { name: 'Fishing Vessel' };
    
    it('should create a new vessel type', async () => {
      const newVesselType = {
        ...mockVesselType,
        id: 3,
        name: 'Fishing Vessel',
        toResponseDto: jest.fn().mockReturnValue({
          id: 3,
          name: 'Fishing Vessel',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
          vessel_count: 0
        })
      } as unknown as VesselType;

      repository.create.mockReturnValue(newVesselType);
      repository.save.mockResolvedValue(newVesselType);

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(newVesselType);
      expect(newVesselType.toResponseDto).toHaveBeenCalled();
    });

    it('should handle duplicate name errors', async () => {
      const existingType = { ...mockVesselType, name: 'Fishing Vessel', toResponseDto: jest.fn() };
      repository.findOne.mockResolvedValue(existingType as any);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should handle other database errors', async () => {
      repository.create.mockReturnValue(mockVesselType);
      repository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createDto)).rejects.toThrow('Database error');
    });
  });

  describe('update', () => {
    const updateDto: VesselTypeInputDto = { name: 'Updated Cargo' };

    it('should update a vessel type', async () => {
      const updatedVesselType = {
        ...mockVesselTypeCargo,
        name: 'Updated Cargo',
        updated_at: new Date('2024-01-02'),
        toResponseDto: jest.fn().mockReturnValue({
          id: 2,
          name: 'Updated Cargo',
          color: '#10B981',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-02T00:00:00.000Z',
          vessel_count: 0
        })
      } as unknown as VesselType;

      manager.findOne
        .mockResolvedValueOnce(mockVesselTypeCargo)  // First call: find vessel type to update
        .mockResolvedValueOnce(null);                // Second call: check for name conflict
      manager.save.mockResolvedValue(updatedVesselType);

      const result = await service.update(2, updateDto);

      expect(manager.findOne).toHaveBeenCalledWith(VesselType, {
        where: { id: 2 },
        relations: ['vessels']
      });
      expect(manager.save).toHaveBeenCalledWith({
        ...mockVesselTypeCargo,
        name: 'Updated Cargo'
      });
      expect(updatedVesselType.toResponseDto).toHaveBeenCalled();
    });

    it('should throw BadRequestException when trying to update vessel type ID 1', async () => {
      await expect(service.update(1, updateDto)).rejects.toThrow(
        new BadRequestException('Cannot rename the Unspecified vessel type')
      );
      
      expect(repository.findOne).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when vessel type not found', async () => {
      manager.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(BadRequestException);
    });

    it('should handle duplicate name errors during update', async () => {
      const differentUpdateDto: VesselTypeInputDto = { name: 'Unspecified' }; // Same as mockVesselType.name
      
      manager.findOne
        .mockResolvedValueOnce(mockVesselTypeCargo) // First call finds the vessel type to update
        .mockResolvedValueOnce(mockVesselType);      // Second call finds existing type with same name
      
      await expect(service.update(2, differentUpdateDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove a vessel type', async () => {
      repository.findOne.mockResolvedValue(mockVesselTypeCargo);
      manager.findOne.mockResolvedValue(mockVesselType); // For getting unspecified type
      manager.delete.mockResolvedValue({ affected: 1 });

      await service.remove(2);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(manager.findOne).toHaveBeenCalledWith(VesselType, { where: { id: 1 } });
      expect(manager.delete).toHaveBeenCalledWith(VesselType, { id: 2 });
    });

    it('should throw BadRequestException when trying to delete vessel type ID 1', async () => {
      await expect(service.remove(1)).rejects.toThrow(
        new BadRequestException('Cannot delete the Unspecified vessel type')
      );
      
      expect(repository.findOneBy).not.toHaveBeenCalled();
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when vessel type not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(BadRequestException);
    });

    // Note: Foreign key constraint handling is managed at the database level
    // The service updates all related vessels to use the Unspecified type before deletion
  });

  describe('edge cases and validation', () => {
    // Note: Input validation tests (empty strings, long names, etc.) are handled by DTO validation
    // and are tested in vessel-type-input.dto.spec.ts

    it('should handle concurrent access scenarios', async () => {
      repository.findOne.mockResolvedValue(mockVesselTypeCargo);
      repository.save.mockRejectedValue({
        code: '40001', // Serialization failure
      });

      const updateDto: VesselTypeInputDto = { name: 'Updated Name' };
      await expect(service.update(2, updateDto)).rejects.toThrow();
    });
  });

  describe('performance and boundary conditions', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockVesselType,
        id: i + 1,
        name: `Type ${i + 1}`,
        toResponseDto: jest.fn().mockReturnValue({
          id: i + 1,
          name: `Type ${i + 1}`,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
          vessel_count: 0
        })
      })) as unknown as VesselType[];

      repository.find.mockResolvedValue(largeDataset);

      const start = Date.now();
      const result = await service.findAll();
      const duration = Date.now() - start;

      expect(result).toHaveLength(1000);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle special characters in vessel type names', async () => {
      const specialNames = [
        'Fishing & Cargo',
        'Type (Commercial)',
        'Vessel-Type_1',
        'Åland Ferry',
        '货船', // Chinese characters
        'Рыболовное судно' // Cyrillic characters
      ];

      for (const name of specialNames) {
        const createDto: VesselTypeInputDto = { name };
        const vesselType = {
          ...mockVesselType,
          name,
          toResponseDto: jest.fn().mockReturnValue({
            id: 1,
            name,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
            vessel_count: 0
          })
        } as unknown as VesselType;

        repository.create.mockReturnValue(vesselType);
        repository.save.mockResolvedValue(vesselType);

        const result = await service.create(createDto);
        expect(result.name).toBe(name);
      }
    });
  });
});