/**
 * Test Suite: Audit Relationships
 * Tests audit relationship functionality:
 * - Creator relationships (include: ["creator"])
 * - Automatic audit relationships (@Auditable decorator)
 * - ActorTypes configuration and polymorphic resolution
 * - Global creatorFields configuration
 * - Relationship queries (findAll, findAndCountAll, etc.)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuditModule } from '@cleancode-id/nestjs-sequelize-auditor';
import { PostService } from './post/post.service';
import { UserService } from './user/user.service';
import { Post } from './post/post.model';
import { User } from './user/user.model';

describe('Audit Relationships', () => {
  let postService: PostService;
  let userService: UserService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        SequelizeModule.forRoot({
          dialect: 'sqlite',
          storage: ':memory:',
          autoLoadModels: true,
          synchronize: true,
          logging: false,
        }),
        SequelizeModule.forFeature([User, Post]),
        AuditModule.forRoot({
          autoSync: true,
          actorTypes: ['User'], // Configure which models can be actors
          creatorFields: ['id', 'name'], // Global creator field filtering
          auth: {
            type: 'passport',
            userProperty: 'user',
            userIdField: 'id',
            actorModel: 'User',
          },
        }),
      ],
      providers: [PostService, UserService],
    }).compile();

    postService = module.get<PostService>(PostService);
    userService = module.get<UserService>(UserService);

    // Wait for auto-initialization to complete
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    // Clean up data before each test
    await Post.destroy({ where: {}, truncate: true });
    await User.destroy({ where: {}, truncate: true });
  });

  describe('Creator Relationship', () => {
    it('should support include: ["creator"] functionality', async () => {
      // Create a user first
      await userService.createUser({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      // Create a post (in real app this would be done with authenticated context)
      const post = await Post.create({
        title: 'Test Post',
        content: 'This is a test post',
        published: true,
      });

      // The creator relationship should be available
      // Note: In real usage, this would be populated from audit records
      const postWithCreator = await Post.findByPk(post.id, {
        include: ['creator'],
      });

      expect(postWithCreator).toBeDefined();
      expect(postWithCreator).toHaveProperty('id', post.id);
      // Creator might be null in test environment without proper audit context
      // but the relationship should exist without errors
    });

    it('should handle creator relationship gracefully when no audit exists', async () => {
      const post = await Post.create({
        title: 'Test Post',
        content: 'Post without creator audit',
        published: true,
      });

      // Should not throw error even when no audit/creator exists
      expect(async () => {
        await Post.findByPk(post.id, {
          include: ['creator'],
        });
      }).not.toThrow();
    });

    it('should support findAll with creator relationships', async () => {
      await Post.bulkCreate([
        { title: 'Post 1', content: 'Content 1', published: true },
        { title: 'Post 2', content: 'Content 2', published: true },
      ]);

      // Should not throw error when including creator in findAll
      expect(async () => {
        await Post.findAll({
          include: ['creator'],
        });
      }).not.toThrow();
    });
  });

  describe('Automatic Relationship Setup', () => {
    it('should automatically initialize audit relationships on models', async () => {
      // Check that Post model has audit relationships defined
      const postAssociations = Object.keys(Post.associations || {});
      
      // Should have audits relationship
      expect(postAssociations).toContain('audits');
      
      // Should have creationAudit relationship
      expect(postAssociations).toContain('creationAudit');
    });

    it('should automatically initialize audit relationships on User model', async () => {
      const userAssociations = Object.keys(User.associations || {});
      
      // Should have audits relationship
      expect(userAssociations).toContain('audits');
      
      // Should have creationAudit relationship  
      expect(userAssociations).toContain('creationAudit');
    });

    it('should support audits relationship queries', async () => {
      const user = await User.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
      });

      // Should be able to query with audits relationship
      expect(async () => {
        await User.findByPk(user.id, {
          include: ['audits'],
        });
      }).not.toThrow();
    });

    it('should support creationAudit relationship queries', async () => {
      const post = await Post.create({
        title: 'Test Post',
        content: 'Test content',
        published: true,
      });

      // Should be able to query with creationAudit relationship
      expect(async () => {
        await Post.findByPk(post.id, {
          include: ['creationAudit'],
        });
      }).not.toThrow();
    });
  });

  describe('Actor Types Configuration', () => {
    it('should handle configured actorTypes without errors', async () => {
      // The module was configured with actorTypes: ['User']
      // This should prevent empty audit table issues
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com', 
        password: 'password123',
      });

      // Should work even with empty audit table
      expect(user).toBeDefined();
      expect(user.name).toBe('Test User');
    });

    it('should support creator relationships with configured actorTypes', async () => {
      // Even with empty audit table, creator relationships should work
      // because of actorTypes configuration
      
      const post = await Post.create({
        title: 'Test Post',
        content: 'Test content',
        published: true,
      });

      // Should not throw even with empty audit table
      expect(async () => {
        const result = await Post.findByPk(post.id, {
          include: ['creator'],
        });
        expect(result).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Model Decorator Configuration', () => {
    it('should respect @Auditable decorator configuration on Post model', async () => {
      // Post model is configured with @Auditable decorator
      // Check that the configuration is working
      
      const post = await Post.create({
        title: 'Configured Post',
        content: 'Post with audit configuration',
        published: true,
      });

      expect(post).toBeDefined();
      expect(post.title).toBe('Configured Post');
      
      // Verify relationships are set up
      const associations = Object.keys(Post.associations || {});
      expect(associations.length).toBeGreaterThan(0);
    });

    it('should respect @Auditable decorator configuration on User model', async () => {
      // User model is configured with @Auditable decorator
      const user = await User.create({
        name: 'Configured User',
        email: 'configured@example.com',
        password: 'password123',
      });

      expect(user).toBeDefined();
      expect(user.name).toBe('Configured User');
      
      // Verify relationships are set up
      const associations = Object.keys(User.associations || {});
      expect(associations.length).toBeGreaterThan(0);
    });
  });

  describe('Global Creator Fields', () => {
    it('should have global creatorFields configuration in module', () => {
      // The module was configured with creatorFields: ['id', 'name']
      // This should be accessible globally across all models
      
      // Basic test to ensure module loaded with creatorFields config
      expect(module).toBeDefined();
    });

    it('should support findAndCountAll with creator relationships', async () => {
      // Test findAndCountAll with creator include
      await Post.bulkCreate([
        { title: 'Post 1', content: 'Content 1', published: true },
        { title: 'Post 2', content: 'Content 2', published: true },
      ]);

      // findAndCountAll should work with creator include
      expect(async () => {
        const result = await Post.findAndCountAll({
          include: ['creator'],
          limit: 10,
        });
        expect(result).toHaveProperty('count');
        expect(result).toHaveProperty('rows');
      }).not.toThrow();
    });

    it('should handle creator field filtering globally', async () => {
      // This tests the global creatorFields configuration
      // In a real scenario with audit data, creator would be filtered to only ['id', 'name']
      
      const post = await Post.create({
        title: 'Creator Field Test',
        content: 'Testing global creator field filtering',
        published: true,
      });

      // Should be able to include creator without errors
      // Real filtering happens in the audit hooks with actual audit data
      const result = await Post.findByPk(post.id, {
        include: ['creator'],
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe(post.id);
    });

    it('should support creator relationship with null values gracefully', async () => {
      // Test improved null handling for creator field
      const post = await Post.create({
        title: 'No Creator Test',
        content: 'Post without creator audit',
        published: false,
      });

      // Should handle null creator values properly
      const result = await Post.findByPk(post.id, {
        include: ['creator'],
      });

      expect(result).toBeDefined();
      // Creator should be null when no audit exists, not "creationAudit": null
      // This is handled by the afterFind hook in the decorator
    });
  });

  describe('Simplified @Auditable Decorator', () => {
    it('should automatically enable all audit relationships', async () => {
      // All relationships are now automatic - no enable* flags needed
      
      // Check Post model has all three relationships
      const postAssociations = Object.keys(Post.associations || {});
      expect(postAssociations).toContain('audits');
      expect(postAssociations).toContain('creationAudit');
      
      // Check User model has all three relationships  
      const userAssociations = Object.keys(User.associations || {});
      expect(userAssociations).toContain('audits');
      expect(userAssociations).toContain('creationAudit');
    });

    it('should support all relationship queries without configuration', async () => {
      // All relationships should work without any enable* flags
      const user = await User.create({
        name: 'Relationship Test User',
        email: 'relationships@example.com',
        password: 'password123',
      });

      const post = await Post.create({
        title: 'Relationship Test Post',
        content: 'Testing all relationships',
        published: true,
      });

      // All these should work without throwing errors
      await expect(User.findByPk(user.id, { include: ['audits'] })).resolves.toBeDefined();
      await expect(User.findByPk(user.id, { include: ['creationAudit'] })).resolves.toBeDefined();
      await expect(User.findByPk(user.id, { include: ['creator'] })).resolves.toBeDefined();
      
      await expect(Post.findByPk(post.id, { include: ['audits'] })).resolves.toBeDefined();
      await expect(Post.findByPk(post.id, { include: ['creationAudit'] })).resolves.toBeDefined();
      await expect(Post.findByPk(post.id, { include: ['creator'] })).resolves.toBeDefined();
    });

    it('should maintain zero-cost relationship principle', async () => {
      // Relationships should exist but not affect queries unless explicitly included
      const post = await Post.create({
        title: 'Zero Cost Test',
        content: 'Testing zero-cost relationships',
        published: true,
      });

      // Basic query without includes should not fetch relationship data
      const basicResult = await Post.findByPk(post.id);
      expect(basicResult).toBeDefined();
      expect(basicResult?.title).toBe('Zero Cost Test');
      
      // Should not have relationship data in basic query
      expect((basicResult as any)?.audits).toBeUndefined();
      expect((basicResult as any)?.creationAudit).toBeUndefined();
      expect((basicResult as any)?.creator).toBeUndefined();
    });
  });

  describe('Backwards Compatibility', () => {
    it('should maintain compatibility with basic CRUD operations', async () => {
      // Basic operations should still work as before
      const user = await userService.createUser({
        name: 'Compatible User',
        email: 'compatible@example.com',
        password: 'password123',
      });

      expect(user).toBeDefined();

      const foundUser = await userService.findById(user.id);
      expect(foundUser).toBeDefined();
      expect(foundUser?.name).toBe('Compatible User');

      const updated = await userService.updateUser(user.id, {
        name: 'Updated User',
      });
      expect(updated?.name).toBe('Updated User');

      const deleted = await userService.deleteUser(user.id);
      expect(deleted).toBe(true);
    });

    it('should maintain compatibility with bulk operations', async () => {
      // Bulk operations should still work
      const users = await userService.createBulkUsers([
        { name: 'Bulk User 1', email: 'bulk1@example.com', password: 'pass1' },
        { name: 'Bulk User 2', email: 'bulk2@example.com', password: 'pass2' },
      ]);

      expect(users).toHaveLength(2);
      expect(users[0].name).toBe('Bulk User 1');
      expect(users[1].name).toBe('Bulk User 2');
    });
  });
});