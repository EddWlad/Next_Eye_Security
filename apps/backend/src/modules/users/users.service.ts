import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import {
  buildPaginatedResponse,
  resolvePagination,
} from '../../common/utils/pagination.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const exists = await this.usersRepository.findOne({
      where: { email: createUserDto.email.toLowerCase() },
    });
    if (exists) {
      throw new BadRequestException('El email ya está registrado');
    }

    const user = this.usersRepository.create({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      password: await bcrypt.hash(createUserDto.password, 10),
      active: createUserDto.active ?? true,
    });

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findAllPaginated(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<User>> {
    const { page, limit, skip } = resolvePagination(query, 10);
    const [items, total] = await this.usersRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return buildPaginatedResponse(items, total, page, limit);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const exists = await this.usersRepository.findOne({
        where: { email: updateUserDto.email.toLowerCase() },
      });
      if (exists) {
        throw new BadRequestException('El email ya está registrado');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const payload: Partial<User> = {
      ...updateUserDto,
      email: updateUserDto.email?.toLowerCase() ?? user.email,
    };

    Object.assign(user, payload);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  sanitize(user: User): Omit<User, 'password'> {
    const safeUser = { ...user } as Partial<User>;
    delete safeUser.password;
    return safeUser as Omit<User, 'password'>;
  }
}
