import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuditModule } from "@cleancode-id/nestjs-sequelize-auditor";
import { UserModule } from "./user/user.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        dialect: configService.get("DATABASE_DIALECT", "mysql"),
        host: configService.get("DATABASE_HOST", "localhost"),
        port: parseInt(configService.get("DATABASE_PORT", "3306")),
        username: configService.get("DATABASE_USER"),
        password: configService.get("DATABASE_PASS"),
        database: configService.get("DATABASE_NAME"),
        autoLoadModels: true,
        synchronize: true,
        logging: console.log,
      }),
      inject: [ConfigService],
    }),

    // 🎉 ONE-LINE AUDIT SETUP with Passport Authentication Support!
    AuditModule.forRoot({
      autoSync: true, // Auto-create audit table
      alterTable: false, // Don't alter existing table
      isGlobal: true, // Make it globally available
      auth: {
        type: "passport", // Use Passport.js authentication
        userProperty: "user", // Default: 'user' (req.user)
        userIdField: "user_id", // For your friend's case: req.user.user_id
        // userIdField: 'id',   // Standard case: req.user.id
        // userIdField: 'sub',  // JWT standard: req.user.sub
      },
    }),

    AuthModule,
    UserModule,
  ],
  providers: [
    // RequestContextInterceptor moved to AuditModule - it's auto-registered globally
  ],
})
export class AppModule {}
