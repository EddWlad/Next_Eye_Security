import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { hasPaginationQuery } from '../../common/utils/pagination.util';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMINISTRADOR)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return this.usersService.sanitize(user);
  }

  @Get()
  @Roles(Role.ADMINISTRADOR)
  async findAll(@Query() query: PaginationQueryDto) {
    if (hasPaginationQuery(query)) {
      const paginated = await this.usersService.findAllPaginated(query);
      return {
        ...paginated,
        items: paginated.items.map((user) => this.usersService.sanitize(user)),
      };
    }

    const users = await this.usersService.findAll();
    return users.map((user) => this.usersService.sanitize(user));
  }

  @Get('me')
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  async me(@Req() req: { user: { sub: string } }) {
    const user = await this.usersService.findOne(req.user.sub);
    return this.usersService.sanitize(user);
  }

  @Get(':id')
  @Roles(Role.ADMINISTRADOR)
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return this.usersService.sanitize(user);
  }

  @Patch('me/profile')
  @Roles(Role.ADMINISTRADOR, Role.TECNICO)
  async updateProfile(
    @Req() req: { user: { sub: string } },
    @Body() updateUserDto: UpdateUserDto,
  ) {
    delete updateUserDto.role;
    const user = await this.usersService.update(req.user.sub, updateUserDto);
    return this.usersService.sanitize(user);
  }

  @Patch(':id')
  @Roles(Role.ADMINISTRADOR)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    return this.usersService.sanitize(user);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRADOR)
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'Usuario eliminado correctamente' };
  }
}
