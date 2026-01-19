# 🚀 Getting Started with Vendora

Welcome! This guide will get you up and running quickly.

---

## 📋 Quick Setup (20 minutes)

### 1. Install Dependencies (2 min)

```bash
npm install --legacy-peer-deps
```

### 2. Seed Database (1 min)

```bash
npm run seed
```

This creates 5 sample products with variants and inventory.

### 3. Set Up OAuth (10 min)

**See detailed guide**: [OAUTH_SETUP.md](OAUTH_SETUP.md)

Quick steps:
1. Get Google OAuth credentials → https://console.cloud.google.com/
2. Get GitHub OAuth credentials → https://github.com/settings/developers
3. Generate secret: `openssl rand -base64 32`
4. Update `.env` file

### 4. Set Up Stripe & Ably (7 min)

**See detailed guide**: [STRIPE_ABLY_SETUP.md](STRIPE_ABLY_SETUP.md)

Quick steps:
1. Get Stripe test keys → https://dashboard.stripe.com/test/apikeys
2. Get Ably API key → https://ably.com/signup
3. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
4. Update `.env` and `.env.local` files

### 5. Start Development Server

```bash
# Terminal 1: Your app
npm run dev

# Terminal 2: Stripe webhooks (for payments)
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 6. Open Your Browser

Visit: **http://localhost:3000**

---

## 🎮 Feature Tour

### 1. Browse Products (No setup required!)

- Visit http://localhost:3000/products
- See 5 sample products with images
- Click on any product to see details
- View variants and stock levels

**Works immediately after seeding!** ✅

### 2. Shopping Cart

**Try this:**
1. Click "Add to Cart" on any product
2. See cart badge (🛒) update
3. Click cart icon to view cart
4. Adjust quantities with +/- buttons
5. Click "Proceed to Checkout"

**Features:**
- Persists in browser (try refreshing!)
- Shows item count
- Enforces stock limits
- Calculates totals

### 3. Product Search

**Try this:**
1. Go to /products
2. Type "wireless" in search box
3. See filtered results
4. Try price range filter (e.g., 0-20000 cents = $0-$200)
5. Toggle "In Stock Only"
6. Click "Clear" to reset

**Search tips:**
- Searches title, description, and variant names
- Price is in cents (1000 = $10.00)
- Combine multiple filters

### 4. Complete Purchase (Requires OAuth + Stripe setup)

**Try this:**
1. Add items to cart
2. Click cart icon → "Proceed to Checkout"
3. Enter test card: `4242 4242 4242 4242`
4. Any future expiry (e.g., 12/34)
5. Any CVC (e.g., 123)
6. Click "Pay Now"
7. See success page
8. Check /orders for your order

**Watch the magic:**
- Inventory automatically reserved during checkout
- Real-time stock updates
- Webhook creates order record
- You'll see events in Stripe CLI terminal

### 5. Product Reviews (Requires OAuth setup)

**Try this:**
1. Sign in with Google or GitHub
2. Go to any product page
3. Scroll to reviews section
4. Click "Write a Review"
5. Select star rating
6. Add optional comment
7. Submit
8. See your review appear instantly

**Features:**
- One review per product per user
- Average rating shown
- Can delete own reviews
- Admin can moderate

### 6. Real-Time Inventory (Requires Ably setup)

**Try this:**
1. Open same product in 2 browser tabs
2. In Tab 1: Add to cart
3. Watch Tab 2: Stock updates automatically!

**No page refresh needed** - powered by WebSockets

### 7. Admin Dashboard (Requires admin email in .env)

**Try this:**
1. Add your email to `ADMIN_EMAILS` in `.env`
2. Sign out and sign in again
3. Click "Admin" link in navigation
4. See dashboard with metrics
5. Click "Manage Products"
6. Click "Manage Inventory"

**Features:**
- View all products
- Monitor inventory levels
- See low stock alerts
- Track all orders

---

## 🧪 Testing Scenarios

### Scenario 1: Quick Shopping Experience (3 min)

**No OAuth needed - works immediately!**

```
1. npm run dev
2. Visit /products
3. Click on "Premium Wireless Headphones"
4. Click "Add to Cart"
5. Click cart icon (🛒)
6. See your cart with item
7. Adjust quantity
8. Continue shopping or view as guest
```

### Scenario 2: Full Purchase Flow (5 min)

**Requires: OAuth + Stripe setup**

```
1. Sign in with Google/GitHub
2. Add multiple products to cart
3. Go to cart page
4. Click "Proceed to Checkout"
5. Enter card: 4242 4242 4242 4242
6. Complete payment
7. Visit /orders to see order
8. Check Stripe CLI for webhook events
```

### Scenario 3: Product Discovery (2 min)

**No setup needed!**

```
1. Go to /products
2. Search for "cable"
3. Apply price filter: Max 2000 (=$20)
4. Toggle "In Stock Only"
5. Browse filtered results
6. Clear filters
7. Try searching "smart"
```

### Scenario 4: Community Reviews (3 min)

**Requires: OAuth setup**

```
1. Sign in
2. Browse to any product
3. Scroll to reviews section
4. Click "Write a Review"
5. Rate 5 stars
6. Add comment: "Excellent quality!"
7. Submit review
8. See average rating update
9. Try to review again (should be blocked)
```

---

## 📊 What Works Without Setup?

### ✅ Works Immediately (No API keys needed)

- Browse products catalog
- View product details
- See inventory levels
- Search products
- Filter by price/stock
- Add to cart
- View cart
- Remove from cart

### 🔑 Requires API Keys

| Feature | Requires |
|---------|----------|
| Sign In | OAuth (Google/GitHub) |
| Checkout | Stripe + OAuth |
| Orders | Stripe + OAuth |
| Reviews | OAuth |
| Real-time Updates | Ably |
| Admin Panel | OAuth + Admin Email |

---

## 🎯 Recommended Setup Order

### Minimal Demo (5 min)
```bash
npm install --legacy-peer-deps
npm run seed
npm run dev
# Browse products, add to cart, search
```

### With Authentication (15 min)
```bash
# Setup OAuth (see OAUTH_SETUP.md)
# Can now: sign in, write reviews, access admin
```

### Full E-Commerce (25 min)
```bash
# Setup Stripe + Ably (see STRIPE_ABLY_SETUP.md)
# Can now: complete purchases, real-time updates
```

---

## 🐛 Common Issues

### "Module not found" errors
```bash
npm install --legacy-peer-deps
```

### Cart icon not showing count
- Cart provider must wrap app (already done!)
- Check browser console for errors
- Clear localStorage and try again

### Search returns no results
- Make sure you ran `npm run seed`
- Check that products are marked as `active = 1`
- Try searching "wireless" or "smart"

### Payment not completing
- Verify Stripe keys in `.env` and `.env.local`
- Check Stripe CLI is running
- Look for webhook events in CLI output

### Reviews not showing
- Sign in first
- Check that product ID is valid
- Look for errors in browser console

### Admin link not visible
- Add your email to `ADMIN_EMAILS` in `.env`
- Sign out and sign in again
- Check that email matches exactly

---

## 📚 Documentation Index

- **README.md** - Project overview and features
- **SETUP.md** - Detailed setup instructions
- **OAUTH_SETUP.md** - OAuth configuration guide
- **STRIPE_ABLY_SETUP.md** - Payment & real-time setup
- **NEW_FEATURES.md** - Shopping cart, search, reviews docs
- **GETTING_STARTED.md** - This file!
- **QUICKSTART.md** - Minimal setup guide

---

## 💡 Pro Tips

### Tip 1: Use Test Mode
Always use Stripe test mode during development. Never use live keys!

### Tip 2: Check Stripe CLI
Watch the Stripe CLI terminal to see webhook events in real-time.

### Tip 3: Browser Console
Keep browser console open during testing to catch any errors.

### Tip 4: Database Reset
If you need to reset: Delete `./data/ecommerce.db` and run `npm run seed` again.

### Tip 5: Multiple Browsers
Test real-time features by opening the same page in multiple browsers.

---

## ✅ Success Checklist

After setup, you should be able to:

- [ ] Browse products at /products
- [ ] Search for "wireless"
- [ ] Add item to cart
- [ ] See cart badge update
- [ ] View cart page
- [ ] Sign in with Google
- [ ] Sign in with GitHub
- [ ] Write a product review
- [ ] Complete a test payment
- [ ] See order in /orders
- [ ] View admin dashboard (if admin)
- [ ] See real-time inventory updates

---

## 🎉 You're Ready!

Pick your setup level:
- **Quick Demo** → Just run `npm run seed` and `npm run dev`
- **With Auth** → Add OAuth setup (15 min)
- **Full Experience** → Add Stripe + Ably (25 min total)

Happy coding! 🚀

---

**Need Help?**
- Check the detailed guides in other .md files
- Review troubleshooting sections
- Look at code comments
- Check browser console for errors
