import { ApiProperty } from '@nestjs/swagger';

export class PatchAvatarResponseDto {
  @ApiProperty()
  objectAvatarKey!: string;
}
