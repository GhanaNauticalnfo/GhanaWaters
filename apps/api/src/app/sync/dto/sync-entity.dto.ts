export class SyncEntityDto {
  entityType: string;
  entityId: string;
  entityAction: 'create' | 'update' | 'delete';
  entityData: any;
}