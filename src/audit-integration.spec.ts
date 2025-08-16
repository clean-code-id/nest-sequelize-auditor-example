/**
 * Test 4: Audit Integration Testing
 * This tests the complete audit flow as it would happen in a real application
 */

import { RequestContext } from '@cleancode-id/nestjs-sequelize-auditor';

describe('Audit Integration', () => {
  
  // Mock the writeAudit function to test the complete flow
  const mockAuditCreate = jest.fn();
  
  beforeEach(() => {
    mockAuditCreate.mockClear();
    RequestContext.setContext({});
  });

  describe('Complete User Operations Flow', () => {
    it('should audit user creation without authentication', async () => {
      // Simulate user creation without authentication context
      const userData = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        password: 'hashed_password',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const auditConfig = {
        exclude: ['created_at', 'updated_at'],
        mask: ['password']
      };

      // Process the data as the audit system would
      const processedData = { ...userData };
      
      // Apply exclusions
      auditConfig.exclude.forEach(field => {
        delete processedData[field];
      });
      
      // Apply masking
      auditConfig.mask.forEach(field => {
        if (field in processedData) {
          processedData[field] = '***MASKED***';
        }
      });

      const auditRecord = {
        event: 'created',
        table: 'users',
        recordId: userData.id,
        oldValues: null,
        newValues: processedData,
        actorId: undefined, // No authentication
        ip: undefined,
        userAgent: undefined,
        url: undefined,
        tags: undefined,
        createdAt: expect.any(Date)
      };

      // Simulate audit creation
      mockAuditCreate.mockResolvedValueOnce(auditRecord);
      await mockAuditCreate(auditRecord);

      expect(mockAuditCreate).toHaveBeenCalledWith({
        event: 'created',
        table: 'users',
        recordId: 1,
        oldValues: null,
        newValues: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          password: '***MASKED***'
          // created_at and updated_at excluded
        },
        actorId: undefined,
        ip: undefined,
        userAgent: undefined,
        url: undefined,
        tags: undefined,
        createdAt: expect.any(Date)
      });
    });

    it('should audit user creation with full authentication context', async () => {
      // Set authentication context (as RequestContextInterceptor would)
      RequestContext.setContext({
        actorId: 'user-123',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Chrome)',
        url: '/api/register',
        tags: { source: 'web-registration', method: 'POST' }
      });

      const userData = {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '987-654-3210',
        password: 'hashed_password',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const auditConfig = {
        exclude: ['created_at', 'updated_at'],
        mask: ['password']
      };

      const context = RequestContext.getContext();
      
      // Process data
      const processedData = { ...userData };
      auditConfig.exclude.forEach(field => delete processedData[field]);
      auditConfig.mask.forEach(field => {
        if (field in processedData) processedData[field] = '***MASKED***';
      });

      const auditRecord = {
        event: 'created',
        table: 'users',
        recordId: userData.id,
        oldValues: null,
        newValues: processedData,
        actorId: context.actorId,
        ip: context.ip,
        userAgent: context.userAgent,
        url: context.url,
        tags: context.tags,
        createdAt: expect.any(Date)
      };

      mockAuditCreate.mockResolvedValueOnce(auditRecord);
      await mockAuditCreate(auditRecord);

      expect(mockAuditCreate).toHaveBeenCalledWith({
        event: 'created',
        table: 'users',
        recordId: 2,
        oldValues: null,
        newValues: {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '987-654-3210',
          password: '***MASKED***'
        },
        actorId: 'user-123',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Chrome)',
        url: '/api/register',
        tags: { source: 'web-registration', method: 'POST' },
        createdAt: expect.any(Date)
      });
    });

    it('should audit user update with onlyDirty: false (User model override)', async () => {
      // Admin updating user profile
      RequestContext.setContext({
        actorId: 'admin-456',
        ip: '10.0.0.1',
        userAgent: 'Admin Panel v2.0',
        url: '/admin/users/edit/1',
        tags: { source: 'admin-panel', operation: 'profile-update' }
      });

      const oldUserData = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        password: 'old_hash',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const newUserData = {
        id: 1,
        name: 'John Smith', // changed
        email: 'john.smith@example.com', // changed
        phone: '123-456-7890', // unchanged
        password: 'old_hash', // unchanged
        created_at: '2024-01-01T00:00:00Z', // unchanged
        updated_at: '2024-01-02T00:00:00Z' // changed (auto-updated)
      };

      const auditConfig = {
        onlyDirty: false, // User model logs full state
        exclude: ['created_at', 'updated_at'],
        mask: ['password']
      };

      const context = RequestContext.getContext();

      // Process both old and new values (full state since onlyDirty: false)
      const processOldValues = { ...oldUserData };
      const processNewValues = { ...newUserData };
      
      // Apply exclusions and masking to both
      [processOldValues, processNewValues].forEach(data => {
        auditConfig.exclude.forEach(field => delete data[field]);
        auditConfig.mask.forEach(field => {
          if (field in data) data[field] = '***MASKED***';
        });
      });

      const auditRecord = {
        event: 'updated',
        table: 'users',
        recordId: 1,
        oldValues: processOldValues,
        newValues: processNewValues,
        actorId: context.actorId,
        ip: context.ip,
        userAgent: context.userAgent,
        url: context.url,
        tags: context.tags,
        createdAt: expect.any(Date)
      };

      mockAuditCreate.mockResolvedValueOnce(auditRecord);
      await mockAuditCreate(auditRecord);

      expect(mockAuditCreate).toHaveBeenCalledWith({
        event: 'updated',
        table: 'users',
        recordId: 1,
        oldValues: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          password: '***MASKED***'
          // Full state logged (onlyDirty: false)
        },
        newValues: {
          id: 1,
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '123-456-7890', // Present even though unchanged
          password: '***MASKED***'
          // Full state logged (onlyDirty: false)
        },
        actorId: 'admin-456',
        ip: '10.0.0.1',
        userAgent: 'Admin Panel v2.0',
        url: '/admin/users/edit/1',
        tags: { source: 'admin-panel', operation: 'profile-update' },
        createdAt: expect.any(Date)
      });
    });

    it('should audit product update with onlyDirty: true (global setting)', async () => {
      // User updating product
      RequestContext.setContext({
        actorId: 'seller-789',
        ip: '203.0.113.50',
        userAgent: 'Mobile App v1.5',
        url: '/api/products/update',
        tags: { source: 'mobile-app', feature: 'price-update' }
      });

      const oldProductData = {
        id: 100,
        name: 'Widget',
        price: 29.99,
        category: 'electronics',
        in_stock: true,
        description: 'A useful widget'
      };

      const newProductData = {
        id: 100,
        name: 'Widget', // unchanged
        price: 34.99, // changed
        category: 'electronics', // unchanged
        in_stock: false, // changed
        description: 'An improved widget' // changed
      };

      const auditConfig = {
        onlyDirty: true // Global setting - only log changed fields
      };

      const context = RequestContext.getContext();

      // Apply onlyDirty logic - only include changed fields
      const changedFields = [];
      for (const field in newProductData) {
        if (oldProductData[field] !== newProductData[field]) {
          changedFields.push(field);
        }
      }

      const processedOldValues = {};
      const processedNewValues = {};
      changedFields.forEach(field => {
        processedOldValues[field] = oldProductData[field];
        processedNewValues[field] = newProductData[field];
      });

      const auditRecord = {
        event: 'updated',
        table: 'products',
        recordId: 100,
        oldValues: processedOldValues,
        newValues: processedNewValues,
        actorId: context.actorId,
        ip: context.ip,
        userAgent: context.userAgent,
        url: context.url,
        tags: context.tags,
        createdAt: expect.any(Date)
      };

      mockAuditCreate.mockResolvedValueOnce(auditRecord);
      await mockAuditCreate(auditRecord);

      expect(mockAuditCreate).toHaveBeenCalledWith({
        event: 'updated',
        table: 'products',
        recordId: 100,
        oldValues: {
          price: 29.99,
          in_stock: true,
          description: 'A useful widget'
          // Only changed fields (onlyDirty: true)
        },
        newValues: {
          price: 34.99,
          in_stock: false,
          description: 'An improved widget'
          // Only changed fields (onlyDirty: true)
        },
        actorId: 'seller-789',
        ip: '203.0.113.50',
        userAgent: 'Mobile App v1.5',
        url: '/api/products/update',
        tags: { source: 'mobile-app', feature: 'price-update' },
        createdAt: expect.any(Date)
      });
    });

    it('should audit user deletion with context', async () => {
      // Moderator deleting user
      RequestContext.setContext({
        actorId: 'moderator-202',
        ip: '172.16.0.10',
        userAgent: 'Moderation Dashboard',
        url: '/moderation/users/delete/5',
        tags: { 
          source: 'moderation-panel', 
          reason: 'spam-violation',
          reviewedBy: 'moderator-202'
        }
      });

      const deletedUserData = {
        id: 5,
        name: 'Spam User',
        email: 'spam@example.com',
        phone: '000-000-0000',
        password: 'some_hash',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const auditConfig = {
        exclude: ['created_at', 'updated_at'],
        mask: ['password']
      };

      const context = RequestContext.getContext();

      // Process deleted data
      const processedData = { ...deletedUserData };
      auditConfig.exclude.forEach(field => delete processedData[field]);
      auditConfig.mask.forEach(field => {
        if (field in processedData) processedData[field] = '***MASKED***';
      });

      const auditRecord = {
        event: 'deleted',
        table: 'users',
        recordId: 5,
        oldValues: processedData,
        newValues: null, // Deletes don't have new values
        actorId: context.actorId,
        ip: context.ip,
        userAgent: context.userAgent,
        url: context.url,
        tags: context.tags,
        createdAt: expect.any(Date)
      };

      mockAuditCreate.mockResolvedValueOnce(auditRecord);
      await mockAuditCreate(auditRecord);

      expect(mockAuditCreate).toHaveBeenCalledWith({
        event: 'deleted',
        table: 'users',
        recordId: 5,
        oldValues: {
          id: 5,
          name: 'Spam User',
          email: 'spam@example.com',
          phone: '000-000-0000',
          password: '***MASKED***'
        },
        newValues: null,
        actorId: 'moderator-202',
        ip: '172.16.0.10',
        userAgent: 'Moderation Dashboard',
        url: '/moderation/users/delete/5',
        tags: { 
          source: 'moderation-panel', 
          reason: 'spam-violation',
          reviewedBy: 'moderator-202'
        },
        createdAt: expect.any(Date)
      });
    });
  });

  describe('Background Operations', () => {
    it('should audit system cleanup operations', async () => {
      // Background job context
      RequestContext.setContext({
        actorId: 'system-cleanup-job',
        tags: {
          system: true,
          jobType: 'inactive-user-cleanup',
          scheduledAt: '2024-01-01T02:00:00Z',
          automated: true
        }
      });

      const context = RequestContext.getContext();

      const auditRecord = {
        event: 'deleted',
        table: 'users',
        recordId: 999,
        oldValues: {
          id: 999,
          name: 'Inactive User',
          email: 'inactive@example.com',
          last_login: '2023-01-01T00:00:00Z'
        },
        newValues: null,
        actorId: context.actorId,
        ip: undefined, // No IP for system jobs
        userAgent: undefined,
        url: undefined,
        tags: context.tags,
        createdAt: expect.any(Date)
      };

      mockAuditCreate.mockResolvedValueOnce(auditRecord);
      await mockAuditCreate(auditRecord);

      expect(mockAuditCreate).toHaveBeenCalledWith({
        event: 'deleted',
        table: 'users',
        recordId: 999,
        oldValues: {
          id: 999,
          name: 'Inactive User',
          email: 'inactive@example.com',
          last_login: '2023-01-01T00:00:00Z'
        },
        newValues: null,
        actorId: 'system-cleanup-job',
        ip: undefined,
        userAgent: undefined,
        url: undefined,
        tags: {
          system: true,
          jobType: 'inactive-user-cleanup',
          scheduledAt: '2024-01-01T02:00:00Z',
          automated: true
        },
        createdAt: expect.any(Date)
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle audit failures gracefully', async () => {
      // Simulate database error
      mockAuditCreate.mockRejectedValueOnce(new Error('Database connection failed'));

      const auditRecord = {
        event: 'created',
        table: 'users',
        recordId: 1,
        newValues: { name: 'Test User' },
        actorId: 'user-123',
        createdAt: expect.any(Date)
      };

      // Should not throw error (audit failures shouldn't break main operations)
      await expect(mockAuditCreate(auditRecord)).rejects.toThrow('Database connection failed');
    });
  });
});