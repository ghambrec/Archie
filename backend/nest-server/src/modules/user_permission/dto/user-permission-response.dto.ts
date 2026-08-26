import { ApiProperty } from '@nestjs/swagger';

export class UserPermissionResponseDto {
  @ApiProperty({ example: '5f8e6e3a-1b2c-4d3e-9f0a-1234567890ab' })
  userId!: string;

  @ApiProperty({ example: 'documents.read' })
  permKey!: string;
}
