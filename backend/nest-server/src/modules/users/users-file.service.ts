import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { User } from './entities/user.entity';
import { StorageService } from '../storage/storage.service';
import { PatchAvatarResponseDto } from './dto/patch-avatar-response.dto';

const AVATARS_BUCKET = 'avatars';
const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mb

@Injectable()
export class UsersFileService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly storageService: StorageService,
  ) {}

  async patchAvatarImage(userId: string, file: Express.Multer.File): Promise<PatchAvatarResponseDto> {
    if (!file) {
      throw new BadRequestException('No file was provided.');
    }
    if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Avatar must be a JPEG, PNG, or WebP image.');
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      throw new BadRequestException('Avatar file exceeds the maximum allowed size of 5MB.');
    }

    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User was not found.');
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
}
