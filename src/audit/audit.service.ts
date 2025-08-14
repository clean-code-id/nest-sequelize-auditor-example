import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Audit } from './audit.model';

export interface WriteAuditOptions {
  event: 'create' | 'update' | 'delete' | 'restore';
  table: string;
  recordId: string | number;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  userId?: string | number;
  ip?: string;
  userAgent?: string;
  url?: string;
  tags?: Record<string, any>;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(Audit)
    private auditModel: typeof Audit,
  ) {}

  async writeAudit(options: WriteAuditOptions): Promise<void> {
    try {
      await this.auditModel.create({
        event: options.event,
        table: options.table,
        recordId: options.recordId,
        oldValues: options.oldValues,
        newValues: options.newValues,
        userId: options.userId,
        ip: options.ip,
        userAgent: options.userAgent,
        url: options.url,
        tags: options.tags,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to write audit record:', error);
    }
  }
}