# NestJS Sequelize Auditor Example

This is an example NestJS application demonstrating how to use the `@clean-code-id/nest-sequelize-auditor` package for audit trail functionality.

## Features Demonstrated

- **Request Context Tracking**: Using `RequestContextInterceptor` to automatically capture request context
- **Model Audit Hooks**: Attaching audit hooks to Sequelize models to track changes
- **Manual Context Setting**: Setting audit context programmatically with `setRequestContext()`

## Setup

1. Build the package first:
   ```bash
   cd ../package
   npm run build
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run start:dev
   ```

## Testing the Audit Functionality

### 1. Create a User
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "phone": "123-456-7890"}' \
  -G -d "acting_user_id=1"
```

### 2. Update a User
```bash
curl -X PUT http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "John Smith", "phone": "987-654-3210"}' \
  -G -d "acting_user_id=2"
```

### 3. Delete a User
```bash
curl -X DELETE http://localhost:3000/users/1?acting_user_id=3
```

### 4. View All Users
```bash
curl http://localhost:3000/users
```

## What Gets Audited

The audit system will automatically track:
- **Create operations**: Who created the record and when
- **Update operations**: Who updated the record, what changed (old vs new values), and when
- **Delete operations**: Who deleted the record and when

## Audit Table Structure

The audit package will automatically create an `audits` table with the following structure:
- `id`: Primary key
- `auditable_type`: Model name (e.g., 'User')
- `auditable_id`: ID of the record being audited
- `event`: Type of operation ('created', 'updated', 'deleted')
- `old_values`: Previous values (for updates)
- `new_values`: New values (for creates and updates)
- `user_id`: ID of the user performing the action
- `ip_address`: IP address of the request
- `user_agent`: User agent of the request
- `url`: URL that triggered the change
- `created_at`: When the audit record was created

## Key Implementation Points

1. **RequestContextInterceptor**: Added as a global interceptor to automatically capture request context
2. **attachAuditHooks()**: Called on the User model to enable audit tracking
3. **setRequestContext()**: Used in service methods to set the user ID performing the action
4. **Database**: Uses SQLite in-memory for simplicity in this example