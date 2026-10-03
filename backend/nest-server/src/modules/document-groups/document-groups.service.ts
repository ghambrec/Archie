import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentGroup } from './entities/document-group.entity';
import { ApplicationException } from 'src/common/errors/application.exception';
import { ErrorCode } from 'src/common/errors/error-code';

@Injectable()
export class DocumentGroupsService {
  constructor(
    @InjectRepository(DocumentGroup)
    private readonly documentGroupsRepository: Repository<DocumentGroup>,
  ) {}

  async setGroup(documentId: string, groupId: string): Promise<void> {
    const existing = await this.documentGroupsRepository.findOneBy({ documentId });

    if (existing) {
      throw new ApplicationException(ErrorCode.DocumentAlreadyInGroup);
    }

    await this.documentGroupsRepository.insert({ documentId, groupId });
  }

  async moveToGroup(documentId: string, groupId: string): Promise<void> {
    await this.documentGroupsRepository.manager.transaction(async (manager) => {
      const existing = await manager.findOneBy(DocumentGroup, { documentId, groupId });

      if (existing) {
        throw new ApplicationException(ErrorCode.DocumentAlreadyInGroup);
      }

      await manager.delete(DocumentGroup, { documentId });
      await manager.insert(DocumentGroup, { documentId, groupId });
    });
  }

  async removeGroup(documentId: string, groupId: string): Promise<void> {
    const existing = await this.documentGroupsRepository.findOneBy({ documentId, groupId });

    if (!existing) {
      throw new ApplicationException(ErrorCode.DocumentNotInGroup);
    }

    await this.documentGroupsRepository.delete({ documentId, groupId });
  }
}
