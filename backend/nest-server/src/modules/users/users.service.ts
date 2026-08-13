import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Group } from '../groups/entities/group.entity';
import { UserGroup } from '../user-groups/entities/user-group.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserResponseDto } from './dto/update-user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserSummaryDto } from './dto/user-summary.dto';
import { ApplicationException } from 'src/common/errors/application.exception';
import { ErrorCode } from 'src/common/errors/error-code';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { GetUsersResponseDto } from './dto/get-users-response.dto';
import { Logger } from 'nestjs-pino';


const PASSWORD_SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    private readonly logger: Logger,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  

  async create(dto: CreateUserDto): Promise<User> {
    this.logger.log('Execute create', dto.email);
    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);

    const MailExisting = await this.findByEmail(dto.email)
    if(MailExisting) {
      this.logger.warn(`Create failed for ${dto.email}, email already registered`);
      throw new ApplicationException(
      ErrorCode.EmailAlreadyRegistered,
    )
    }

    const DisplayNameExisting = await this.findByName(dto.displayName)
    if(DisplayNameExisting) {
      this.logger.warn(`Create failed for ${dto.email}, display name already registered`);
      throw new ApplicationException(
        ErrorCode.UserNameAlreadyRegistered,
      )
    }

    return this.dataSource.transaction(async (manager) => {
      const userInsert = await manager.insert(User, {
        email: dto.email.trim().toLowerCase(),
        passwordHash,
        displayName: dto.displayName,
      });
      const userId = userInsert.identifiers[0].id as string;

      const groupInsert = await manager.insert(Group, {
        name: `personal-${userId}`,
        isSystem: false,
      });
      const groupId = groupInsert.identifiers[0].id as string;

      await manager.insert(UserGroup, {
        userId,
        groupId,
      });

      this.logger.log({ userId, groupId }, 'User created with default group');

      return manager.findOneByOrFail(User, { id: userId });
    });
  };

  async updateProfile(userID: string, dto: UpdateUserDto): Promise<UpdateUserResponseDto> {
    this.logger.log('Execute updateProfile', userID);

    const user = await this.usersRepository.findOneBy({id: userID,});
    if (!user) {
      this.logger.warn(`UpdateProfile failed, user ${userID} not found`);
      throw new ApplicationException (
        ErrorCode.UserNotFound
      )
    }
    if(dto.email !== undefined)
    {
      const newEmail = dto.email?.trim().toLowerCase();
      const duplicate = await this.usersRepository.findOneBy({email: newEmail});
      if (duplicate) {
        this.logger.warn(`UpdateProfile failed for ${userID}, email already registered`);
        throw new ApplicationException(
          ErrorCode.EmailAlreadyRegistered
        )
      }
      user.email = newEmail;
    };

    if(dto.displayName !== undefined)
    {
      const newName = dto.displayName.trim();
      const duplicate = await this.usersRepository.findOneBy({displayName: newName});
      if(duplicate) {
        this.logger.warn(`UpdateProfile failed for ${userID}, display name already registered`);
        throw new ApplicationException(
          ErrorCode.UserNameAlreadyRegistered
        )
      }
    }
    if(dto.preferredLanguage !==undefined)
    {
      const newLang = dto.preferredLanguage?.trim();
    }

    Object.assign(user,dto);
    const updatedUser = await this.usersRepository.save(user)
    this.logger.log({ userId: updatedUser.id }, 'Profile updated successfully');
    ///return { id: updatedUser.id };
    return {
      id: updatedUser.id}

  };

  //async updatePasswd(userID: stringify, dto )

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({email: email});
  }

  async findByName(name: string): Promise<User | null> {
    return this.usersRepository.findOneBy({displayName: name})
  }

  async findProfileById(userId: string): Promise <UserSummaryDto> {
    this.logger.log('Execute findProfileById', userId);
    const user = await this.usersRepository.findOne({
      where: { id: userId},
      select: {
        id: true,
        email: true,
        displayName : true,
        preferredLanguage: true,
        isActive: true,
      }
    })
    if(!user) {
      this.logger.warn(`FindProfileById failed, user ${userId} not found`);
      throw new ApplicationException(
      ErrorCode.UserNotFound,
    )
    }
    return user;
  }

  async getAllUsers(request: GetUsersQueryDto): Promise<GetUsersResponseDto> {
    const { page, limit } = request;
    this.logger.log({ page, limit }, 'Execute getAllUsers');

    const [users, total] = await this.usersRepository.findAndCount({
      select: {
        id: true,
        email: true,
        displayName: true,
        preferredLanguage: true,
        isActive: true,
        lastLoginAt:true,
        //avatar: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    this.logger.log({ total }, 'Users listed successfully');
    return {
      data: users,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}

