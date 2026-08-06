import { ApiProperty, IntersectionType } from "@nestjs/swagger";
import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetUserGroupsQueryDto {
  @ApiProperty({ example: 1, required: false })
  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ example: 20, required: false })
  @IsOptional() @IsInt() @Min(1) @Max(100) @Type(() => Number)
  limit?: number = 20;
}