import {ApiProperty } from '@nestjs/swagger';


export class UserSummaryDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    email!: string;

    @ApiProperty()
    displayName!: string;

    @ApiProperty()
    preferredLanguage!: string;

    @ApiProperty()
    isActive!: boolean;

    //@ApiProperty()
    //lastLoginAt!: string;
}

