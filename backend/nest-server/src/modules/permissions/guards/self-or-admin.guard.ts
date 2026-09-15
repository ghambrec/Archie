import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { PermissionsService } from '../permissions.service';

@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  constructor(private readonly permissionsService: PermissionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
	const targetUserId = req.params.userId;

	if (targetUserId === req.userId) {
		return true;
	}

    const isAdmin = await this.permissionsService.isUserAdmin(req.userId!);
    if (!isAdmin) {
      throw new ForbiddenException();
    }

    return true;
  }
}
