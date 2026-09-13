import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from 'nestjs-pino';
import { Tag } from './entities/tag.entity';
import { DocumentTag } from './entities/document-tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagAdminResponseDto } from './dto/tag-admin-response.dto';
import { ApplicationException } from 'src/common/errors/application.exception';
import { ErrorCode } from 'src/common/errors/error-code';

@Injectable()
export class AdminTagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(DocumentTag)
    private readonly documentTagsRepository: Repository<DocumentTag>,
    private readonly logger: Logger,
  ) {}

  async create(dto: CreateTagDto): Promise<TagAdminResponseDto> {
    this.logger.log({ name: dto.name }, 'Admin is creating tag');

    const nameTaken = await this.tagsRepository.findOneBy({ name: dto.name });
    if (nameTaken) {
      this.logger.warn({ name: dto.name }, 'Tag name is already taken');
      throw new ApplicationException(ErrorCode.TagNameAlreadyRegistered);
    }

    if (dto.parentId) {
      const parent = await this.tagsRepository.findOneBy({ id: dto.parentId });
      if (!parent) {
        this.logger.warn({ parentId: dto.parentId }, 'Parent tag not found');
        throw new ApplicationException(ErrorCode.TagNotFound);
      }
    }

    const tag = this.tagsRepository.create({
      name: dto.name,
      label: dto.label,
      description: dto.description ?? null,
      facet: dto.facet ?? 'domain',
      parentId: dto.parentId ?? null,
    });

    await this.tagsRepository.save(tag);

    this.logger.log({ tagId: tag.id, name: tag.name }, 'Admin created tag successfully');
    return new TagAdminResponseDto(tag);
  }

  async update(id: string, dto: UpdateTagDto): Promise<TagAdminResponseDto> {
    this.logger.log({ tagId: id }, 'Admin is updating tag');

    const tag = await this.tagsRepository.findOneBy({ id });
    if (!tag) {
      this.logger.warn({ tagId: id }, 'Tag not found');
      throw new ApplicationException(ErrorCode.TagNotFound);
    }

    if (dto.name && dto.name !== tag.name) {
      const nameTaken = await this.tagsRepository.findOneBy({ name: dto.name });
      if (nameTaken) {
        this.logger.warn({ name: dto.name }, 'Tag name is already taken');
        throw new ApplicationException(ErrorCode.TagNameAlreadyRegistered);
      }
    }

    if (dto.parentId) {
      // TODO: I should check this later if i need it at all.
      if (dto.parentId === id) {
        throw new BadRequestException('A tag cannot be its own parent.');
      }

      const parent = await this.tagsRepository.findOneBy({ id: dto.parentId });
      if (!parent) {
        this.logger.warn({ parentId: dto.parentId }, 'Parent tag not found');
        throw new ApplicationException(ErrorCode.TagNotFound);
      }
    }

    await this.tagsRepository.update(id, {
      name: dto.name,
      label: dto.label,
      description: dto.description,
      facet: dto.facet,
      parentId: dto.parentId,
    });

    const updatedTag = await this.tagsRepository.findOneBy({ id });

    this.logger.log({ tagId: id }, 'Admin updated tag successfully');
    return new TagAdminResponseDto(updatedTag!);
  }

  async remove(id: string): Promise<void> {
    this.logger.log({ tagId: id }, 'Admin trying to delete tag');

    const tag = await this.tagsRepository.findOneBy({ id });
    if (!tag) {
      this.logger.warn({ tagId: id }, 'Tag not found');
      throw new ApplicationException(ErrorCode.TagNotFound);
    }

    const childTagCount = await this.tagsRepository.countBy({ parentId: id });
    if (childTagCount > 0) {
      this.logger.warn({ tagId: id, childTagCount }, 'Tag still has child tags');
      throw new ApplicationException(ErrorCode.TagHasDependents);
    }

    const documentCount = await this.documentTagsRepository.countBy({ tagId: id });
    if (documentCount > 0) {
      this.logger.warn({ tagId: id, documentCount }, 'Tag is still assigned to documents');
      throw new ApplicationException(ErrorCode.TagHasDependents);
    }

    await this.tagsRepository.remove(tag);

    this.logger.log({ tagId: id }, 'Admin deleted tag successfully');
  }
}
