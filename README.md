# NestJS Sequelize Auditor - Example Application

This example demonstrates how to use `@cleancode-id/nestjs-sequelize-auditor` in a real NestJS application with MySQL database.

## 🎯 Purpose

- **Test the package** during development
- **Demonstrate features** with working code
- **Validate changes** before publishing

## 🚀 Quick Start (For Users)

If you just want to try the published package:

```bash
# Clone and install
git clone https://github.com/clean-code-id/nest-sequelize-auditor.git
cd nest-sequelize-auditor/example
npm install

# Install the published package (instead of local link)
npm install @cleancode-id/nestjs-sequelize-auditor

# Setup database and run
cp .env.example .env
# Edit .env with your database credentials
npm run start:dev
```

## 🛠️ Development Setup (For Contributors)

If you want to contribute to the package and test local changes:

### Prerequisites

- Node.js 16+
- npm or yarn
- MySQL database running

### Step 1: Clone Both Repositories

```bash
# Create a workspace directory and clone both repos at the same level
mkdir nestjs-auditor-workspace
cd nestjs-auditor-workspace

# Clone the main package repository
git clone https://github.com/clean-code-id/nest-sequelize-auditor.git package

# Clone the example repository
git clone https://github.com/clean-code-id/nest-sequelize-auditor-example.git example

# Your directory structure should look like:
# nestjs-auditor-workspace/
# ├── package/          # Main package repo
# └── example/          # Example repo (this one)
```

### Step 2: Setup Package

```bash
# Setup the package first
cd package
npm install
npm run build
npm link  # Creates global symlink
```

### Step 3: Setup Example with Local Package

```bash
# Go to example directory
cd ../example
npm install

# Link to local package (already configured via package.json: "file:../package")
# The file:../package link will automatically use your local package
```

### Step 4: Database Configuration

```bash
# Copy environment file
cp .env.example .env

# Edit database credentials
# Update these values in .env:
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASS=your_password
DATABASE_NAME=nest-sequelize-auditor-example
```

### Step 5: Create Database

```sql
-- Connect to MySQL and create database
CREATE DATABASE IF NOT EXISTS `nest-sequelize-auditor-example`;
```

### Step 6: Start Development

```bash
# Terminal 1: Watch package changes (optional)
cd package
npm run dev  # Watches and rebuilds on changes

# Terminal 2: Run example application
cd example
npm run start:dev
```

## 🧪 Testing the Integration

Once the application is running on `http://localhost:8001`, you can test the audit functionality:

### 1. Create a User
```bash
curl -X POST http://localhost:8001/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com", "phone": "123-456-7890"}'
```

### 2. Update a User
```bash
curl -X PUT http://localhost:8001/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe", "email": "jane@example.com"}'
```

### 3. Delete a User
```bash
curl -X DELETE http://localhost:8001/users/1
```

### 4. Check Audit Records
```sql
-- Connect to your database and check audit table
USE `nest-sequelize-auditor-example`;
SELECT * FROM audits ORDER BY created_at DESC;
```

You should see audit records with:
- `event`: 'created', 'updated', 'deleted'
- `table_name`: 'users'
- `old_values` and `new_values`: JSON data
- Proper snake_case column names

## 🔄 Development Workflow

### Making Changes to the Package

1. **Edit package files** in `../package/src/`
2. **Rebuild package**: `cd ../package && npm run build`
3. **Test in example**: Changes are automatically available (thanks to npm link)
4. **Restart example app** if needed: `npm run start:dev`

### Testing Different Configurations

The example is configured to test:
- ✅ Selective audit events (created, updated, deleted)
- ✅ Field exclusion (created_at, updated_at)
- ✅ Automatic table creation with snake_case columns
- ✅ Request context capture

You can modify `src/user/user.service.ts` to test different configurations:

```typescript
// Test different audit events
attachAuditHooks(this.userModel, {
  auditEvents: [AuditEvent.DELETED], // Only deletions
  exclude: ['created_at', 'updated_at'],
  mask: ['phone'], // Mask phone numbers
});
```

## 📁 Project Structure

```
example/
├── src/
│   ├── user/
│   │   ├── user.controller.ts    # REST endpoints
│   │   ├── user.model.ts         # Sequelize model
│   │   └── user.service.ts       # 🔥 Audit hooks setup here
│   ├── app.module.ts             # 🔥 AuditModule configuration
│   └── main.ts
├── .env.example                  # Database config template
├── package.json                  # 🔗 Links to local package
└── README.md                     # This file
```

## ⚠️ Troubleshooting

### "Cannot resolve module" error
```bash
# Re-link the package
cd ../package && npm run build && npm link
cd ../example && npm link @cleancode-id/nestjs-sequelize-auditor
```

### Database connection errors
- Check MySQL is running
- Verify `.env` credentials
- Ensure database exists

### "Table doesn't exist" errors
- The audit table is created automatically
- Check database permissions
- Clear database and restart app

### Example doesn't reflect package changes
```bash
# Rebuild package
cd ../package && npm run build

# Restart example
cd ../example && npm run start:dev
```

## 🎯 What This Example Demonstrates

- **Zero Configuration**: Just import `AuditModule.forRoot()`
- **Automatic Setup**: Audit table created automatically
- **Snake Case**: Database uses proper snake_case conventions
- **Selective Events**: Only audits created, updated, deleted events
- **Field Control**: Excludes timestamp fields from audit
- **Request Context**: Captures IP, user agent, etc. (when interceptor is active)

## 📊 Audit Table Structure

The package automatically creates an `audits` table with snake_case columns:

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Primary key |
| `event` | ENUM | 'created', 'updated', 'deleted', 'restored' |
| `table_name` | VARCHAR | Source table name |
| `record_id` | VARCHAR | ID of the audited record |
| `old_values` | JSON | Previous values (for updates/deletes) |
| `new_values` | JSON | New values (for creates/updates) |
| `user_id` | VARCHAR | User performing the action |
| `ip` | VARCHAR | IP address |
| `user_agent` | TEXT | Browser/client info |
| `url` | VARCHAR | Request URL |
| `tags` | JSON | Custom metadata |
| `created_at` | TIMESTAMP | When audit was recorded |

## 📝 Adding New Test Cases

To test new features:

1. **Add new model** in `src/` (e.g., `product.model.ts`)
2. **Create service** with `attachAuditHooks()`
3. **Add controller** with CRUD endpoints
4. **Test different configurations**

## 🚀 Publishing Changes

After testing:

1. **Update version** in `../package/package.json`
2. **Build package**: `cd ../package && npm run build`
3. **Publish**: `cd ../package && npm publish`
4. **Update example** to use published version (optional)

---

## 💡 Need Help?

- **Package Issues**: Check `../package/README.md`
- **Database Setup**: See MySQL/PostgreSQL documentation
- **NestJS Questions**: Check [NestJS Documentation](https://nestjs.com/)

Happy coding! 🎉