import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class AskConversationDto {
	@ApiProperty({ example: 'ask your question here' })
	@IsString()
	@MinLength(1)
	@MaxLength(1000)
	question!: string;
}
