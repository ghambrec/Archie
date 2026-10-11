import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import type { Request } from 'express';
import { Repository } from 'typeorm';
import { ApplicationException } from 'src/common/errors/application.exception';
import { ErrorCode } from 'src/common/errors/error-code';
import { PERMISSION_KEY } from '../../permissions/decorators/require-permission.decorator';
import { PermissionsService } from '../../permissions/permissions.service';
import { DocumentGroup } from '../../document-groups/entities/document-group.entity';
import { Document } from '../entities/document.entity';

// Checks the permission from @RequirePermission() against the document in the :id route param.
// Access is granted if the user has the permission in at least one group the document belongs to.
@Injectable()
export class DocumentPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
    @InjectRepository(Document)
    private readonly documentsRepository: Repository<Document>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<
      string | undefined
    >(PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermission) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const documentId = req.params.id;

    if (typeof documentId !== 'string' || !isUUID(documentId)) {
      throw new BadRequestException('id is not valid');
    }

    const documentGroups = await this.documentsRepository
      .createQueryBuilder('document')
      .innerJoin(
        DocumentGroup,
        'documentGroup',
        'documentGroup.documentId = document.id',
      )
      .where('document.id = :documentId', { documentId })
      .select('documentGroup.groupId', 'groupId')
      .getRawMany<{ groupId: string }>();

    if (documentGroups.length === 0) {
      throw new ApplicationException(ErrorCode.DocumentNotFound);
    }

    const allowedGroupIds =
      await this.permissionsService.getGroupIdsWithPermission(
        req.userId!,
        requiredPermission,
      );

    const allowed = documentGroups.some(({ groupId }) =>
      allowedGroupIds.includes(groupId),
    );
    if (!allowed) {
      throw new ForbiddenException();
    }

    return true;
  }
}
