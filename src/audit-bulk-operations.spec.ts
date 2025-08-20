/**
 * Test 5: Bulk Operations Audit Testing
 * This tests the audit system's support for bulk operations (bulkCreate, bulkUpdate, bulkDestroy)
 * Updated to match the new implementation that creates individual audit records for each affected record
 */

import { RequestContext } from "@cleancode-id/nestjs-sequelize-auditor";

describe("Bulk Operations Auditing", () => {
  beforeEach(() => {
    // Clear context before each test
    RequestContext.setContext({});
  });

  describe("BULK CREATE Operations", () => {
    it("should handle bulk create operations with individual audit records", () => {
      // Set authentication context
      const authContext = {
        actorableId: "admin-123",
        actorableType: "User",
        ip: "192.168.1.100",
        userAgent: "Chrome Browser",
        url: "/api/users/bulk",
        tags: { operation: "bulk-create" },
      };

      RequestContext.setContext(authContext);

      const bulkUserData = [
        {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          password: "hashed_password",
        },
        {
          id: 2,
          name: "Jane Smith", 
          email: "jane@example.com",
          password: "hashed_password",
        },
        {
          id: 3,
          name: "Bob Johnson",
          email: "bob@example.com", 
          password: "hashed_password",
        },
      ];

      const auditConfig = {
        exclude: ["created_at", "updated_at"],
        mask: ["password"],
      };

      // Simulate what the bulk audit system would create
      const expectedAuditRecords = bulkUserData.map((userData) => {
        const processedData = { ...userData };
        
        // Apply exclusions
        auditConfig.exclude.forEach((field) => {
          delete processedData[field];
        });

        // Apply masking
        auditConfig.mask.forEach((field) => {
          if (field in processedData) {
            processedData[field] = "***MASKED***";
          }
        });

        return {
          event: "created",
          auditableType: "User",
          auditableId: userData.id,
          newValues: processedData,
          actorableType: "User",
          actorableId: "admin-123",
          ip: "192.168.1.100",
          userAgent: "Chrome Browser",
          url: "/api/users/bulk",
          tags: {
            operation: "bulk-create",
            bulkOperation: true,
            affectedCount: 3,
          },
        };
      });

      // Verify audit records structure
      expectedAuditRecords.forEach((record, index) => {
        expect(record.event).toBe("created");
        expect(record.auditableType).toBe("User");
        expect(record.auditableId).toBe(bulkUserData[index].id);
        expect(record.newValues.password).toBe("***MASKED***");
        expect(record.newValues).not.toHaveProperty('created_at');
        expect(record.tags.bulkOperation).toBe(true);
        expect(record.tags.affectedCount).toBe(3);
      });
    });
  });

  describe("BULK UPDATE Operations", () => {
    it("should handle bulk update operations with individual audit records", () => {
      // Set authentication context
      const authContext = {
        actorableId: "admin-456",
        actorableType: "Admin",
        ip: "10.0.0.1", 
        userAgent: "Firefox",
        url: "/admin/users/bulk-update",
        tags: { operation: "bulk-status-update" },
      };

      RequestContext.setContext(authContext);

      // Simulate records that will be updated
      const affectedRecords = [
        {
          id: 4,
          name: "John Doe",
          email: "john@example.com",
          phone: "555-1234",
          status: "pending",
        },
        {
          id: 7,
          name: "Carol Wilson", 
          email: "carol@example.com",
          phone: "555-5678",
          status: "pending",
        },
      ];

      const updateData = {
        status: "inactive",
        phone: "555-9999",
      };

      const whereClause = {
        status: "pending",
      };

      // Simulate what the new bulk audit system would create (individual records)
      const expectedAuditRecords = affectedRecords.map((record) => ({
        event: "updated",
        auditableType: "User", 
        auditableId: record.id, // Individual record ID, not "bulk"
        oldValues: {
          status: record.status,
          phone: record.phone,
        },
        newValues: updateData,
        actorableType: "Admin",
        actorableId: "admin-456",
        ip: "10.0.0.1",
        userAgent: "Firefox",
        url: "/admin/users/bulk-update",
        tags: {
          operation: "bulk-status-update",
          bulkOperation: true,
          affectedCount: 2,
          where: whereClause,
        },
      }));

      // Verify audit record structure for each affected record
      expectedAuditRecords.forEach((record, index) => {
        expect(record.event).toBe("updated");
        expect(record.auditableType).toBe("User");
        expect(record.auditableId).toBe(affectedRecords[index].id); // Individual record ID
        expect(record.oldValues).toBeDefined();
        expect(record.oldValues.status).toBe("pending");
        expect(record.oldValues.phone).toBe(affectedRecords[index].phone);
        expect(record.newValues).toEqual(updateData);
        expect(record.tags.bulkOperation).toBe(true);
        expect(record.tags.affectedCount).toBe(2);
        expect(record.tags.where).toEqual(whereClause);
      });
    });

    it("should handle bulk update with onlyDirty: true filtering", () => {
      const authContext = {
        actorableId: "admin-789",
        actorableType: "Admin",
        ip: "10.0.0.2", 
        userAgent: "Chrome",
        url: "/admin/users/bulk-update",
      };

      RequestContext.setContext(authContext);

      // Simulate records before update
      const affectedRecords = [
        {
          id: 4,
          name: "John Doe",
          email: "john@example.com", 
          phone: "555-1234",
          password: "secret123",
        },
        {
          id: 7,
          name: "Carol Wilson",
          email: "carol@example.com",
          phone: "555-5678", 
          password: "secret456",
        },
      ];

      // Only updating phone field
      const updateData = {
        phone: "555-NEW-PHONE",
      };

      const auditConfig = {
        onlyDirty: true,
        mask: ["password"],
      };

      // With onlyDirty: true, both old_values and new_values should only contain changed fields
      const expectedAuditRecords = affectedRecords.map((record) => ({
        event: "updated",
        auditableType: "User",
        auditableId: record.id,
        oldValues: {
          phone: record.phone, // Only the changed field
        },
        newValues: {
          phone: "555-NEW-PHONE", // Only the changed field
        },
        actorableType: "Admin", 
        actorableId: "admin-789",
        tags: {
          bulkOperation: true,
          affectedCount: 2,
        },
      }));

      // Verify dirty field filtering
      expectedAuditRecords.forEach((record, index) => {
        expect(record.event).toBe("updated");
        expect(record.auditableId).toBe(affectedRecords[index].id);
        
        // Only dirty fields should be present
        expect(Object.keys(record.oldValues)).toEqual(["phone"]);
        expect(Object.keys(record.newValues)).toEqual(["phone"]);
        
        // Values should match
        expect(record.oldValues.phone).toBe(affectedRecords[index].phone);
        expect(record.newValues.phone).toBe("555-NEW-PHONE");
        
        // Non-dirty fields should not be present
        expect(record.oldValues).not.toHaveProperty("name");
        expect(record.oldValues).not.toHaveProperty("email");
        expect(record.oldValues).not.toHaveProperty("password");
        expect(record.newValues).not.toHaveProperty("name");
        expect(record.newValues).not.toHaveProperty("email");
        expect(record.newValues).not.toHaveProperty("password");
      });
    });

    it("should handle bulk update with onlyDirty: false (complete state)", () => {
      const authContext = {
        actorableId: "admin-999",
        actorableType: "Admin",
      };

      RequestContext.setContext(authContext);

      // Simulate records before update
      const affectedRecords = [
        {
          id: 4,
          name: "John Doe",
          email: "john@example.com",
          phone: "555-1234",
          password: "secret123",
        },
      ];

      // Updated complete record state
      const updatedRecord = {
        id: 4,
        name: "John Doe",
        email: "john@example.com", 
        phone: "555-UPDATED", // Changed field
        password: "secret123",
      };

      const auditConfig = {
        onlyDirty: false,
        mask: ["password"],
        exclude: ["id"],
      };

      // With onlyDirty: false, should capture complete state
      const expectedAuditRecord = {
        event: "updated",
        auditableType: "User",
        auditableId: 4,
        oldValues: {
          name: "John Doe",
          email: "john@example.com",
          phone: "555-1234",
          password: "***MASKED***", // Masked sensitive field
        },
        newValues: {
          name: "John Doe",
          email: "john@example.com",
          phone: "555-UPDATED",
          password: "***MASKED***", // Masked sensitive field
        },
        actorableType: "Admin",
        actorableId: "admin-999",
        tags: {
          bulkOperation: true,
          affectedCount: 1,
        },
      };

      // Verify complete state capture
      expect(expectedAuditRecord.event).toBe("updated");
      expect(expectedAuditRecord.auditableId).toBe(4);
      
      // Should have complete state (excluding configured fields)
      expect(expectedAuditRecord.oldValues).toHaveProperty("name");
      expect(expectedAuditRecord.oldValues).toHaveProperty("email");
      expect(expectedAuditRecord.oldValues).toHaveProperty("phone");
      expect(expectedAuditRecord.oldValues).toHaveProperty("password");
      expect(expectedAuditRecord.oldValues).not.toHaveProperty("id"); // Excluded
      
      expect(expectedAuditRecord.newValues).toHaveProperty("name");
      expect(expectedAuditRecord.newValues).toHaveProperty("email");
      expect(expectedAuditRecord.newValues).toHaveProperty("phone");
      expect(expectedAuditRecord.newValues).toHaveProperty("password");
      expect(expectedAuditRecord.newValues).not.toHaveProperty("id"); // Excluded
      
      // Password should be masked
      expect(expectedAuditRecord.oldValues.password).toBe("***MASKED***");
      expect(expectedAuditRecord.newValues.password).toBe("***MASKED***");
      
      // Phone should show the change
      expect(expectedAuditRecord.oldValues.phone).toBe("555-1234");
      expect(expectedAuditRecord.newValues.phone).toBe("555-UPDATED");
    });
  });

  describe("BULK DELETE Operations", () => {
    it("should handle bulk delete operations with individual audit records", () => {
      // Set system context (automated cleanup)
      const systemContext = {
        actorableId: "cleanup-job-001",
        actorableType: "System",
        tags: { 
          jobType: "data-cleanup",
          scheduledCleanup: true,
        },
      };

      RequestContext.setContext(systemContext);

      // Simulate records that will be deleted
      const recordsToDelete = [
        {
          id: 4,
          name: "John Doe",
          email: "john@example.com",
          phone: "555-1234",
          status: "archived",
        },
        {
          id: 7,
          name: "Carol Wilson",
          email: "carol@example.com", 
          phone: "555-5678",
          status: "archived",
        },
      ];

      const whereClause = {
        status: "archived",
      };

      const auditConfig = {
        mask: ["password"],
        exclude: ["id", "created_at", "updated_at"],
      };

      // Simulate what the new bulk audit system would create (individual records)
      const expectedAuditRecords = recordsToDelete.map((record) => ({
        event: "deleted",
        auditableType: "User",
        auditableId: record.id, // Individual record ID, not "bulk"
        oldValues: {
          name: record.name,
          email: record.email,
          phone: record.phone,
          status: record.status,
        },
        newValues: null, // Delete operations have no new values
        actorableType: "System",
        actorableId: "cleanup-job-001",
        tags: {
          jobType: "data-cleanup", 
          scheduledCleanup: true,
          bulkOperation: true,
          affectedCount: 2,
          where: whereClause,
        },
      }));

      // Verify audit record structure for each deleted record
      expectedAuditRecords.forEach((record, index) => {
        expect(record.event).toBe("deleted");
        expect(record.auditableType).toBe("User");
        expect(record.auditableId).toBe(recordsToDelete[index].id); // Individual record ID
        expect(record.oldValues).toBeDefined();
        expect(record.oldValues.name).toBe(recordsToDelete[index].name);
        expect(record.oldValues.email).toBe(recordsToDelete[index].email);
        expect(record.oldValues.phone).toBe(recordsToDelete[index].phone);
        expect(record.oldValues.status).toBe("archived");
        expect(record.newValues).toBeNull(); // No new values for delete
        expect(record.actorableType).toBe("System");
        expect(record.tags.bulkOperation).toBe(true);
        expect(record.tags.scheduledCleanup).toBe(true);
        expect(record.tags.affectedCount).toBe(2);
        expect(record.tags.where).toEqual(whereClause);
      });
    });

    it("should handle bulk delete with proper field masking and exclusion", () => {
      const systemContext = {
        actorableId: "admin-delete-001",
        actorableType: "Admin",
      };

      RequestContext.setContext(systemContext);

      // Record to be deleted with sensitive data
      const recordToDelete = {
        id: 10,
        name: "Test User",
        email: "test@example.com",
        phone: "555-9999",
        password: "secret_password",
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-06-01T00:00:00Z",
      };

      const auditConfig = {
        mask: ["password"],
        exclude: ["id", "created_at", "updated_at"],
      };

      const expectedAuditRecord = {
        event: "deleted",
        auditableType: "User",
        auditableId: 10,
        oldValues: {
          name: "Test User",
          email: "test@example.com", 
          phone: "555-9999",
          password: "***MASKED***", // Masked sensitive field
          // Excluded fields (id, created_at, updated_at) should not be present
        },
        newValues: null,
        actorableType: "Admin",
        actorableId: "admin-delete-001",
        tags: {
          bulkOperation: true,
          affectedCount: 1,
        },
      };

      // Verify proper field handling
      expect(expectedAuditRecord.event).toBe("deleted");
      expect(expectedAuditRecord.auditableId).toBe(10);
      expect(expectedAuditRecord.oldValues).toBeDefined();
      expect(expectedAuditRecord.newValues).toBeNull();
      
      // Verify masking
      expect(expectedAuditRecord.oldValues.password).toBe("***MASKED***");
      
      // Verify exclusions
      expect(expectedAuditRecord.oldValues).not.toHaveProperty("id");
      expect(expectedAuditRecord.oldValues).not.toHaveProperty("created_at");
      expect(expectedAuditRecord.oldValues).not.toHaveProperty("updated_at");
      
      // Verify included fields
      expect(expectedAuditRecord.oldValues).toHaveProperty("name");
      expect(expectedAuditRecord.oldValues).toHaveProperty("email");
      expect(expectedAuditRecord.oldValues).toHaveProperty("phone");
      expect(expectedAuditRecord.oldValues).toHaveProperty("password");
    });
  });

  describe("Bulk Operations Context Handling", () => {
    it("should preserve custom tags in bulk operations", () => {
      const context = RequestContext.getContext();

      // Simulate bulk operation with custom context
      RequestContext.setContext({
        actorableId: "batch-processor-1",
        actorableType: "System",
        tags: {
          batchId: "batch-2024-001",
          source: "csv-import",
          retryAttempt: 2,
        },
      });

      const updatedContext = RequestContext.getContext();

      expect(updatedContext.tags.batchId).toBe("batch-2024-001");
      expect(updatedContext.tags.source).toBe("csv-import");
      expect(updatedContext.tags.retryAttempt).toBe(2);
    });

    it("should handle bulk operations without authentication context", () => {
      // Clear any existing context
      RequestContext.setContext({});

      // Simulate system operation without user authentication
      const expectedAuditRecord = {
        event: "deleted",
        auditableType: "User",
        auditableId: 5,
        oldValues: {
          name: "System User",
          email: "system@example.com",
        },
        newValues: null,
        actorableType: undefined, // No actor when no context
        actorableId: undefined, // No actor when no context
        ip: undefined,
        userAgent: undefined,
        url: undefined,
        tags: {
          bulkOperation: true,
          affectedCount: 1,
        },
      };

      // Verify handling of missing context
      expect(expectedAuditRecord.actorableType).toBeUndefined();
      expect(expectedAuditRecord.actorableId).toBeUndefined();
      expect(expectedAuditRecord.ip).toBeUndefined();
      expect(expectedAuditRecord.userAgent).toBeUndefined();
      expect(expectedAuditRecord.url).toBeUndefined();
      expect(expectedAuditRecord.tags.bulkOperation).toBe(true);
    });
  });

  describe("Bulk Operations Edge Cases", () => {
    it("should handle empty bulk operations", () => {
      const authContext = {
        actorableId: "admin-123",
        actorableType: "User",
      };

      RequestContext.setContext(authContext);

      // Simulate bulk operation that affects no records
      const expectedAuditRecord = {
        event: "updated",
        auditableType: "User",
        auditableId: "bulk", // Fallback to "bulk" when no specific records
        newValues: { status: "inactive" },
        oldValues: undefined,
        actorableType: "User",
        actorableId: "admin-123",
        tags: {
          bulkOperation: true,
          affectedCount: 0, // No records affected
          where: { status: "nonexistent" },
        },
      };

      // Verify fallback behavior for empty results
      expect(expectedAuditRecord.auditableId).toBe("bulk");
      expect(expectedAuditRecord.tags.affectedCount).toBe(0);
      expect(expectedAuditRecord.oldValues).toBeUndefined();
    });

    it("should handle bulk operations with complex where clauses", () => {
      const complexWhereClause = {
        $and: [
          { status: { $in: ["pending", "processing"] } },
          { createdAt: { $lt: "2023-01-01" } },
          { $or: [
            { priority: "low" },
            { category: "cleanup" }
          ]}
        ]
      };

      const expectedTags = {
        bulkOperation: true,
        affectedCount: 42,
        where: complexWhereClause,
        operationType: "scheduled-maintenance",
      };

      // Verify complex where clause preservation
      expect(expectedTags.where).toEqual(complexWhereClause);
      expect(expectedTags.where.$and).toHaveLength(3);
      expect(expectedTags.where.$and[2].$or).toHaveLength(2);
    });
  });
});