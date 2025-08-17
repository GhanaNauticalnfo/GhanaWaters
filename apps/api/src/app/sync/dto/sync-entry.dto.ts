import { SyncEntityDto } from './sync-entity.dto';

export class SyncEntryDto {
  majorVersion: number;
  fromMinorVersion: number;
  toMinorVersion: number;
  lastUpdate: string;
  isLatest: boolean;
  entities: SyncEntityDto[];
}