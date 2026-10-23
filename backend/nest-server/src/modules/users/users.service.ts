import { Injectable, NotFoundException, ConflictException, ForbiddenException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Like, Not, Repository } from 'typeorm';
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
import { UsersFileService } from './users-file.service';
import { ADMIN_PERMISSION_KEY, PermissionsService } from '../permissions/permissions.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Permission } from '../permissions/entities/permission.entity';
import { UserPermission } from '../user_permission/entities/user_permission.entity';
import { SessionService } from '../auth/session/session.service';


const PASSWORD_SALT_ROUNDS = 10;

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  constructor(
    private readonly logger: Logger,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
	private readonly usersFileService: UsersFileService,
	private readonly permissionsService: PermissionsService,
    private readonly sessionService: SessionService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
	const usersWithoutAvatar: Array<{ id: string; display_name: string }> = 
		await this.usersRepository.query(`SELECT id, display_name FROM users WHERE avatar_object_key IS NULL AND deleted_at IS NULL`);

	for (const user of usersWithoutAvatar) {
		try {
			let seed = user.display_name;
			if (seed === 'Admin') {
				seed = 'Administrator';
			}
			await this.usersFileService.setDefaultAvatar(user.id, seed);
		} catch (error) {
			this.logger.warn(`Default avatar creation on app start failed for user ${user.id}`, error);
		}
	}
  }

  async create(dto: CreateUserDto, mustChangePassword: boolean): Promise<User> {
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

    const user = await this.dataSource.transaction(async (manager) => {
      const userInsert = await manager.insert(User, {
        email: dto.email.trim().toLowerCase(),
        passwordHash,
        mustChangePassword,
        displayName: dto.displayName,
      });
      const userId = userInsert.identifiers[0].id as string;
	  const personalGroupSuffix = dto.displayName.trim().toLowerCase();

      const groupInsert = await manager.insert(Group, {
        name: `personal-${personalGroupSuffix}`,
        isSystem: false,
      });
      const groupId = groupInsert.identifiers[0].id as string;

      await manager.insert(UserGroup, {
        userId,
        groupId,
      });

	  const documentPermissions = await manager.find(Permission, {
		where: { permKey: Like('documents.%') }
	  });
	  if (documentPermissions.length > 0) {
		await manager.insert(
			UserPermission,
			documentPermissions.map((permission) => ({
				userId,
				groupId,
				permissionId: permission.id
			}))
		);
	  }

      this.logger.log({ userId, groupId }, 'User created with default group');

      return manager.findOneByOrFail(User, { id: userId });
    });

	// set default avatar
	try {
		await this.usersFileService.setDefaultAvatar(user.id, user.displayName);
	} catch (error) {
		this.logger.warn(`Default avatar generation failed for user ${user.id}`, error);
	}

	return user;
  };

  async softDeleteUser(actorId: string, userId: string): Promise<void> {
    if (actorId === userId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    try {
      await this.dataSource.transaction('SERIALIZABLE', async (manager) => {
        const user = await manager.findOneBy(User, { id: userId });
        if (!user) throw new ApplicationException(ErrorCode.UserNotFound);

        // Re-check admin status inside the transaction to handle concurrent deletions.
        const admins: Array<{ id: string }> = await manager.query(
          `SELECT u.id FROM users AS u
           WHERE u.deleted_at IS NULL AND u.is_active = true
             AND EXISTS (
               SELECT 1 FROM user_permission AS up
               JOIN permissions AS p ON p.id = up.permission_id
               WHERE up.user_id = u.id AND p.perm_key = $1
             )`,
          [ADMIN_PERMISSION_KEY],
        );
        if (admins.some(admin => admin.id === userId) && admins.length <= 1) {
          throw new ConflictException('Cannot delete the last active admin');
        }
        if (!admins.some(admin => admin.id === actorId)) {
          throw new ForbiddenException('An active admin account is required');
        }

        await manager.update(User, userId, { isActive: false });
        await manager.softDelete(User, userId);
      });
    } catch (error) {
      if ((error as { driverError?: { code?: string } }).driverError?.code === '40001') {
        throw new ConflictException('User state changed during deletion. Please try again.');
      }
      throw error;
    }

    try {
      await this.permissionsService.invalidateUserPermissions(userId);
    } catch (error) {
      this.logger.warn({ userId, error }, 'Could not invalidate deleted user permissions');
    }
    this.logger.log({ actorId, userId }, 'User soft deleted');
  }

  async restoreUser(userId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: userId },
        withDeleted: true,
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new ApplicationException(ErrorCode.UserNotFound);
      if (user.deletedAt === null) {
        throw new ConflictException('User is not deleted');
      }

      // Both Redis operations must succeed before the account becomes accessible.
      await this.sessionService.destroyAllForUser(userId);
      await this.permissionsService.invalidateUserPermissions(userId);
      await manager.update(User, userId, { deletedAt: null, isActive: true });
    });
    this.logger.log({ userId }, 'User restored');
  }

   async updateProfile(actorUserId: string, userID: string, dto: UpdateUserDto): Promise<UpdateUserResponseDto> {
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
      user.displayName = newName;
    }
    if(dto.preferredLanguage !==undefined)
    {
      user.preferredLanguage = dto.preferredLanguage;
    }
    if(dto.password !==undefined)
    {
      await this.applyPasswordChange(user, actorUserId, dto.password);
    }

    const updatedUser = await this.usersRepository.save(user)
    this.logger.log({ userId: updatedUser.id }, 'Profile updated successfully');
    return {
      id: updatedUser.id}

  };

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({email: email});
  }

  async findByName(name: string): Promise<User | null> {
    return this.usersRepository.findOneBy({displayName: name})
  }

  async findProfileById(userId: string): Promise<UserSummaryDto> {
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
    )}

	const isAdmin = await this.permissionsService.isUserAdmin(userId);
    return {...user, isAdmin};
  }

  async getDeletedUsers(request: GetUsersQueryDto): Promise<GetUsersResponseDto> {
    const { page, limit } = request;
    const [users, total] = await this.usersRepository.findAndCount({
      withDeleted: true,
      where: { deletedAt: Not(IsNull()) },
      select: {
        id: true,
        email: true,
        displayName: true,
        preferredLanguage: true,
        isActive: true,
        lastLoginAt: true,
        deletedAt: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      order: { deletedAt: 'DESC', id: 'ASC' },
    });

    return {
      data: users,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
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
        lastLoginAt: true,
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

  async changeOwnPassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    this.logger.log('Execute changeOwnPassword', userId);

    const user = await this.usersRepository.findOneBy({ id: userId });

    if (!user) {
      this.logger.warn(`Password change failed, user ${userId} not found`);
      throw new NotFoundException();
    }

    await this.applyPasswordChange(user, userId, dto.password);

    await this.usersRepository.save(user);
    this.logger.log({ userId: user.id }, 'User changed password successfully');
  }

  async resetPassword(actorUserId: string, userId: string, dto: ChangePasswordDto): Promise<void> {
    this.logger.log('Execute resetPassword', userId);

    const user = await this.usersRepository.findOneBy({ id: userId });

    if (!user) {
      this.logger.warn(`Password reset failed, user ${userId} not found`);
      throw new NotFoundException();
    }

    await this.applyPasswordChange(user, actorUserId, dto.password);

    await this.usersRepository.save(user);
    this.logger.log({ userId: user.id }, 'Admin reset user password successfully');
  }

  async findById(userId: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id: userId });
  }

  private async applyPasswordChange(user: User, actorUserId: string, password: string): Promise<void> {
    const changesAnotherUser = actorUserId !== user.id;
    if (changesAnotherUser && !(await this.permissionsService.isUserAdmin(actorUserId))) {
      throw new ForbiddenException('An admin account is required to reset another user password');
    }
    user.passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    user.mustChangePassword = changesAnotherUser;
  }

  async recordSuccessfulLogin(userId: string, lastLoginAt: Date): Promise<void> {
    await this.usersRepository.update(userId, { lastLoginAt });
  }
}

