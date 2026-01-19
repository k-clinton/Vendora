# 🛍️ Vendora - Full-Stack E-Commerce Platform

A modern, production-ready e-commerce platform built with Next.js 14, featuring real-time inventory management, secure payments, shopping cart, product search, reviews system, and a comprehensive admin dashboard.

## ✨ Features

### 🛒 Shopping Cart
- Client-side cart with localStorage persistence
- Real-time cart icon with item count badge
- Add to cart from product pages
- Full cart management (add, remove, update quantities)
- Stock limit enforcement
- Direct checkout from cart

### 🔍 Product Search & Filtering
- Full-text search across products
- Advanced filters (price range, in stock, category)
- Real-time search results
- Filter sidebar with multiple options
- Dedicated search results page

### ⭐ Product Reviews & Ratings
- 5-star rating system
- Written reviews with comments
- Average rating calculation
- One review per user per product
- Delete own reviews
- Admin moderation capabilities

### 🔐 Authentication (NextAuth v5)
- Google & GitHub OAuth providers
- Role-based access control (Admin/Customer)
- JWT-based sessions
- Protected routes and API endpoints

### 🛒 Product Management
- Product catalog with variants (sizes, colors, etc.)
- High-quality product images
- Real-time inventory tracking
- Low stock alerts for admins

### 💳 Payment Processing (Stripe)
- Secure checkout with Stripe Elements
- Payment Intent API for PCI compliance
- Webhook handling for payment events
- Automatic order creation on success
- Test mode support

### ⚡ Real-Time Features (Ably)
- Live inventory updates across all clients
- Automatic stock level synchronization
- WebSocket-based communication
- 15-minute reservation system during checkout

### 👨‍💼 Admin Dashboard
- Product management interface
- Inventory monitoring and alerts
- Order tracking and history
- User management
- Sales analytics overview

### 📦 Order Management
- Complete order history
- Order status tracking
- Email confirmation (ready for integration)
- Customer order portal

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- Google OAuth credentials
- GitHub OAuth credentials
- Stripe account (test mode)
- Ably account

### 1. Clone and Install

```bash
git clone <your-repo>
cd vendora
npm install --legacy-peer-deps
```

### 2. Environment Setup

Create `.env` file:

```env
# Core
NODE_ENV=development
DATABASE_PATH="./data/ecommerce.db"
PORT=3000

# Auth
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="<your-google-client-id>"
GOOGLE_CLIENT_SECRET="<your-google-client-secret>"
GITHUB_ID="<your-github-client-id>"
GITHUB_SECRET="<your-github-client-secret>"
ADMIN_EMAILS="admin@example.com"

# Stripe
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Ably
ABLY_API_KEY="<your-ably-api-key>"
```

Create `.env.local` file:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Seed Database

```bash
npm run seed
```

This creates sample products including:
- Premium Wireless Headphones
- Fitness Smart Watch
- Mechanical Wireless Keyboard
- USB-C Fast Charging Cables
- Aluminum Laptop Stand

### 4. Set Up OAuth (10 minutes)

Follow the detailed guide: **[OAUTH_SETUP.md](OAUTH_SETUP.md)**

Quick version:
- Get Google OAuth credentials
- Get GitHub OAuth credentials
- Generate NEXTAUTH_SECRET
- Update `.env` file

### 5. Set Up Stripe & Ably (8 minutes)

Follow the detailed guide: **[STRIPE_ABLY_SETUP.md](STRIPE_ABLY_SETUP.md)**

Quick version:
- Get Stripe test API keys
- Install Stripe CLI for webhooks
- Get Ably API key
- Update `.env` file

### 6. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

### 7. Test the Full Experience

1. **Browse Products**: http://localhost:3000/products
2. **Search**: Try searching for "wireless"
3. **Add to Cart**: Click "Add to Cart" on any product
4. **View Cart**: Click the cart icon (🛒)
5. **Checkout**: Use test card `4242 4242 4242 4242`
6. **Leave Review**: Sign in and write a review
7. **Check Orders**: View your order history

## 🧪 Testing

### Test Stripe Payments

Use these test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Use any future date for expiry and any 3-digit CVC.

### Webhook Testing (Local)

```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook signing secret to .env as STRIPE_WEBHOOK_SECRET
```

## 📁 Project Structure

```
vendora/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── auth/            # NextAuth endpoints
│   │   ├── ably/            # Real-time auth
│   │   ├── checkout/        # Payment intents
│   │   ├── stripe/          # Webhooks
│   │   ├── orders/          # Order management
│   │   ├── products/        # Product API
│   │   │   └── search/      # Product search ✨
│   │   └── reviews/         # Review API ✨
│   ├── admin/               # Admin dashboard
│   │   ├── products/        # Product management
│   │   └── inventory/       # Inventory management
│   ├── products/            # Product pages
│   │   └── search/          # Search results ✨
│   ├── orders/              # Order history
│   ├── checkout/            # Checkout flow
│   ├── cart/                # Shopping cart ✨
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── auth-button.tsx
│   ├── cart-provider.tsx      # ✨ Cart state
│   ├── cart-icon.tsx          # ✨ Cart UI
│   ├── checkout-form.tsx
│   ├── product-search.tsx     # ✨ Search UI
│   ├── product-reviews.tsx    # ✨ Reviews UI
│   ├── realtime-inventory.tsx
│   └── session-provider.tsx
├── lib/                     # Core libraries
│   ├── auth.ts             # NextAuth config
│   ├── auth-adapter.ts     # Custom SQLite adapter
│   ├── cart.ts             # ✨ Cart utilities
│   ├── db.ts               # Database helpers
│   ├── sqlite.ts           # Schema & initialization
│   ├── stripe.ts           # Stripe client
│   ├── realtime.ts         # Ably client
│   └── env.ts              # Environment validation
├── scripts/
│   └── seed.ts             # Database seeding
├── data/                    # SQLite database
│   └── ecommerce.db        # Created on first run
├── OAUTH_SETUP.md          # ✨ OAuth guide
├── STRIPE_ABLY_SETUP.md    # ✨ Payment/realtime guide
└── NEW_FEATURES.md         # ✨ New features docs
```

**✨ = New features added**

## 🗄️ Database Schema

**SQLite** with the following tables:

### Auth Tables (NextAuth)
- `users` - User accounts
- `accounts` - OAuth provider accounts
- `sessions` - Session storage
- `verification_tokens` - Email verification

### E-Commerce Tables
- `products` - Product catalog
- `product_variants` - Product variations (size, color, etc.)
- `inventory` - Stock levels per variant
- `reservations` - Temporary holds during checkout
- `orders` - Completed orders
- `order_items` - Order line items
- `categories` - Product categories
- `reviews` - Product reviews (future)
- `discounts` - Discount codes (future)

## 🔧 Key Technologies

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite with better-sqlite3
- **Auth**: NextAuth v5
- **Payments**: Stripe
- **Real-time**: Ably
- **Styling**: Inline styles (easily replaceable)
- **Validation**: Zod

## 🌐 Deployment

### Deploy to Render

1. Push code to GitHub
2. Connect repository to Render
3. Add all environment variables
4. Deploy!

The project includes `render.yaml` with:
- Automatic builds
- Persistent disk for SQLite
- Health checks
- Auto-healing

### Environment Variables for Production

Remember to update:
- `NEXTAUTH_URL` to your production domain
- OAuth redirect URLs in Google/GitHub
- Stripe webhook endpoint in dashboard
- Use production Stripe keys
- Use production Ably key

## 📝 API Endpoints

### Public
- `GET /api/health` - Health check
- `GET /api/health/db` - Database health
- `GET /api/products` - List products
- `GET /api/products/[slug]` - Product details

### Authenticated
- `POST /api/checkout/create-payment-intent` - Start checkout
- `GET /api/orders` - User's orders
- `POST /api/orders` - Create order (webhook)

### Admin Only
- Protected via middleware at `/admin/*`

### Webhooks
- `POST /api/stripe/webhook` - Stripe events

## 🔒 Security Features

- JWT-based authentication
- CSRF protection (NextAuth)
- Webhook signature verification
- Role-based access control
- SQL injection prevention (prepared statements)
- Environment variable validation

## 🎯 Future Enhancements

- [x] ~~Shopping cart with multiple items~~ ✅ **Completed!**
- [x] ~~Product search and filtering~~ ✅ **Completed!**
- [x] ~~Customer reviews and ratings~~ ✅ **Completed!**
- [ ] Email notifications (SendGrid/AWS SES)
- [ ] Discount codes and promotions
- [ ] Shipping calculator and tracking
- [ ] Product image uploads (S3/Cloudinary)
- [ ] Advanced analytics dashboard
- [ ] Abandoned cart recovery emails
- [ ] Multi-currency support
- [ ] Wishlist functionality
- [ ] Compare products feature
- [ ] Product recommendations
- [ ] Gift cards

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

Built with ❤️ using Next.js, Stripe, and Ably
