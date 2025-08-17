import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { User } from "./user.model";
import {
  attachAuditHooks,
  AuditEvent,
} from "@cleancode-id/nestjs-sequelize-auditor";

export interface CreateUserDto {
  name: string;
  email: string;
  phone?: string;
  password: string;
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
    private userModel: typeof User
  ) {}

  onModuleInit() {
    // Just attach hooks and everything auto-initializes!
    attachAuditHooks(this.userModel, {
      // exclude fields from audit
      exclude: ["id", "createdAt", "updatedAt"],

      // Mask sensitive fields
      mask: ["password"],

      // Selective audit events
      auditEvents: [AuditEvent.CREATED, AuditEvent.UPDATED, AuditEvent.DELETED],

      // 🆕 PER-MODEL OVERRIDE: Even though global onlyDirty=true,
      // this User model will log FULL state (for compliance/legal reasons)
      onlyDirty: false,
    });
  }

  async createUser(
    createUserDto: CreateUserDto,
    userId?: number
  ): Promise<User> {
    // ✨ Audit package automatically captures authenticated user from JWT!
    // No manual userId needed - the audit hooks get it from request context
    return this.userModel.create(createUserDto as any);
  }

  async findAll(): Promise<User[]> {
    return this.userModel.findAll();
  }

  async findById(id: number): Promise<User | null> {
    return this.userModel.findByPk(id);
  }

  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
    userId?: number
  ): Promise<User | null> {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      return null;
    }

    // ✨ Audit package automatically captures authenticated user from JWT!
    await user.update(updateUserDto);
    return user;
  }

  async deleteUser(id: number, userId?: number): Promise<boolean> {
    // Find instance first so hooks can access the data
    const user = await this.userModel.findByPk(id);
    if (!user) {
      return false;
    }

    // ✨ Audit package automatically captures authenticated user from JWT!
    await user.destroy();
    return true;
  }
}
