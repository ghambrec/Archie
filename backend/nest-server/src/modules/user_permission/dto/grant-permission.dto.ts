import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class GrantPermissionDto {
  @ApiProperty({ example: '5f8e6e3a-1b2c-4d3e-9f0a-1234567890ab' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ example: 'documents.read' })
  @IsString()
  @IsNotEmpty()
  permKey!: string;
}
