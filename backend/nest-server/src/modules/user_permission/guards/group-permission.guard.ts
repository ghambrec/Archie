import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isUUID } from 'class-validator';
import type { Request } from 'express';
import { GROUP_PERMISSION_KEY } from '../decorators/require-group-permission.decorator';
import { UserPermissionService } from '../user_permission.service';

@Injectable()
export class GroupPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userPermissionService: UserPermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<
      string | undefined
    >(GROUP_PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermission) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const groupId = req.params.groupId;

    if (typeof groupId !== 'string' || !isUUID(groupId)) {
      throw new BadRequestException('Invalid groupId');
    }

    const hasPermission = await this.userPermissionService.hasPermission(
      req.userId!,
      groupId,
      requiredPermission,
    );

    if (!hasPermission) {
      throw new ForbiddenException();
    }

    return true;
  }
}
