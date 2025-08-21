import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Post } from "./post.model";

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post)
    private postModel: typeof Post
  ) {}

  async findAll(): Promise<Post[]> {
    return this.postModel.findAll();
  }

  async findOne(id: number): Promise<Post | null> {
    return this.postModel.findByPk(id);
  }

  async findOneWithAudits(id: number): Promise<Post | null> {
    return this.postModel.findByPk(id, {
      include: ["audits", "creationAudit"],
    });
  }

  async findOneWithCreator(id: number): Promise<Post | null> {
    return this.postModel.findByPk(id, {
      include: ["creator"],
    });
  }

  async create(postData: Partial<Post>): Promise<Post> {
    return this.postModel.create(postData);
  }

  async update(id: number, postData: Partial<Post>): Promise<[number, Post[]]> {
    return this.postModel.update(postData, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return this.postModel.destroy({
      where: { id },
    });
  }
}
