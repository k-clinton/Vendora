# Admin Dashboard Guide

## Overview
A comprehensive admin dashboard system with role-based access control (RBAC) for managing your e-commerce store.

## Features Implemented

### 1. **Dashboard Analytics** (`/admin`)
- **Revenue tracking**: Today, last 7 days, last 30 days
- **Key metrics**: Total orders, pending orders, low stock alerts, user growth
- **Low stock alerts**: Real-time inventory warnings
- **Top selling products**: Best performers by revenue and units sold
- **Recent orders**: Quick overview of latest transactions
- **Role-based visibility**: Different users see different sections based on permissions

### 2. **Order Management** (`/admin/orders`)
- View all orders with filtering by status (Pending, Completed, Cancelled)
- Search orders by ID or customer email
- Order details page with full information
- **Actions**:
  - Update order status
  - Add tracking numbers
  - Process refunds (Admin only)
- Payment status tracking
- Shipping address display

### 3. **User Management** (`/admin/users`)
- View all registered users
- Filter by role (Admin, Staff, Viewer, Customer)
- Search by name or email
- User detail page with:
  - Order history
  - Purchase statistics
  - Recent reviews
- **Actions**:
  - Change user roles
  - Disable/enable accounts
  - View complete user activity
- Protection against self-modification

### 4. **Finance Dashboard** (`/admin/finance`)
- Transaction history with date range filters
- Revenue analytics and trends
- Payment status breakdown (Succeeded, Failed, Pending)
- Refund tracking
- Visual revenue chart
- **Export to CSV** for accounting/reporting

### 5. **Settings Management** (`/admin/settings`)
- Store information (name, logo, currency)
- Tax rate configuration
- Low stock threshold settings
- Inventory preferences

### 6. **Inventory Management** (Existing: `/admin/inventory`)
- Stock tracking per product variant
- Low stock alerts on dashboard
- Threshold-based warnings

### 7. **Product Management** (Existing: `/admin/products`)
- Create, edit, delete products
- Manage variants and pricing
- Product activation/deactivation

## Role-Based Permissions

### Roles

#### **ADMIN** (Full Access)
- ✅ View dashboard
- ✅ Manage products (create, edit, delete)
- ✅ Manage orders (view, update, refund)
- ✅ Manage users (view, ban, change roles)
- ✅ Manage inventory
- ✅ View finance data
- ✅ Export data
- ✅ Manage settings
- ✅ Process refunds

#### **STAFF** (Operations)
- ✅ View dashboard
- ✅ Manage products (create, edit)
- ✅ Manage orders (view, update)
- ❌ Manage users
- ✅ Manage inventory
- ❌ View finance data
- ❌ Export data
- ❌ Manage settings
- ❌ Process refunds
- ❌ Delete products

#### **VIEWER** (Read-Only Finance)
- ✅ View dashboard
- ❌ Manage products
- ❌ Manage orders
- ❌ Manage users
- ❌ Manage inventory
- ✅ View finance data
- ✅ Export data
- ❌ Manage settings
- ❌ Process refunds

#### **CUSTOMER** (No Admin Access)
- ❌ No admin access

## Setting Up Admin Users

### Method 1: Environment Variable (Quick Setup)
Add admin emails to `.env.local`:
```env
ADMIN_EMAILS=admin@example.com,boss@example.com
```
These users will automatically get ADMIN role on login.

### Method 2: Database (Recommended for Production)
1. Register a user through the normal signup flow
2. Access the database and update their role:
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

### Method 3: Through Admin Panel (Once you have one admin)
1. Login as an existing admin
2. Navigate to `/admin/users`
3. Find the user and click "View"
4. Use "Change Role" to assign appropriate role

## Security Features

### ✅ What We Did Right (NOT Amateur)

1. **Database-Driven Roles**: Roles are stored in the database, not hardcoded
2. **Middleware Protection**: Both pages and API routes are protected
3. **Permission-Based Logic**: Fine-grained permissions per role
4. **Self-Modification Prevention**: Users cannot change their own role/disable themselves
5. **Activity Logging**: All admin actions are logged to `activity_logs` table
6. **Disabled Account Checking**: Disabled users cannot login
7. **Session-Based Auth**: Proper NextAuth integration with JWT

### Database Schema Additions

```sql
-- Users table enhancements
ALTER TABLE users ADD COLUMN disabled INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN disabled_reason TEXT;
ALTER TABLE users ADD COLUMN disabled_at INTEGER;

-- Orders table enhancements
ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN tracking_number TEXT;
ALTER TABLE orders ADD COLUMN refund_id TEXT;
ALTER TABLE orders ADD COLUMN refund_amount INTEGER;
ALTER TABLE orders ADD COLUMN refund_reason TEXT;
ALTER TABLE orders ADD COLUMN refunded_at INTEGER;

-- New tables
CREATE TABLE store_settings (
  id TEXT PRIMARY KEY,
  store_name TEXT DEFAULT 'My Store',
  store_logo TEXT,
  currency TEXT DEFAULT 'usd',
  tax_rate REAL DEFAULT 0.0,
  low_stock_threshold INTEGER DEFAULT 10,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## API Endpoints Created

### Orders
- `POST /api/admin/orders/[id]/update-status` - Update order status
- `POST /api/admin/orders/[id]/add-tracking` - Add tracking number
- `POST /api/admin/orders/[id]/refund` - Process refund (requires Stripe)

### Users
- `POST /api/admin/users/[id]/change-role` - Change user role
- `POST /api/admin/users/[id]/disable` - Disable user account
- `POST /api/admin/users/[id]/enable` - Enable user account

### Settings
- `POST /api/admin/settings/update` - Update store settings

### Finance
- `GET /api/admin/finance/export` - Export transactions to CSV

## Navigation

All admin pages include:
- Back to Dashboard link
- Role-appropriate action buttons
- Permission-based visibility

## Testing the System

1. **Create multiple users with different roles**
2. **Login as each role and verify**:
   - ADMIN sees everything
   - STAFF can manage products/orders but not users/settings
   - VIEWER can only see finance data
   - CUSTOMER cannot access `/admin` at all

3. **Test Actions**:
   - Update order status
   - Add tracking number
   - Change user role (as admin)
   - Try to modify your own account (should be prevented)
   - Export financial data
   - Update store settings

## Next Steps (Not Implemented Yet)

### Product Management Enhancements
- ✨ Bulk product upload via CSV
- ✨ Product image management
- ✨ Advanced product search/filtering

### Inventory Management
- ✨ Restock history tracking
- ✨ Automatic low-stock email notifications
- ✨ Inventory adjustments with reason codes

### Advanced Features
- ✨ Email templates for order notifications
- ✨ Shipping carrier integration
- ✨ Multi-currency support
- ✨ Advanced analytics/reports
- ✨ Discount code management (table exists, needs UI)
- ✨ Customer segmentation
- ✨ Automated fraud detection flags

## Files Created/Modified

### New Files
- `lib/permissions.ts` - Permission system
- `app/admin/page.tsx` - Enhanced dashboard
- `app/admin/orders/page.tsx` - Order list
- `app/admin/orders/[id]/page.tsx` - Order details
- `app/admin/users/page.tsx` - User list
- `app/admin/users/[id]/page.tsx` - User details
- `app/admin/finance/page.tsx` - Finance dashboard
- `app/admin/settings/page.tsx` - Settings page
- `app/api/admin/orders/[id]/*` - Order management APIs
- `app/api/admin/users/[id]/*` - User management APIs
- `app/api/admin/settings/update/route.ts` - Settings API
- `app/api/admin/finance/export/route.ts` - CSV export

### Modified Files
- `lib/sqlite.ts` - Added new tables and migrations
- `lib/auth.ts` - Enhanced with role checking and disabled user check
- `middleware.ts` - Improved with role-based route protection

## Important Notes

⚠️ **Stripe Refunds**: Refund functionality requires a valid Stripe secret key to be configured.

⚠️ **Database Migrations**: Run automatically on server start. Existing databases will be migrated safely.

⚠️ **First Admin**: Use environment variable method to create your first admin user.

✅ **Production Ready**: The permission system is designed for production use with proper role separation.
