import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { UserService, CreateUserDto, UpdateUserDto } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @Query('acting_user_id') actingUserId?: string,
  ) {
    const userId = actingUserId ? parseInt(actingUserId, 10) : undefined;
    return this.userService.createUser(createUserDto, userId);
  }

  @Get()
  async getAllUsers() {
    return this.userService.findAll();
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.userService.findById(parseInt(id, 10));
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Query('acting_user_id') actingUserId?: string,
  ) {
    const userId = actingUserId ? parseInt(actingUserId, 10) : undefined;
    return this.userService.updateUser(parseInt(id, 10), updateUserDto, userId);
  }

  @Delete(':id')
  async deleteUser(
    @Param('id') id: string,
    @Query('acting_user_id') actingUserId?: string,
  ) {
    const userId = actingUserId ? parseInt(actingUserId, 10) : undefined;
    const deleted = await this.userService.deleteUser(parseInt(id, 10), userId);
    return { deleted };
  }
}