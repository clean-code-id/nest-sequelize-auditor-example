import {
  Controller,
  Get,
  Post as HttpPost,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { PostService } from "./post.service";
import { Post } from "./post.model";

@Controller("posts")
@UseGuards(AuthGuard("jwt"))
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async findAll(): Promise<Post[]> {
    return this.postService.findAll();
  }

  @Get(":id")
  async findOne(@Param("id") id: string): Promise<Post> {
    return this.postService.findOne(+id);
  }

  @Get(":id/with-audits")
  async findOneWithAudits(@Param("id") id: string): Promise<Post> {
    return this.postService.findOneWithAudits(+id);
  }

  @Get(":id/with-creator")
  async findOneWithCreator(@Param("id") id: string): Promise<Post> {
    return this.postService.findOneWithCreator(+id);
  }

  @HttpPost()
  async create(
    @Body()
    createPostDto: { title: string; content?: string; published?: boolean },
    @Request() req: any
  ): Promise<Post> {
    return this.postService.create(createPostDto);
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() updatePostDto: Partial<Post>
  ): Promise<[number, Post[]]> {
    return this.postService.update(+id, updatePostDto);
  }

  @Delete(":id")
  async delete(@Param("id") id: string): Promise<{ deleted: number }> {
    const deleted = await this.postService.delete(+id);
    return { deleted };
  }
}
