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
}
