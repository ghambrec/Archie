import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiBearerAuth()
@Controller('users')
export class UsersController
{
	constructor(private readonly usersService: UsersService) {}

	@Get()
	findAll()
	{
		return this.usersService.findAll();
	}
}
