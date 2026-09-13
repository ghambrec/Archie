import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from 'nestjs-pino';
import { Tag } from './entities/tag.entity';
import { TagResponseDto } from './dto/tag-response.dto';

interface TagRawRow {
  id: string;
  name: string;
  label: string;
  parentId: string | null;
  documentCount: string;
}

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    private readonly logger: Logger,
  ) {}

  async findAll(userId: string): Promise<TagResponseDto[]> {
    this.logger.log({ userId }, 'Listing tags visible to user');

    const rows = await this.tagsRepository
      .createQueryBuilder('tag')
      .innerJoin('document_tags', 'dt', 'dt.tag_id = tag.id')
      .innerJoin(
        'documents',
        'd',
        'd.id = dt.document_id AND d.deleted_at IS NULL AND (d.uploaded_by = :userId OR EXISTS (' +
          'SELECT 1 FROM document_groups dg ' +
          'INNER JOIN user_groups ug ON ug.group_id = dg.group_id ' +
          'WHERE dg.document_id = d.id AND ug.user_id = :userId' +
          '))',
        { userId },
      )
      .select('tag.id', 'id')
      .addSelect('tag.name', 'name')
      .addSelect('tag.label', 'label')
      .addSelect('tag.parent_id', 'parentId')
      .addSelect('COUNT(DISTINCT dt.document_id)', 'documentCount')
      .groupBy('tag.id')
      .orderBy('tag.name', 'ASC')
      .getRawMany<TagRawRow>();

    this.logger.log({ userId, count: rows.length }, 'Tags listed successfully');

    return rows.map((row) =>
      Object.assign(new TagResponseDto(), {
        id: row.id,
        name: row.name,
        label: row.label,
        parentId: row.parentId,
        documentCount: Number(row.documentCount),
      }),
    );
  }
}
