# NestJS Sequelize Auditor - Example Application

This example demonstrates **v4.0.0** features of `@cleancode-id/nestjs-sequelize-auditor` with a complete NestJS application.

## ✨ What This Example Shows

- 🎯 **Zero Setup** - Just one decorator and module config
- 👤 **Built-in Creator** - `include: ["creator"]` works automatically
- 🛡️ **Global Creator Fields** - Secure creator data filtering
- 🔐 **JWT Authentication** - Automatic user tracking from Passport
- 📦 **Bulk Operations** - Individual audit records for bulk operations
- 🎭 **Multi-Actor Support** - Different user types (User, Admin)

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MySQL database
- Basic NestJS knowledge

### Setup

```bash
# 1. Clone and install
git clone <this-repo>
cd nest-sequelize-auditor-example
npm install

# 2. Database setup
cp .env.example .env
# Edit .env with your MySQL credentials

# Create database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS \`nest-sequelize-auditor-example\`"

# 3. Seed test users
npx sequelize-cli db:seed:all

# 4. Start application
npm run start:dev
```

**Test Users Created:**
- **admin@cleancode.id** / password: `password`
- **user@cleancode.id** / password: `password`

## 🧪 Testing Features

### Authentication & Creator Tracking

```bash
# 1. Login to get JWT
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@cleancode.id", "password": "password"}'

# Response: {"access_token": "eyJ...", "user": {...}}
```

### Creator Relationship Testing

```bash
# 2. Create post with authentication
curl -X POST http://localhost:8001/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Test Post",
    "content": "Testing creator functionality",
    "published": true
  }'

# 3. Get posts with creator info
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:8001/posts/paginated
```

**Response shows filtered creator data:**
```json
{
  "count": 1,
  "rows": [{
    "id": 1,
    "title": "Test Post",
    "content": "Testing creator functionality",
    "creator": {
      "id": 1,
      "name": "CleanCode Admin"
    }
  }]
}
```

### Bulk Operations Testing

```bash
# Test bulk operations with individual audit tracking
curl -X POST http://localhost:8001/users/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '[
    {"name": "User 1", "email": "user1@test.com", "password": "pass1"},
    {"name": "User 2", "email": "user2@test.com", "password": "pass2"}
  ]'
```

### Audit History

```bash
# Get all user audits
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:8001/users/audits

# Get specific user with audit history
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:8001/users/1?include=audits
```

## 📊 Key Configuration

### Module Setup (app.module.ts)

```typescript
AuditModule.forRoot({
  autoSync: true,                  // Auto-create audit table
  actorTypes: ['User'],            // Models that can be actors  
  creatorFields: ['id', 'name'],   // 🔥 GLOBAL: Only safe fields in creator
  auth: {
    type: 'passport',              // Use Passport.js
    userProperty: 'user',          // req.user
    userIdField: 'user_id',        // For custom user ID field
  },
})
```

### Model Setup (user.model.ts & post.model.ts)

```typescript
@Auditable({
  exclude: ['password', 'created_at', 'updated_at'],
  auditEvents: [AuditEvent.CREATED, AuditEvent.UPDATED, AuditEvent.DELETED],
})
@Table({ tableName: 'users' })
export class User extends Model {
  // ✨ Automatically available (v4.0.0):
  // - audits: Audit[] relationship
  // - creator: User virtual field (filtered by creatorFields)
  // - creationAudit: Audit relationship
}
```

## 📁 Project Structure

```
src/
├── auth/
│   ├── auth.controller.ts      # JWT login endpoints
│   └── auth.service.ts         # Authentication logic
├── user/
│   ├── user.model.ts           # 🔥 @Auditable User model
│   ├── user.service.ts         # User CRUD with audit
│   └── user.controller.ts      # REST API endpoints
├── post/
│   ├── post.model.ts           # 🔥 @Auditable Post model
│   ├── post.service.ts         # Post CRUD with creator
│   └── post.controller.ts      # Creator relationship demos
├── app.module.ts               # 🔥 AuditModule.forRoot() config
└── main.ts
```

## 🛠️ Development Features

### Comprehensive Test Suite

```bash
# Run all tests
npm test

# Run specific test files
npm test -- src/audit-relationships.spec.ts
npm test -- src/audit-bulk-operations.spec.ts
```

**Test Coverage:**
- ✅ Creator relationships
- ✅ Global creator fields  
- ✅ Automatic relationship setup
- ✅ Bulk operations
- ✅ Authentication integration
- ✅ Field filtering

### Hot Reload Testing

The example uses `"file:../package"` so changes to the main package are automatically reflected:

1. **Edit package files** in `../package/src/`
2. **Rebuild**: `cd ../package && npm run build`
3. **Restart example**: Changes active immediately

## 🔍 Debugging Tools

### Check Audit Records

```sql
-- Connect to your database
USE `nest-sequelize-auditor-example`;

-- See all audit activity
SELECT 
  id, event, auditable_type, auditable_id, 
  actorable_type, actorable_id, created_at
FROM audits 
ORDER BY created_at DESC 
LIMIT 10;
```

### Debug Relationships

Visit `http://localhost:8001/debug/audit-relationships` to see:
- Available model associations
- Actor relationship setup
- Raw audit data queries

## ⚠️ Performance Notes

The example demonstrates bulk operation performance considerations:

```typescript
// ⚠️ Bulk operations trigger additional SELECT queries
await User.bulkCreate([...]);  // ✅ Fast
await User.update({...}, {where: {...}});  // ⚠️ Slower (fetches old values)
await User.destroy({where: {...}});  // ⚠️ Slower (fetches old values)
```

See bulk operation tests in `src/audit-bulk-operations.spec.ts` for batching strategies.

## 🚀 Production Considerations

### Environment-Based Configuration

```typescript
@Auditable({
  auditEvents: process.env.NODE_ENV === 'production' 
    ? [AuditEvent.CREATED, AuditEvent.DELETED]  // Skip updates in prod
    : [AuditEvent.CREATED, AuditEvent.UPDATED, AuditEvent.DELETED]
})
```

### Security Best Practices

```typescript
// ✅ Global creator field filtering
AuditModule.forRoot({
  creatorFields: ['id', 'name'],  // Never expose passwords
})

// ✅ Sensitive field masking  
@Auditable({
  exclude: ['password'],
  mask: ['ssn', 'creditCard']
})
```

## 📚 Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | Get JWT token |
| `/users` | GET | List users with creator |
| `/users/:id` | GET | Get user with audit history |
| `/posts/paginated` | GET | Paginated posts with creator |
| `/posts/:id/with-creator` | GET | Post with creator info |
| `/users/bulk` | POST | Test bulk operations |
| `/debug/audit-relationships` | GET | Debug audit setup |

## 💡 Next Steps

1. **Try the API** - Use the endpoints above with Postman/curl
2. **Explore Tests** - Check the comprehensive test suite
3. **Check Database** - See audit records in MySQL
4. **Customize Config** - Modify `AuditModule.forRoot()` options

## 🤝 Contributing

This example helps validate package features. When adding new functionality:

1. Add test cases in `src/*.spec.ts`
2. Create example endpoints demonstrating the feature  
3. Update this README with usage examples
4. Ensure all tests pass: `npm test`

---

**Need Help?** Check the main package documentation or open an issue! 🎉