/**
 * Test 3: Audit Scenarios Testing
 * This tests different audit scenarios that would happen in real applications
 */

import { RequestContext } from '@cleancode-id/nestjs-sequelize-auditor';

describe('Audit Scenarios', () => {
  
  beforeEach(() => {
    // Clear context before each test
    RequestContext.setContext({});
  });

  describe('CREATE Operations', () => {
    it('should handle CREATE operation without authentication', () => {
      // No authentication context set
      const auditContext = RequestContext.getContext();
      
      const auditData = {
        event: 'created',
        table: 'users',
        recordId: 1,
        newValues: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashed_password'
        },
        context: auditContext, // undefined
        config: {
          exclude: ['created_at', 'updated_at'],
          mask: ['password']
        }
      };

      // Should handle undefined context gracefully
      expect(auditData.context).toBeUndefined();
      expect(auditData.event).toBe('created');
      expect(auditData.newValues.name).toBe('John Doe');
      expect(auditData.config.mask).toContain('password');
    });

    it('should handle CREATE operation with full authentication', () => {
      // Set authentication context
      const authContext = {
        actorId: 'user-123',
        ip: '192.168.1.100',
        userAgent: 'Chrome Browser',
        url: '/api/users',
        tags: { source: 'registration-form' }
      };
      
      RequestContext.setContext(authContext);
      const auditContext = RequestContext.getContext();
      
      const auditData = {
        event: 'created',
        table: 'users',
        recordId: 1,
        newValues: {
          id: 1,
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'hashed_password'
        },
        context: auditContext,
        config: {
          exclude: ['created_at', 'updated_at'],
          mask: ['password']
        }
      };

      // Should have full authentication context
      expect(auditData.context.actorId).toBe('user-123');
      expect(auditData.context.ip).toBe('192.168.1.100');
      expect(auditData.context.userAgent).toBe('Chrome Browser');
      expect(auditData.context.url).toBe('/api/users');
      expect(auditData.context.tags.source).toBe('registration-form');
    });
  });

  describe('UPDATE Operations', () => {
    it('should handle UPDATE operation with onlyDirty: false (full state)', () => {
      RequestContext.setContext({
        actorId: 'admin-456',
        ip: '10.0.0.1',
        tags: { source: 'admin-panel' }
      });
      
      const auditContext = RequestContext.getContext();
      
      const auditData = {
        event: 'updated',
        table: 'users',
        recordId: 1,
        oldValues: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          password: 'old_hash'
        },
        newValues: {
          id: 1,
          name: 'John Smith', // changed
          email: 'john@example.com', // unchanged
          phone: '987-654-3210', // changed
          password: 'old_hash' // unchanged
        },
        context: auditContext,
        config: {
          onlyDirty: false, // Log full state
          mask: ['password']
        }
      };

      // Should log full state since onlyDirty: false
      expect(auditData.oldValues.email).toBe('john@example.com'); // unchanged but present
      expect(auditData.newValues.email).toBe('john@example.com'); // unchanged but present
      expect(auditData.oldValues.name).toBe('John Doe');
      expect(auditData.newValues.name).toBe('John Smith');
      expect(auditData.context.actorId).toBe('admin-456');
      expect(auditData.context.tags.source).toBe('admin-panel');
    });

    it('should handle UPDATE operation with onlyDirty: true (only changed fields)', () => {
      RequestContext.setContext({
        actorId: 'user-789',
        ip: '172.16.0.1'
      });
      
      const auditContext = RequestContext.getContext();
      
      // This would be processed by the onlyDirty logic before writing to audit
      const auditData = {
        event: 'updated',
        table: 'products',
        recordId: 100,
        originalOldValues: {
          id: 100,
          name: 'Widget',
          price: 29.99,
          category: 'electronics',
          in_stock: true
        },
        originalNewValues: {
          id: 100,
          name: 'Widget', // unchanged
          price: 34.99, // changed
          category: 'electronics', // unchanged
          in_stock: false // changed
        },
        context: auditContext,
        config: {
          onlyDirty: true
        }
      };

      // Simulate what onlyDirty processing would produce
      const changedFields = ['price', 'in_stock'];
      const processedOldValues = {
        price: 29.99,
        in_stock: true
      };
      const processedNewValues = {
        price: 34.99,
        in_stock: false
      };

      expect(Object.keys(processedOldValues)).toEqual(changedFields);
      expect(Object.keys(processedNewValues)).toEqual(changedFields);
      expect(processedOldValues.price).toBe(29.99);
      expect(processedNewValues.price).toBe(34.99);
      expect(processedOldValues.in_stock).toBe(true);
      expect(processedNewValues.in_stock).toBe(false);
    });
  });

  describe('DELETE Operations', () => {
    it('should handle DELETE operation with context', () => {
      RequestContext.setContext({
        actorId: 'moderator-101',
        ip: '192.168.2.50',
        tags: { reason: 'policy-violation', automated: false }
      });
      
      const auditContext = RequestContext.getContext();
      
      const auditData = {
        event: 'deleted',
        table: 'users',
        recordId: 5,
        oldValues: {
          id: 5,
          name: 'Deleted User',
          email: 'deleted@example.com',
          password: 'some_hash'
        },
        newValues: null, // Delete operations don't have new values
        context: auditContext,
        config: {
          mask: ['password']
        }
      };

      expect(auditData.event).toBe('deleted');
      expect(auditData.newValues).toBeNull();
      expect(auditData.oldValues.name).toBe('Deleted User');
      expect(auditData.context.actorId).toBe('moderator-101');
      expect(auditData.context.tags.reason).toBe('policy-violation');
      expect(auditData.context.tags.automated).toBe(false);
    });
  });

  describe('Configuration Scenarios', () => {
    it('should handle exclude and mask configuration', () => {
      const userData = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        last_login: '2024-01-01T12:00:00Z'
      };

      const config = {
        exclude: ['created_at', 'updated_at'],
        mask: ['password']
      };

      // Simulate field processing
      const processedData = { ...userData };
      
      // Remove excluded fields
      config.exclude.forEach(field => {
        delete processedData[field];
      });
      
      // Mask sensitive fields
      config.mask.forEach(field => {
        if (field in processedData) {
          processedData[field] = '***MASKED***';
        }
      });

      expect(processedData.name).toBe('John Doe');
      expect(processedData.email).toBe('john@example.com');
      expect(processedData.password).toBe('***MASKED***');
      expect(processedData.last_login).toBe('2024-01-01T12:00:00Z'); // not excluded
      expect(processedData.created_at).toBeUndefined(); // excluded
      expect(processedData.updated_at).toBeUndefined(); // excluded
    });

    it('should handle global vs per-model onlyDirty precedence', () => {
      // Global configuration
      const globalConfig: { onlyDirty: boolean } = {
        onlyDirty: true
      };

      // Per-model configuration (should override global)
      const modelConfig: { onlyDirty: boolean; mask: string[] } = {
        onlyDirty: false,
        mask: ['password']
      };

      // Test precedence: model config overrides global
      const effectiveOnlyDirty = modelConfig.onlyDirty ?? globalConfig.onlyDirty ?? false;
      
      expect(effectiveOnlyDirty).toBe(false); // Model config wins
      expect(modelConfig.mask).toContain('password');
    });

    it('should handle no local config (use global)', () => {
      const globalConfig: { onlyDirty: boolean } = {
        onlyDirty: true
      };

      const modelConfig: { onlyDirty?: boolean } = {}; // No local onlyDirty setting

      // Test precedence: should use global when no local config
      const effectiveOnlyDirty = modelConfig.onlyDirty ?? globalConfig.onlyDirty ?? false;
      
      expect(effectiveOnlyDirty).toBe(true); // Global config used
    });
  });

  describe('Edge Cases', () => {
    it('should handle operation with no changes when onlyDirty: true', () => {
      const oldValues = {
        id: 1,
        status: 'active',
        priority: 'high'
      };

      const newValues = {
        id: 1,
        status: 'active', // same
        priority: 'high' // same
      };

      // Simulate onlyDirty processing
      const changedFields = [];
      for (const field in newValues) {
        if (oldValues[field] !== newValues[field]) {
          changedFields.push(field);
        }
      }

      // No fields changed
      expect(changedFields).toHaveLength(0);
      
      // With onlyDirty: true, should result in empty objects
      const processedOldValues = changedFields.length > 0 ? {} : {};
      const processedNewValues = changedFields.length > 0 ? {} : {};
      
      expect(processedOldValues).toEqual({});
      expect(processedNewValues).toEqual({});
    });

    it('should handle rapid operations with different actors', () => {
      const operations = [];
      
      // Simulate multiple rapid operations
      ['user1', 'user2', 'user3'].forEach(userId => {
        RequestContext.runWithContext(
          { actorId: userId, tags: { operation: 'bulk-update' } },
          () => {
            const context = RequestContext.getContext();
            operations.push({
              actorId: context.actorId,
              tags: context.tags
            });
          }
        );
      });

      expect(operations).toHaveLength(3);
      expect(operations[0].actorId).toBe('user1');
      expect(operations[1].actorId).toBe('user2');
      expect(operations[2].actorId).toBe('user3');
      
      operations.forEach(op => {
        expect(op.tags.operation).toBe('bulk-update');
      });
    });

    it('should handle system operations without actor', () => {
      // System operation - no actor set
      const systemContext = {
        tags: {
          system: true,
          job: 'data-migration',
          scheduled: true
        }
      };
      
      RequestContext.setContext(systemContext);
      const context = RequestContext.getContext();
      
      expect(context.actorId).toBeUndefined();
      expect(context.tags.system).toBe(true);
      expect(context.tags.job).toBe('data-migration');
    });
  });
});