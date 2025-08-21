import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { User } from "./user.model";
import { Sequelize } from "sequelize-typescript";

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
export class UserService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    private sequelize: Sequelize
  ) {}

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

  async createBulkUsers(createUsersDto: CreateUserDto[]): Promise<User[]> {
    // ✨ Bulk create with automatic audit tracking!
    return this.userModel.bulkCreate(createUsersDto as any[]);
  }

  async updateBulkUsers(
    where: any,
    values: UpdateUserDto
  ): Promise<{ affectedRows: number }> {
    // ✨ Bulk update with automatic audit tracking!
    const [affectedRows] = await this.userModel.update(values, { where });
    return { affectedRows };
  }

  async deleteBulkUsers(where: any): Promise<{ affectedRows: number }> {
    // ✨ Bulk delete with automatic audit tracking!
    const affectedRows = await this.userModel.destroy({ where });
    return { affectedRows };
  }

  async getAuditRecords(): Promise<any[]> {
    // Query audit records to demonstrate the bulk operations
    const [results] = await this.sequelize.query(`
      SELECT 
        id,
        event,
        auditable_type,
        auditable_id,
        actorable_type,
        actorable_id,
        JSON_EXTRACT(tags, '$.bulkOperation') as is_bulk_operation,
        JSON_EXTRACT(tags, '$.affectedCount') as affected_count,
        JSON_EXTRACT(new_values, '$.name') as user_name,
        created_at
      FROM audits 
      WHERE auditable_type = 'User'
      ORDER BY id DESC 
      LIMIT 20
    `);
    return results as any[];
  }
}
