import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { User } from './entities/user.entity';
import { StorageService } from '../storage/storage.service';
import { ObjectStatsDto } from '../storage/dto/object-stats.dto';
import { PatchAvatarResponseDto } from './dto/patch-avatar-response.dto';
import { ApplicationException } from 'src/common/errors/application.exception';
import { ErrorCode } from 'src/common/errors/error-code';
import { GetAvatarResponseDto } from './dto/get-avatar-response.dto';

const AVATARS_BUCKET = 'avatars';
const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mb
const DEFAULT_AVATAR_MIME_TYPE = 'application/octet-stream';

@Injectable()
export class UsersFileService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly storageService: StorageService,
  ) {}

  async patchAvatarImage(userId: string, file: Express.Multer.File): Promise<PatchAvatarResponseDto> {
    if (!file) {
      throw new ApplicationException(ErrorCode.ValidationFailed);
    }
    if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.mimetype)) {
      throw new ApplicationException(ErrorCode.InvalidAvatarFileType);
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      throw new ApplicationException(ErrorCode.AvatarFileTooLarge);
    }

    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new ApplicationException(ErrorCode.UserNotFound);
    }

    const key = `avatar-${randomUUID()}`;
    await this.storageService.putObject(
      AVATARS_BUCKET,
      key,
      file.buffer,
      file.size,
      {
        'Content-Type': file.mimetype,
      });

    const previousObjectKey = user.avatarObjectKey;

    await this.usersRepository.update(userId, { avatarObjectKey: key });

    if (previousObjectKey) {
      await this.storageService.removeObject(AVATARS_BUCKET, previousObjectKey);
    }

    return { objectAvatarKey: key };
  }

  async getAvatarImage(userId: string): Promise<GetAvatarResponseDto> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new ApplicationException(ErrorCode.UserNotFound);
    }

    const key = user.avatarObjectKey;
    if (key == null) {
      throw new ApplicationException(ErrorCode.AvatarNotExisted);
    }

    let fileData: ObjectStatsDto;
    try {
      fileData = await this.storageService.getStats(AVATARS_BUCKET, key);
    } catch {
      throw new ApplicationException(ErrorCode.AvatarNotExisted);
    }

    const stream = await this.storageService.getObject(AVATARS_BUCKET, key);
    const getAvatarResponse: GetAvatarResponseDto = {
      stream: stream,
      sizeBytes: fileData.size,
      mimeType: fileData.metaData['content-type'] ?? DEFAULT_AVATAR_MIME_TYPE,
    };

    return getAvatarResponse;
  }
}
