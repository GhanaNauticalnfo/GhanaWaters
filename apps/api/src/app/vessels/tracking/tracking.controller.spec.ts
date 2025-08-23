import { Test, TestingModule } from '@nestjs/testing';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { VesselService } from '../vessel.service';
import { TelemetryExportService } from './telemetry-export.service';
import { VesselTelemetryInputDto } from './dto/vessel-telemetry-input.dto';
import { VesselTelemetryResponseDto } from './dto/vessel-telemetry-response.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { GeoPoint } from '@ghanawaters/shared-models';
import { Response } from 'express';

describe('TrackingController', () => {
  let controller: TrackingController;
  let trackingService: TrackingService;
  let vesselService: VesselService;
  let telemetryExportService: TelemetryExportService;

  const mockPosition: GeoPoint = {
    type: 'Point',
    coordinates: [-0.1225, 5.6037]
  };

  const mockTelemetryResponse: VesselTelemetryResponseDto = {
    id: 1,
    created: new Date(),
    timestamp: new Date(),
    vessel_id: 1,
    position: mockPosition,
    speed_knots: 10.5,
    heading_degrees: 180,
    device_id: 'device-123',
    status: 'moving'
  };

  const mockVessel = {
    id: 1,
    name: 'Test Vessel',
    vessel_type: { id: 1, name: 'Cargo' }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrackingController],
      providers: [
        {
          provide: TrackingService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            findByVessel: jest.fn(),
            findByVesselAndTimeRange: jest.fn(),
            getLatestPositions: jest.fn(),
            getVesselLatestPosition: jest.fn(),
          },
        },
        {
          provide: VesselService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: TelemetryExportService,
          useValue: {
            getExportStats: jest.fn(),
            streamTelemetryExport: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TrackingController>(TrackingController);
    trackingService = module.get<TrackingService>(TrackingService);
    vesselService = module.get<VesselService>(VesselService);
    telemetryExportService = module.get<TelemetryExportService>(TelemetryExportService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLatestPositions', () => {
    it('should return latest positions for all vessels', async () => {
      const mockPositions = [mockTelemetryResponse];
      jest.spyOn(trackingService, 'getLatestPositions').mockResolvedValue(mockPositions);

      const result = await controller.getLatestPositions();

      expect(result).toEqual(mockPositions);
      expect(trackingService.getLatestPositions).toHaveBeenCalled();
    });
  });

  describe('getVesselTelemetry', () => {
    it('should return telemetry history for a vessel', async () => {
      const mockHistory = [mockTelemetryResponse];
      jest.spyOn(vesselService, 'findOne').mockResolvedValue(mockVessel as any);
      jest.spyOn(trackingService, 'findByVessel').mockResolvedValue(mockHistory);

      const result = await controller.getVesselTelemetry('1', '100');

      expect(result).toEqual(mockHistory);
      expect(vesselService.findOne).toHaveBeenCalledWith(1);
      expect(trackingService.findByVessel).toHaveBeenCalledWith(1, 100);
    });

    it('should throw 404 if vessel not found', async () => {
      jest.spyOn(vesselService, 'findOne').mockResolvedValue(null);

      await expect(controller.getVesselTelemetry('999', '100')).rejects.toThrow(
        new HttpException('Vessel not found', HttpStatus.NOT_FOUND)
      );
    });

    it('should handle time range filtering', async () => {
      const startTime = '2024-01-01T00:00:00Z';
      const endTime = '2024-01-31T23:59:59Z';
      const mockHistory = [mockTelemetryResponse];
      
      jest.spyOn(vesselService, 'findOne').mockResolvedValue(mockVessel as any);
      jest.spyOn(trackingService, 'findByVesselAndTimeRange').mockResolvedValue(mockHistory);

      const result = await controller.getVesselTelemetry('1', '100', startTime, endTime);

      expect(result).toEqual(mockHistory);
      expect(trackingService.findByVesselAndTimeRange).toHaveBeenCalledWith(
        1,
        new Date(startTime),
        new Date(endTime)
      );
    });
  });

  describe('getVesselLatestPosition', () => {
    it('should return the latest position for a vessel', async () => {
      jest.spyOn(vesselService, 'findOne').mockResolvedValue(mockVessel as any);
      jest.spyOn(trackingService, 'getVesselLatestPosition').mockResolvedValue(mockTelemetryResponse);

      const result = await controller.getVesselLatestPosition('1');

      expect(result).toEqual(mockTelemetryResponse);
      expect(trackingService.getVesselLatestPosition).toHaveBeenCalledWith(1);
    });

    it('should throw 404 if vessel not found', async () => {
      jest.spyOn(vesselService, 'findOne').mockResolvedValue(null);

      await expect(controller.getVesselLatestPosition('999')).rejects.toThrow(
        new HttpException('Vessel not found', HttpStatus.NOT_FOUND)
      );
    });

    it('should throw 404 if no telemetry data found', async () => {
      jest.spyOn(vesselService, 'findOne').mockResolvedValue(mockVessel as any);
      jest.spyOn(trackingService, 'getVesselLatestPosition').mockResolvedValue(null);

      await expect(controller.getVesselLatestPosition('1')).rejects.toThrow(
        new HttpException('No telemetry data found for this vessel', HttpStatus.NOT_FOUND)
      );
    });
  });

  describe('reportPosition', () => {
    it('should report position for a vessel', async () => {
      const telemetryInput: VesselTelemetryInputDto = {
        timestamp: new Date().toISOString(),
        position: mockPosition,
        speed_knots: 10.5,
        heading_degrees: 180,
        status: 'moving'
      };

      jest.spyOn(vesselService, 'findOne').mockResolvedValue(mockVessel as any);
      jest.spyOn(trackingService, 'create').mockResolvedValue(mockTelemetryResponse);

      const result = await controller.reportPosition('1', telemetryInput);

      expect(result).toEqual(mockTelemetryResponse);
      expect(vesselService.findOne).toHaveBeenCalledWith(1);
      expect(trackingService.create).toHaveBeenCalledWith(1, telemetryInput);
    });

    it('should throw 404 if vessel not found', async () => {
      const telemetryInput: VesselTelemetryInputDto = {
        position: mockPosition,
        speed_knots: 10.5,
        heading_degrees: 180,
      };

      jest.spyOn(vesselService, 'findOne').mockResolvedValue(null);

      await expect(controller.reportPosition('999', telemetryInput)).rejects.toThrow(
        new HttpException('Vessel not found', HttpStatus.NOT_FOUND)
      );
    });
  });

  describe('reportPositionFromDevice', () => {
    it('should report position from authenticated device', async () => {
      const telemetryInput: VesselTelemetryInputDto = {
        timestamp: new Date().toISOString(),
        position: mockPosition,
        speed_knots: 10.5,
        heading_degrees: 180,
        status: 'moving'
      };

      const mockRequest = {
        device: {
          device_id: 'device-123',
          vessel_id: 1
        }
      };

      jest.spyOn(trackingService, 'create').mockResolvedValue(mockTelemetryResponse);

      const result = await controller.reportPositionFromDevice(telemetryInput, mockRequest);

      expect(result).toEqual(mockTelemetryResponse);
      expect(trackingService.create).toHaveBeenCalledWith(1, telemetryInput, 'device-123');
    });

    it('should use device authentication for vessel and device ID', async () => {
      const telemetryInput: VesselTelemetryInputDto = {
        position: mockPosition,
        speed_knots: 15.0,
        heading_degrees: 90,
      };

      const mockRequest = {
        device: {
          device_id: 'device-456',
          vessel_id: 2
        }
      };

      const expectedResponse = {
        ...mockTelemetryResponse,
        vessel_id: 2,
        device_id: 'device-456'
      };

      jest.spyOn(trackingService, 'create').mockResolvedValue(expectedResponse);

      const result = await controller.reportPositionFromDevice(telemetryInput, mockRequest);

      expect(result.vessel_id).toBe(2);
      expect(result.device_id).toBe('device-456');
      expect(trackingService.create).toHaveBeenCalledWith(2, telemetryInput, 'device-456');
    });
  });

  describe('getExportStats', () => {
    it('should return telemetry export statistics', async () => {
      const mockStats = {
        totalRecords: 1000,
        dateRange: {
          min: new Date('2024-01-01'),
          max: new Date('2024-12-31')
        }
      };

      jest.spyOn(telemetryExportService, 'getExportStats').mockResolvedValue(mockStats);

      const result = await controller.getTelemetryExportStats();

      expect(result).toEqual(mockStats);
      expect(telemetryExportService.getExportStats).toHaveBeenCalled();
    });
  });

  describe('exportTelemetryData', () => {

    it('should handle missing required parameters', async () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await expect(
        controller.exportTelemetryData(
          '', // empty startDate
          '2024-12-31',
          mockResponse
        )
      ).rejects.toThrow('startDate and endDate are required');
    });

  });
});