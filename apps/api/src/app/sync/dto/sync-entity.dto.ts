import { IsString, IsIn, IsNotEmpty, IsOptional, ValidateIf, IsObject } from 'class-validator';
import { SyncEntity } from '@ghanawaters/shared-models';

export class SyncEntityDto implements SyncEntity {
  @IsString()
  @IsNotEmpty()
  @IsIn(['route', 'landing_site'], { message: 'entityType must be either route or landing_site' })
  entityType: string;

  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsString()
  @IsIn(['create', 'update', 'delete'], { message: 'entityAction must be create, update, or delete' })
  entityAction: 'create' | 'update' | 'delete';

  @ValidateIf((obj) => obj.entityAction === 'create' || obj.entityAction === 'update')
  @IsObject({ message: 'entityData is required for create and update actions' })
  @IsOptional()
  entityData?: any;
}