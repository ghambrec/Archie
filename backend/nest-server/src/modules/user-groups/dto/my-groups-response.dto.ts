import { ApiProperty } from "@nestjs/swagger";

export class MyGroupMembershipDto {
    @ApiProperty()
    groupId!: string;

    @ApiProperty()
    name!: string;

    @ApiProperty()
    joinedAt!: Date;

    @ApiProperty({
        type: [String],
        example: ['documents.read', 'documents.upload'],
    })
    permissions!: string[];
}

export class GetMyGroupsResponseDto {
    @ApiProperty()
    userId!: string;

    @ApiProperty()
    displayName!: string;

    @ApiProperty()
    email!: string;

    @ApiProperty({ type: [MyGroupMembershipDto] })
    groups!:  MyGroupMembershipDto[];
}