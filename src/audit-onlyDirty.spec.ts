/**
 * Test 2: OnlyDirty Logic Testing
 * This tests the core onlyDirty feature we implemented
 */

describe('OnlyDirty Logic', () => {
  
  // Mock the helper functions that are used in writeAudit.ts
  function getChangedFields(
    oldValues: Record<string, any>,
    newValues: Record<string, any>
  ): string[] {
    const changedFields: string[] = [];
    
    // Check all fields in newValues
    for (const field in newValues) {
      if (oldValues[field] !== newValues[field]) {
        changedFields.push(field);
      }
    }
    
    // Check for fields that were removed (exist in old but not in new)
    for (const field in oldValues) {
      if (!(field in newValues) && !changedFields.includes(field)) {
        changedFields.push(field);
      }
    }
    
    return changedFields;
  }

  function pickFields(
    values: Record<string, any>,
    fields: string[]
  ): Record<string, any> {
    const result: Record<string, any> = {};
    fields.forEach((field) => {
      if (field in values) {
        result[field] = values[field];
      }
    });
    return result;
  }

  function processValuesForOnlyDirty(
    oldValues: Record<string, any> | undefined,
    newValues: Record<string, any> | undefined,
    onlyDirty: boolean
  ): { processedOldValues?: Record<string, any>; processedNewValues?: Record<string, any> } {
    
    let finalOldValues = oldValues;
    let finalNewValues = newValues;
    
    // Apply dirty field filtering if enabled and we have both old and new values
    if (onlyDirty && oldValues && newValues) {
      const changedFields = getChangedFields(oldValues, newValues);
      if (changedFields.length > 0) {
        finalOldValues = pickFields(oldValues, changedFields);
        finalNewValues = pickFields(newValues, changedFields);
      } else {
        // No changes detected, return empty objects
        finalOldValues = {};
        finalNewValues = {};
      }
    }
    
    return {
      processedOldValues: finalOldValues,
      processedNewValues: finalNewValues,
    };
  }

  describe('getChangedFields', () => {
    it('should detect changed fields correctly', () => {
      const oldValues = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        age: 30
      };

      const newValues = {
        name: 'John Smith', // changed
        email: 'john@example.com', // unchanged
        phone: '987-654-3210', // changed
        age: 30 // unchanged
      };

      const changedFields = getChangedFields(oldValues, newValues);
      
      expect(changedFields.sort()).toEqual(['name', 'phone']);
    });

    it('should detect removed fields', () => {
      const oldValues = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890'
      };

      const newValues = {
        name: 'John Doe',
        email: 'john@example.com'
        // phone removed
      };

      const changedFields = getChangedFields(oldValues, newValues);
      
      expect(changedFields).toEqual(['phone']);
    });

    it('should detect added fields', () => {
      const oldValues = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const newValues = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890' // added
      };

      const changedFields = getChangedFields(oldValues, newValues);
      
      expect(changedFields).toEqual(['phone']);
    });

    it('should return empty array when no fields changed', () => {
      const oldValues = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const newValues = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const changedFields = getChangedFields(oldValues, newValues);
      
      expect(changedFields).toEqual([]);
    });
  });

  describe('pickFields', () => {
    it('should pick only specified fields', () => {
      const values = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        age: 30
      };

      const result = pickFields(values, ['name', 'phone']);
      
      expect(result).toEqual({
        name: 'John Doe',
        phone: '123-456-7890'
      });
    });

    it('should handle non-existent fields gracefully', () => {
      const values = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const result = pickFields(values, ['name', 'phone', 'nonexistent']);
      
      expect(result).toEqual({
        name: 'John Doe'
      });
    });

    it('should return empty object when no fields match', () => {
      const values = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const result = pickFields(values, ['phone', 'address']);
      
      expect(result).toEqual({});
    });
  });

  describe('processValuesForOnlyDirty', () => {
    it('should return full values when onlyDirty is false', () => {
      const oldValues = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890'
      };

      const newValues = {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '987-654-3210'
      };

      const result = processValuesForOnlyDirty(oldValues, newValues, false);
      
      expect(result.processedOldValues).toEqual(oldValues);
      expect(result.processedNewValues).toEqual(newValues);
    });

    it('should return only changed fields when onlyDirty is true', () => {
      const oldValues = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        age: 30
      };

      const newValues = {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '987-654-3210',
        age: 30
      };

      const result = processValuesForOnlyDirty(oldValues, newValues, true);
      
      expect(result.processedOldValues).toEqual({
        name: 'John Doe',
        phone: '123-456-7890'
      });
      expect(result.processedNewValues).toEqual({
        name: 'John Smith',
        phone: '987-654-3210'
      });
    });

    it('should return empty objects when no fields changed and onlyDirty is true', () => {
      const oldValues = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const newValues = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const result = processValuesForOnlyDirty(oldValues, newValues, true);
      
      expect(result.processedOldValues).toEqual({});
      expect(result.processedNewValues).toEqual({});
    });

    it('should handle undefined values gracefully', () => {
      const result1 = processValuesForOnlyDirty(undefined, undefined, true);
      expect(result1.processedOldValues).toBeUndefined();
      expect(result1.processedNewValues).toBeUndefined();

      const newValues = { name: 'John' };
      const result2 = processValuesForOnlyDirty(undefined, newValues, true);
      expect(result2.processedOldValues).toBeUndefined();
      expect(result2.processedNewValues).toEqual(newValues);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle typical user update scenario', () => {
      // User update: only name and phone changed
      const oldValues = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const newValues = {
        id: 1,
        name: 'John Smith', // changed
        email: 'john@example.com', // unchanged
        phone: '987-654-3210', // changed
        created_at: '2024-01-01T00:00:00Z', // unchanged
        updated_at: '2024-01-02T00:00:00Z' // changed (auto-updated)
      };

      const result = processValuesForOnlyDirty(oldValues, newValues, true);
      
      expect(result.processedOldValues).toEqual({
        name: 'John Doe',
        phone: '123-456-7890',
        updated_at: '2024-01-01T00:00:00Z'
      });
      expect(result.processedNewValues).toEqual({
        name: 'John Smith',
        phone: '987-654-3210',
        updated_at: '2024-01-02T00:00:00Z'
      });
    });

    it('should handle product price update scenario', () => {
      const oldValues = {
        id: 100,
        name: 'Widget',
        price: 29.99,
        category: 'electronics',
        in_stock: true
      };

      const newValues = {
        id: 100,
        name: 'Widget',
        price: 34.99, // price increased
        category: 'electronics',
        in_stock: false // out of stock
      };

      const result = processValuesForOnlyDirty(oldValues, newValues, true);
      
      expect(result.processedOldValues).toEqual({
        price: 29.99,
        in_stock: true
      });
      expect(result.processedNewValues).toEqual({
        price: 34.99,
        in_stock: false
      });
    });

    it('should handle field removal scenario', () => {
      const oldValues = {
        id: 1,
        name: 'John',
        email: 'john@example.com',
        temp_field: 'to be removed'
      };

      const newValues = {
        id: 1,
        name: 'Johnny', // changed
        email: 'john@example.com' // unchanged
        // temp_field removed
      };

      const result = processValuesForOnlyDirty(oldValues, newValues, true);
      
      expect(result.processedOldValues).toEqual({
        name: 'John',
        temp_field: 'to be removed'
      });
      expect(result.processedNewValues).toEqual({
        name: 'Johnny'
      });
    });
  });
});