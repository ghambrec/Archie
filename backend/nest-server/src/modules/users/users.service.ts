import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserResponseDto } from './dto/create-user-response.dto';
import { UpdateUserResponseDto } from './dto/update-user-response.dto';

const PASSWORD_SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<CreateUserResponseDto> {
    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);

    const userEntity = this.usersRepository.create({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
    });

    await this.usersRepository.save(userEntity);

    return { id: userEntity.id };
  };

  async updateProfile(userID: string, dto: UpdateUserResponseDto): Promise<UpdateUserResponseDto> {

    const user = await this.usersRepository.findOneBy({id: userID,});
    if (!user) {
      throw new NotFoundException('User not found');
    }

    
    Object.assign(user,dto);
    const updatedUser = await this.usersRepository.save(user)
    ///return { id: updatedUser.id };
    return {
      id: updatedUser.id}

  };

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({email: email});
  }

  async findByName(name: string): Promise<User | null> {
    return this.usersRepository.findOneBy({displayName: name})
  }
}

