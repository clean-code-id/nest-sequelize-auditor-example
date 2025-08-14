import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Audit } from './audit.model';
import { AuditService } from './audit.service';

@Module({
  imports: [SequelizeModule.forFeature([Audit])],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}