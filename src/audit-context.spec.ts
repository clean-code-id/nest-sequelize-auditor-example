/**
 * Test 1: RequestContext Basic Functionality
 * This tests the core context management that the audit system relies on
 */

import { RequestContext } from '@cleancode-id/nestjs-sequelize-auditor';

describe('RequestContext Basic Functionality', () => {
  
  beforeEach(() => {
    // Clear any existing context before each test
    RequestContext.setContext({});
  });

  describe('Context Storage and Retrieval', () => {
    it('should store and retrieve authentication context', () => {
      const context = {
        actorId: 'user-123',
        ip: '192.168.1.100',
        userAgent: 'Test Browser',
        url: '/api/users',
        tags: { source: 'web-app' }
      };

      RequestContext.setContext(context);
      const retrievedContext = RequestContext.getContext();

      expect(retrievedContext).toEqual(context);
    });

    it('should return undefined when no context is set', () => {
      const context = RequestContext.getContext();
      expect(context).toBeUndefined();
    });

    it('should update context partially', () => {
      // Set initial context
      RequestContext.setContext({
        actorId: 'user-123',
        ip: '192.168.1.100'
      });

      // Update with additional fields
      RequestContext.updateContext({
        userAgent: 'Updated Browser',
        tags: { source: 'mobile-app' }
      });

      const context = RequestContext.getContext();
      expect(context.actorId).toBe('user-123');
      expect(context.ip).toBe('192.168.1.100');
      expect(context.userAgent).toBe('Updated Browser');
      expect(context.tags).toEqual({ source: 'mobile-app' });
    });
  });

  describe('Context Scoping', () => {
    it('should run callback within context scope', () => {
      const testContext = {
        actorId: 'scoped-user',
        ip: '10.0.0.1'
      };

      let contextInsideCallback;
      const result = RequestContext.runWithContext(testContext, () => {
        contextInsideCallback = RequestContext.getContext();
        return 'test-result';
      });

      expect(result).toBe('test-result');
      expect(contextInsideCallback).toEqual(testContext);
    });

    it('should handle nested context operations', () => {
      // Set outer context
      RequestContext.setContext({ actorId: 'outer-user' });

      // Run inner context
      const innerResult = RequestContext.runWithContext(
        { actorId: 'inner-user', ip: '1.1.1.1' },
        () => {
          const innerContext = RequestContext.getContext();
          return innerContext;
        }
      );

      // Check inner context was correct
      expect(innerResult.actorId).toBe('inner-user');
      expect(innerResult.ip).toBe('1.1.1.1');

      // Check outer context is still available
      const outerContext = RequestContext.getContext();
      expect(outerContext.actorId).toBe('outer-user');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle web request context', () => {
      // Simulate what RequestContextInterceptor would set
      const webContext = {
        actorId: 'web-user-456',
        ip: '203.0.113.1',
        userAgent: 'Mozilla/5.0 (Chrome)',
        url: '/api/profile/update',
        tags: { source: 'web-request', method: 'PUT' }
      };

      RequestContext.setContext(webContext);
      const context = RequestContext.getContext();

      expect(context.actorId).toBe('web-user-456');
      expect(context.ip).toBe('203.0.113.1');
      expect(context.userAgent).toBe('Mozilla/5.0 (Chrome)');
      expect(context.url).toBe('/api/profile/update');
      expect(context.tags.source).toBe('web-request');
      expect(context.tags.method).toBe('PUT');
    });

    it('should handle background job context', () => {
      const jobContext = {
        actorId: 'system-cleanup-job',
        tags: { 
          jobType: 'data-cleanup',
          scheduledAt: '2024-01-01T00:00:00Z',
          automated: true
        }
      };

      RequestContext.setContext(jobContext);
      const context = RequestContext.getContext();

      expect(context.actorId).toBe('system-cleanup-job');
      expect(context.tags.jobType).toBe('data-cleanup');
      expect(context.tags.automated).toBe(true);
      expect(context.ip).toBeUndefined(); // No IP for background jobs
    });

    it('should handle admin panel context', () => {
      const adminContext = {
        actorId: 'admin-789',
        ip: '192.168.1.10',
        userAgent: 'Admin Panel v2.0',
        url: '/admin/users/bulk-update',
        tags: {
          source: 'admin-panel',
          permission: 'user-management',
          bulkOperation: true
        }
      };

      RequestContext.setContext(adminContext);
      const context = RequestContext.getContext();

      expect(context.actorId).toBe('admin-789');
      expect(context.tags.source).toBe('admin-panel');
      expect(context.tags.permission).toBe('user-management');
      expect(context.tags.bulkOperation).toBe(true);
    });

    it('should handle rapid operations with different contexts', () => {
      const results = [];

      // Simulate multiple concurrent operations
      ['user1', 'user2', 'user3'].forEach(userId => {
        RequestContext.runWithContext(
          { actorId: userId, tags: { batch: true } },
          () => {
            const context = RequestContext.getContext();
            results.push(context);
          }
        );
      });

      expect(results).toHaveLength(3);
      expect(results[0].actorId).toBe('user1');
      expect(results[1].actorId).toBe('user2');
      expect(results[2].actorId).toBe('user3');
      
      // All should have the batch tag
      results.forEach(ctx => {
        expect(ctx.tags.batch).toBe(true);
      });
    });
  });
});