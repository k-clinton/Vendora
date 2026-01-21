# Admin Dashboard - Quick Start Guide

## 🚀 Getting Started (3 Steps)

### Step 1: Create Your First Admin
Add this to your `.env.local` file:
```env
ADMIN_EMAILS=your@email.com
```

### Step 2: Restart Your Dev Server
```bash
npm run dev
```

### Step 3: Access the Dashboard
Navigate to: **http://localhost:3000/admin**

---

## 📊 What You Get

### Main Dashboard (`/admin`)
- **Revenue Analytics**: Today, 7 days, 30 days
- **Key Metrics**: Orders, users, low stock alerts
- **Top Selling Products**
- **Recent Orders Overview**

### Order Management (`/admin/orders`)
- Filter by status (Pending, Completed, Cancelled)
- Search orders
- Update order status
- Add tracking numbers
- Process refunds (Admin only)

### User Management (`/admin/users`)
- View all users
- Filter by role
- Change user roles
- Disable/enable accounts
- View user order history

### Finance Dashboard (`/admin/finance`)
- Transaction history
- Revenue analytics
- Payment status tracking
- Export to CSV

### Settings (`/admin/settings`)
- Store name, logo, currency
- Tax rate configuration
- Low stock threshold

---

## 👥 User Roles

| Role | Access |
|------|--------|
| **ADMIN** | Full access to everything |
| **STAFF** | Products, Orders, Inventory (no Users/Settings) |
| **VIEWER** | Dashboard and Finance only (read-only) |
| **CUSTOMER** | No admin access |

---

## 🔐 Security Features

✅ **Database-driven roles** (not hardcoded like `admin === true`)  
✅ **Middleware protection** on all admin routes  
✅ **Permission-based access control**  
✅ **Self-modification prevention**  
✅ **Activity logging** for all admin actions  
✅ **Disabled account checking**  

---

## 🎯 Common Tasks

### Change a User's Role
1. Go to `/admin/users`
2. Find the user and click "View"
3. Select new role from dropdown
4. Click "Update Role"

### Process a Refund
1. Go to `/admin/orders`
2. Click on an order
3. Scroll to "Actions" panel
4. Enter refund amount and reason
5. Click "Issue Refund"

### View Revenue Reports
1. Go to `/admin/finance`
2. Select time period (7, 30, 90, 365 days)
3. Click "Export CSV" to download

### Update Store Settings
1. Go to `/admin/settings`
2. Update store name, currency, tax rate, etc.
3. Click "Save Settings"

---

## 📁 Key Files

- `lib/permissions.ts` - Permission definitions
- `lib/auth.ts` - Enhanced authentication
- `middleware.ts` - Route protection
- `ADMIN_DASHBOARD_GUIDE.md` - Detailed documentation

---

## 🐛 Troubleshooting

**Can't access `/admin`?**
- Make sure your email is in `ADMIN_EMAILS` in `.env.local`
- Restart the dev server after changing `.env.local`
- Check you're logged in

**"Permission denied" error?**
- Your role doesn't have access to that section
- Ask an ADMIN to change your role

**Refunds not working?**
- Ensure `STRIPE_SECRET_KEY` is set in `.env.local`
- Only works with real Stripe payment intents

---

## ✨ Next Steps

After setting up admin access:
1. ✅ Add more admin users
2. ✅ Configure store settings
3. ✅ Review existing orders
4. ✅ Check inventory levels
5. ✅ Explore the finance dashboard

For complete documentation, see **ADMIN_DASHBOARD_GUIDE.md**
