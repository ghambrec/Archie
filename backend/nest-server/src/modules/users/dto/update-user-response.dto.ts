import { ApiProperty } from '@nestjs/swagger';

// what server may respond
export class UpdateUserResponseDto{
	@ApiProperty()
	id!: string;
}

