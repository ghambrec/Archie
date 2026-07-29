import { ApiProperty } from '@nestjs/swagger';


export class UpdateUserResponseDto{
	@ApiProperty()
	id!: string;
}

