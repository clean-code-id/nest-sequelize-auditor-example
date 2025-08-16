# NestJS Sequelize Auditor - Example Application

This example demonstrates how to use `@cleancode-id/nestjs-sequelize-auditor` in a real NestJS application with MySQL database.

## 🎯 Purpose

- **Test the package** during development
- **Demonstrate features** with working code
- **Validate changes** before publishing

## 🚀 Quick Start (For Users)

If you just want to try the package in your own project:

```bash
# Install the package
npm install @cleancode-id/nestjs-sequelize-auditor

# Setup in your NestJS app (see main package's README for full setup)
# app.module.ts: Add AuditModule.forRoot()
# your.service.ts: Add attachAuditHooks() in onModuleInit()
```

## 🛠️ Development Setup (For Contributors)

If you want to contribute to the package and test local changes:

### Prerequisites

- Node.js 16+
- npm or yarn
- MySQL database running

### Step 1: Clone Both Repositories

```bash
# Create a workspace directory and clone both (example and package) repos at the same level
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

### Step 6: Run Seeders

**⚠️ IMPORTANT**: Run the seeders to create test users for authentication:

```bash
# Install dotenv for seeder configuration
npm install dotenv

# Run seeders to create admin@cleancode.id and user@cleancode.id
npx sequelize-cli db:seed:all
```

This creates:
- **admin@cleancode.id** / password: `password`
- **user@cleancode.id** / password: `password`

### Step 7: Start Development

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

### 🔐 Authentication Testing

The package now supports **automatic user tracking** with Passport JWT authentication!

#### 1. Login to Get JWT Token
```bash
# Login as admin
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cleancode.id",
    "password": "password"
  }'

# Response: {"access_token": "eyJhbGciOiJIUzI1NiIs...", "user": {...}}
```

#### 2. Create User WITH Authentication (Automatic User ID Capture)
```bash
# Use the access_token from login response
curl -X POST http://localhost:8001/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "name": "New User via Auth",
    "email": "newuser@cleancode.id",
    "phone": "123-456-7890",
    "password": "userpass"
  }'
```

#### 3. Create User WITHOUT Authentication (Manual User ID)
```bash
# For comparison - manual user_id specification
curl -X POST "http://localhost:8001/users/no-auth?acting_user_id=999" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Manual User",
    "email": "manual@cleancode.id",
    "phone": "987-654-3210",
    "password": "userpass"
  }'
```

#### 4. Update a User with Authentication
```bash
curl -X PUT http://localhost:8001/users/3 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{"name": "Updated Name"}'
```

#### 5. Delete a User with Authentication
```bash
curl -X DELETE http://localhost:8001/users/3 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### 📊 Check Audit Records
```sql
-- Connect to your database and check audit table
USE `nest-sequelize-auditor-example`;
SELECT 
  id,
  event,
  table_name,
  record_id,
  user_id,  -- This should show real user IDs (1, 2) or manual (999)
  url,
  created_at
FROM audits 
ORDER BY created_at DESC;
```

You should see audit records with:
- `user_id`: **Real user IDs** (1, 2) from JWT tokens or **manual** (999)
- `event`: 'created', 'updated', 'deleted'
- `table_name`: 'users'
- `old_values` and `new_values`: JSON data
- Proper snake_case column names

### 🎯 Expected Results

| Operation | Authentication | user_id in Audit |
|-----------|----------------|------------------|
| Created by admin@cleancode.id | JWT Token | `"1"` |
| Created by user@cleancode.id | JWT Token | `"2"` |
| Created manually | Query param | `NULL` |

This demonstrates **Laravel-like automatic user tracking**! 🚀

## 🔄 Development Workflow

### Making Changes to the Package

1. **Edit package files** in `../package/src/`
2. **Rebuild package**: `cd ../package && npm run build`
3. **Test in example**: Changes are automatically available (thanks to npm link)
4. **Restart example app** if needed: `npm run start:dev`

### Testing Different Configurations

#### **Module Configuration (app.module.ts)**
Test different `AuditModule.forRoot()` options:

```typescript
// Enable auto table creation (default)
AuditModule.forRoot({
  autoSync: true,        // ✅ Creates audit table automatically
  alterTable: false,     // Don't alter existing table structure
  tableName: 'audits',   // Custom table name (optional)
  isGlobal: true,        // Make module globally available
})

// Disable auto table creation (manual setup)
AuditModule.forRoot({
  autoSync: false,       // ❌ Don't create table - manual setup required
})
```

#### **Hook Configuration (user.service.ts)**
Test different `attachAuditHooks()` options:

```typescript
// Basic setup - all events
attachAuditHooks(this.userModel, {
  exclude: ['created_at', 'updated_at'],
});

// Only specific events
attachAuditHooks(this.userModel, {
  auditEvents: [AuditEvent.DELETED], // Only deletions
  exclude: ['created_at', 'updated_at'],
  mask: ['phone'], // Mask phone numbers
});

// Everything enabled
attachAuditHooks(this.userModel, {
  auditEvents: [AuditEvent.CREATED, AuditEvent.UPDATED, AuditEvent.DELETED, AuditEvent.RESTORED],
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

### Example doesn't reflect package changes
```bash
# Rebuild package
cd ../package && npm run build

# Restart example
cd ../example && npm run start:dev
```

## 🎯 What This Example Demonstrates

### ✅ **Laravel-like Experience**
- **One-Line Setup**: Just `AuditModule.forRoot({ autoSync: true })` creates the audit table
- **Automatic User Tracking**: Seamless user capture with Passport JWT authentication
- **Configuration Control**: Module options directly control table creation behavior
- **Zero Manual Setup**: No migrations needed - table created during app startup

### ✅ **Advanced Authentication Features**
- **Passport Integration**: Works with NestJS Passport JWT out of the box
- **Automatic User Resolution**: Extracts user ID from JWT tokens automatically
- **Multiple Auth Strategies**: Configurable for different authentication setups
- **Real User Tracking**: Captures actual database user IDs in audit trail

### ✅ **Advanced Features**
- **Automatic Table Creation**: Controlled by `AuditModule.forRoot()` options
- **Snake Case Database**: Proper snake_case column conventions
- **Selective Events**: Only audits created, updated, deleted events
- **Field Control**: Excludes timestamp fields from audit
- **Request Context**: Captures IP, user agent, URL, etc.

### ✅ **Performance Optimized**
- **Single Initialization**: Audit table created once during app startup
- **No Runtime Overhead**: Zero performance impact on CRUD operations
- **Global Configuration**: One module setup serves all auditable models

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
| `actor_id` | VARCHAR | Actor performing the action |
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