import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TreeStubGroupInputDto as TreeStubGroupInputInterface } from '@ghanawaters/shared-models';

export class TreeStubGroupInputDto implements TreeStubGroupInputInterface {
  @ApiProperty({
    description: 'Name of the tree stub group',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Whether the tree stub group is enabled',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean = true;
}