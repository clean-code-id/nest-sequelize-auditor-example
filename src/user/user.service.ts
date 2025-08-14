import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { attachAuditHooks } from '@clean-code-id/nest-sequelize-auditor';

export interface CreateUserDto {
  name: string;
  email: string;
  phone?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  phone?: string;
}

@Injectable()
export class UserService implements OnModuleInit {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  onModuleInit() {
    // 🎉 COMPLETELY SEAMLESS! 
    // - No audit model setup needed
    // - No setAuditModel() calls needed  
    // - Just attach hooks and everything auto-initializes!
    attachAuditHooks(this.userModel, {
      exclude: ['createdAt', 'updatedAt'],
    });
  }

  async createUser(createUserDto: CreateUserDto, userId?: number): Promise<User> {
    // Just use Sequelize - audit hooks handle everything automatically!
    return this.userModel.create(createUserDto as any);
  }

  async findAll(): Promise<User[]> {
    return this.userModel.findAll();
  }

  async findById(id: number): Promise<User | null> {
    return this.userModel.findByPk(id);
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto, userId?: number): Promise<User | null> {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      return null;
    }

    // Just update - audit hooks handle everything automatically!
    await user.update(updateUserDto);
    return user;
  }

  async deleteUser(id: number, userId?: number): Promise<boolean> {
    // Find instance first so hooks can access the data
    const user = await this.userModel.findByPk(id);
    if (!user) {
      return false;
    }

    // Now destroy the instance - audit hooks handle everything automatically!
    await user.destroy();
    return true;
  }
}