import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserResponseDto } from './dto/create-user-response.dto';
import { UpdateUserResponseDto } from './dto/update-user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserSummaryDto } from './dto/user-summary.dto';
import { ApplicationException } from 'src/common/errors/application.exception';
import { ErrorCode } from 'src/common/errors/error-code';


const PASSWORD_SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  

  async create(dto: CreateUserDto): Promise<User> {
    const MailExisting = await this.findByEmail(dto.email)
    if(MailExisting)
      throw new ApplicationException(
      ErrorCode.EmailAlreadyRegistered,
    )
    const DisplayNameExisting = await this.findByName(dto.displayName)
    if(DisplayNameExisting)
      throw new ApplicationException(
        ErrorCode.UserNameAlreadyRegistered,
      )
    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);

    const userEntity = this.usersRepository.create({
      email: dto.email.trim().toLowerCase(),
      passwordHash,
      displayName: dto.displayName,
    });

    await this.usersRepository.save(userEntity);

    return userEntity;
  };

  async updateProfile(userID: string, dto: UpdateUserDto): Promise<UpdateUserResponseDto> {

    const user = await this.usersRepository.findOneBy({id: userID,});
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if(dto.email !== undefined)
    {
      const newEmail = dto.email?.trim().toLowerCase();
      const duplicate = await this.usersRepository.findOneBy({email: newEmail});
      if (duplicate)
        throw new ApplicationException(
          ErrorCode.EmailAlreadyRegistered
        )
      user.email = newEmail; 
    };

    if(dto.displayName !== undefined)
    {
      const newName = dto.displayName.trim();
      const duplicate = await this.usersRepository.findOneBy({displayName: newName});
      if(duplicate)
        throw new ApplicationException(
          ErrorCode.UserNameAlreadyRegistered
        )
    }
    //if(dto.preferredLanguage !==undefined)
    //{
    //  const newLang = dto.displayName?.trim();
    //  const langExists = await this
    //}
  
  
    
    Object.assign(user,dto);
    const updatedUser = await this.usersRepository.save(user)
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
    if(!user)
      throw new ApplicationException(
      ErrorCode.UserNotFound,
    )
    return user;
  }
}

