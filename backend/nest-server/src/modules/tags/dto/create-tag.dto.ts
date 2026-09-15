import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export const TAG_FACETS = ['domain', 'doctype'] as const;
export type TagFacet = (typeof TAG_FACETS)[number];

export class CreateTagDto {
  @ApiProperty({ example: 'banking' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Bank Account' })
  @IsString()
  @IsNotEmpty()
  label!: string;

  @ApiProperty({ example: 'e32b410-0000-0000-0000-000000000000', required: false })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ example: 'Checking account, credit card, payments', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'domain', enum: TAG_FACETS, required: false })
  @IsOptional()
  @IsIn(TAG_FACETS)
  facet?: TagFacet;
}
