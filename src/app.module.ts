import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RequestContextInterceptor, AuditModule } from '@cleancode-id/nestjs-sequelize-auditor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        dialect: configService.get('DATABASE_DIALECT', 'mysql'),
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: parseInt(configService.get('DATABASE_PORT', '3306')),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASS'),
        database: configService.get('DATABASE_NAME'),
        autoLoadModels: true,
        synchronize: true,
        logging: console.log,
      }),
      inject: [ConfigService],
    }),
    
    // 🎉 ONE-LINE AUDIT SETUP! No more manual audit model creation
    AuditModule.forRoot({
      autoSync: true,        // Auto-create audit table
      alterTable: false,     // Don't alter existing table
      isGlobal: true,        // Make it globally available
    }),
    
    UserModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestContextInterceptor,
    },
  ],
})
export class AppModule {}