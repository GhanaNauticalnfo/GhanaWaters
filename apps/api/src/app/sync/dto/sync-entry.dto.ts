import { IsNumber, IsString, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SyncEntityDto } from './sync-entity.dto';

export class SyncEntryDto {
  @IsNumber()
  majorVersion: number;

  @IsNumber()
  fromMinorVersion: number;

  @IsNumber()
  toMinorVersion: number;

  @IsString()
  lastUpdate: string;

  @IsBoolean()
  isLatest: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncEntityDto)
  entities: SyncEntityDto[];
}