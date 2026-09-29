import {
	BadRequestException,
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { PermissionsService } from '../permissions.service';
import { isUUID } from 'class-validator';

@Injectable()
export class PermissionsGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly permissionsService: PermissionsService,
	) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const requiredPermission =  this.reflector.getAllAndOverride<string | undefined>(
			PERMISSION_KEY,
			[context.getHandler(), context.getClass()]
		);

		if (!requiredPermission) {
			return true;
		}

		const req = context.switchToHttp().getRequest<Request>();
		const groupId = req.params.groupId;

		if (typeof groupId !== 'string' || !isUUID(groupId)) {
			throw new BadRequestException('groupId is not valid');
		}

		const allowed = await this.permissionsService.hasPermission(req.userId!, groupId, requiredPermission);
		if (!allowed) {
			throw new ForbiddenException();
		}

		return true;
	}
}
