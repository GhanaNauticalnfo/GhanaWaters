import { IsNumber, IsString, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SyncEntry } from '@ghanawaters/shared-models';
import { SyncEntityDto } from './sync-entity.dto';

export class SyncEntryDto implements SyncEntry {
  @IsNumber()
  majorVersion: number; // Keep API field name for backward compatibility

  @IsNumber()
  fromMinorVersion: number;

  @IsNumber()
  toMinorVersion: number;

  @IsString()
  lastUpdate: string;

  @IsBoolean()
  hasMoreEntities: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncEntityDto)
  entities: SyncEntityDto[];
}