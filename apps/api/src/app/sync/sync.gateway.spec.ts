import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { SyncGateway } from './sync.gateway';

describe('SyncGateway', () => {
  let gateway: SyncGateway;
  let mockServer: Partial<Server>;
  let mockSocket: Partial<Socket>;

  beforeEach(async () => {
    mockServer = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };

    mockSocket = {
      id: 'test-socket-id',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SyncGateway],
    }).compile();

    gateway = module.get<SyncGateway>(SyncGateway);
    gateway.server = mockServer as Server;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('afterInit', () => {
    it('should log initialization', () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log').mockImplementation();
      gateway.afterInit(mockServer as Server);
      expect(logSpy).toHaveBeenCalledWith('Sync WebSocket Gateway initialized');
      logSpy.mockRestore();
    });
  });

  describe('handleConnection', () => {
    it('should log client connection', () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log').mockImplementation();
      gateway.handleConnection(mockSocket as Socket);
      
      expect(logSpy).toHaveBeenCalledWith(`Client connected to sync namespace: ${mockSocket.id}`);
      logSpy.mockRestore();
    });
  });

  describe('handleDisconnect', () => {
    it('should log client disconnection', () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log').mockImplementation();
      gateway.handleDisconnect(mockSocket as Socket);
      
      expect(logSpy).toHaveBeenCalledWith(`Client disconnected from sync namespace: ${mockSocket.id}`);
      logSpy.mockRestore();
    });
  });

  describe('emitSyncUpdate', () => {
    it('should emit sync update to all connected clients', () => {
      const syncVersion = 1;
      const minorVersion = 123;
      
      gateway.emitSyncUpdate(syncVersion, minorVersion);
      
      expect(mockServer.emit).toHaveBeenCalledWith('sync-update', {
        major_version: syncVersion, // Keep API field name for backward compatibility
        minor_version: minorVersion,
        timestamp: expect.any(Date)
      });
    });

    it('should log the sync update', () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      const debugSpy = jest.spyOn(gateway['logger'], 'debug').mockImplementation();
      const syncVersion = 2;
      const minorVersion = 456;
      
      gateway.emitSyncUpdate(syncVersion, minorVersion);
      
      expect(logSpy).toHaveBeenCalledWith('🔄 [SYNC] Emitting sync update to /sync namespace:', {
        majorVersion: syncVersion,
        minorVersion,
        timestamp: expect.any(String),
      });
      expect(debugSpy).toHaveBeenCalledWith(`Emitted sync update: v${syncVersion}.${minorVersion}`);
      logSpy.mockRestore();
      debugSpy.mockRestore();
    });

    it('should handle errors gracefully', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const loggerErrorSpy = jest.spyOn(gateway['logger'], 'error').mockImplementation();
      
      // Mock server.emit to throw an error
      mockServer.emit = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      
      // Should not throw
      expect(() => gateway.emitSyncUpdate(1, 1)).not.toThrow();
      
      expect(errorSpy).toHaveBeenCalledWith('🔄 [SYNC] Error emitting sync update:', expect.any(Error));
      expect(loggerErrorSpy).toHaveBeenCalledWith('Error emitting sync update:', expect.any(Error));
      
      errorSpy.mockRestore();
      loggerErrorSpy.mockRestore();
    });
  });
});