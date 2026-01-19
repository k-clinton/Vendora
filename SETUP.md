# Vendora - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

#### Required Services:

**NextAuth (Authentication)**
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Set to `http://localhost:3000` for development
- `ADMIN_EMAILS`: Comma-separated list of admin emails

**Google OAuth** (https://console.cloud.google.com/)
- Create OAuth 2.0 credentials
- Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
- Copy Client ID and Client Secret

**GitHub OAuth** (https://github.com/settings/developers)
- Create new OAuth App
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
- Copy Client ID and Client Secret

**Stripe** (https://dashboard.stripe.com/test/apikeys)
- Get your test API keys (Publishable and Secret)
- For webhooks: Install Stripe CLI and run `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Copy the webhook signing secret

**Ably** (https://ably.com/accounts/any/apps)
- Create a new app
- Copy your API Key

### 3. Create `.env.local` for Frontend Variables

```bash
echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_..." > .env.local
```

### 4. Seed the Database

```bash
npm run seed
```

This will create:
- Sample products (headphones, smart watch, keyboard, cables, laptop stand)
- Product variants with different options
- Initial inventory levels

### 5. Start the Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Features

### ✅ Authentication (NextAuth v5)
- Google OAuth
- GitHub OAuth
- Role-based access control (Admin/Customer)
- JWT sessions

### ✅ Products
- Product catalog with variants
- Image support via Unsplash
- Inventory tracking per variant

### ✅ Payments (Stripe)
- Payment Intent API
- Stripe Elements checkout
- Webhook handling for payment events
- Automatic order creation

### ✅ Real-time Inventory (Ably)
- Live inventory updates
- Real-time stock availability
- Reservation system with TTL (15 minutes)

### ✅ Admin Panel
- Product management
- Inventory monitoring
- Order tracking
- Low stock alerts

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth endpoints
│   │   ├── checkout/     # Payment intent creation
│   │   ├── stripe/       # Stripe webhooks
│   │   ├── orders/       # Order management
│   │   └── products/     # Product API
│   ├── admin/            # Admin dashboard
│   ├── products/         # Product pages
│   ├── orders/           # Order history
│   └── checkout/         # Checkout flow
├── components/           # React components
├── lib/                  # Core libraries
│   ├── auth.ts          # NextAuth config
│   ├── db.ts            # Database helpers
│   ├── stripe.ts        # Stripe client
│   ├── realtime.ts      # Ably client
│   └── sqlite.ts        # SQLite schema
└── scripts/
    └── seed.ts          # Database seeding

```

## Database Schema

SQLite database with the following tables:
- `users`, `accounts`, `sessions` (NextAuth)
- `products`, `product_variants` (Catalog)
- `inventory` (Stock management)
- `reservations` (Temporary holds during checkout)
- `orders`, `order_items` (Order tracking)
- `categories`, `reviews`, `discounts` (Future features)

## Testing the Flow

### As a Customer:
1. Browse products at `/products`
2. Click on a product to see details
3. Click "Buy Now" to start checkout
4. Complete payment with Stripe test card: `4242 4242 4242 4242`
5. See success message and check `/orders`

### As an Admin:
1. Set your email in `ADMIN_EMAILS`
2. Sign in with that email
3. Visit `/admin` to see dashboard
4. Manage products and inventory
5. View all orders

## Stripe Testing

Use these test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

Use any future expiry date and any 3-digit CVC.

## Stripe Webhook Testing

### Local Development:
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook signing secret to .env
```

## Deployment (Render)

The project includes `render.yaml` for easy deployment:

1. Push to GitHub
2. Connect repository to Render
3. Add environment variables in Render dashboard
4. Deploy!

The SQLite database will persist on a mounted disk at `/app/data`.

## Troubleshooting

**Database locked errors:**
- SQLite uses WAL mode for better concurrency
- Make sure `./data` directory exists and is writable

**Auth not working:**
- Verify OAuth callback URLs match your environment
- Check `NEXTAUTH_URL` is set correctly
- Ensure `NEXTAUTH_SECRET` is at least 32 characters

**Stripe webhook failing:**
- Make sure Stripe CLI is running for local development
- Verify `STRIPE_WEBHOOK_SECRET` matches the CLI output
- Check webhook signature in Stripe dashboard for production

**Realtime not updating:**
- Verify Ably API key is valid
- Check browser console for connection errors
- Ensure `/api/ably/auth` endpoint is accessible

## Next Steps

- [ ] Add shopping cart functionality
- [ ] Implement product search and filtering
- [ ] Add product reviews and ratings
- [ ] Set up email notifications
- [ ] Add discount codes
- [ ] Implement shipping address collection
- [ ] Add product image uploads
- [ ] Create customer dashboard
- [ ] Add analytics and reporting
- [ ] Implement abandoned cart recovery

## License

MIT
