import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService, CreateUserDto, UpdateUserDto } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(AuthGuard('jwt')) // 🔐 JWT Authentication Required
  async createUser(@Body() createUserDto: CreateUserDto) {
    // ✨ No manual user_id - automatically captured by audit package!
    return this.userService.createUser(createUserDto);
  }

  @Post('no-auth')
  async createUserNoAuth(
    @Body() createUserDto: CreateUserDto,
    @Query('acting_user_id') actingUserId?: string,
  ) {
    // Keep old manual method for comparison
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
  @UseGuards(AuthGuard('jwt')) // 🔐 JWT Authentication Required
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // ✨ No manual user_id - automatically captured by audit package!
    return this.userService.updateUser(parseInt(id, 10), updateUserDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt')) // 🔐 JWT Authentication Required
  async deleteUser(@Param('id') id: string) {
    // ✨ No manual user_id - automatically captured by audit package!
    const deleted = await this.userService.deleteUser(parseInt(id, 10));
    return { deleted };
  }
}