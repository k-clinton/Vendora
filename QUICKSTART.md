# 🚀 Quick Start Guide

## Minimum Setup to Get Running

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment

**Critical: You need actual OAuth credentials to test authentication.**

For a quick test without auth, you can bypass by:
1. Setting placeholder values in `.env`
2. Commenting out auth provider usage temporarily

Or get real credentials:
- **Google**: https://console.cloud.google.com/ (5 minutes)
- **GitHub**: https://github.com/settings/developers (2 minutes)
- **Stripe**: https://dashboard.stripe.com/test/apikeys (already have test keys)
- **Ably**: https://ably.com/signup (free tier available)

### 3. Seed Database
```bash
npm run seed
```

Output:
```
✓ SQLite database schema initialized
🌱 Seeding database...
✓ Seeded 5 products
```

### 4. Run Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

## What You'll See

### Without Authentication
- ✅ Browse products at `/products`
- ✅ View product details
- ✅ See inventory levels
- ❌ Cannot checkout (needs Stripe)
- ❌ Cannot access orders
- ❌ Cannot access admin

### With Full Setup
- ✅ Complete OAuth sign-in
- ✅ Full checkout flow with Stripe
- ✅ Order history
- ✅ Real-time inventory updates
- ✅ Admin dashboard (if your email is in ADMIN_EMAILS)

## Testing Checklist

- [ ] Home page loads
- [ ] Products page shows 5 products
- [ ] Click on a product to see details
- [ ] See stock levels
- [ ] Sign in with Google/GitHub (if configured)
- [ ] Click "Buy Now" (redirects to checkout)
- [ ] Complete payment with test card: 4242 4242 4242 4242
- [ ] See success page
- [ ] Check `/orders` for order history
- [ ] Admin users can access `/admin`

## Common Issues

**"Module not found" errors**: Run `npm install --legacy-peer-deps`

**Database errors**: Delete `./data/ecommerce.db` and run `npm run seed` again

**Auth not working**: 
- Check OAuth redirect URIs match `http://localhost:3000/api/auth/callback/[provider]`
- Verify `NEXTAUTH_SECRET` is at least 32 characters
- Ensure `NEXTAUTH_URL` is set correctly

**Stripe errors**: 
- Add publishable key to `.env.local` as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- For webhooks, use Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

## Quick Demo (No Auth Required)

To test the product catalog without setting up auth:

1. Run `npm run seed`
2. Run `npm run dev`
3. Visit `http://localhost:3000/products`
4. Browse the 5 seeded products
5. View inventory levels and variants

This demonstrates the database, API routes, and UI components work correctly!
