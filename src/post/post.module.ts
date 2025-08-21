import { Module, OnModuleInit } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Post } from "./post.model";
import { PostService } from "./post.service";
import { PostController } from "./post.controller";
import { User } from "../user/user.model";

@Module({
  imports: [SequelizeModule.forFeature([Post, User])],
  providers: [PostService],
  controllers: [PostController],
  exports: [PostService],
})
export class PostModule implements OnModuleInit {
  onModuleInit() {
    // Associations are now handled by decorators in the model
  }
}