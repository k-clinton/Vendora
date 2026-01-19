# 💳 Stripe & ⚡ Ably Setup Guide

Quick guide to get Stripe payments and Ably real-time features working.

---

## 💳 Stripe Setup (5 minutes)

### Step 1: Create Stripe Account

Visit: https://stripe.com/ and sign up for a free account.

### Step 2: Get Test API Keys

1. After signing in, you'll be in **Test Mode** (toggle in top right)
2. Go to: https://dashboard.stripe.com/test/apikeys
3. Copy your keys:
   - **Publishable key**: Starts with `pk_test_`
   - **Secret key**: Click "Reveal test key", starts with `sk_test_`

### Step 3: Add to Environment Variables

Add to `.env`:
```env
STRIPE_SECRET_KEY="sk_test_51..."
STRIPE_PUBLISHABLE_KEY="pk_test_51..."
```

Add to `.env.local`:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51..."
```

### Step 4: Set Up Webhooks (Local Testing)

#### Install Stripe CLI

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows:**
Download from: https://github.com/stripe/stripe-cli/releases

**Linux:**
```bash
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.0/stripe_1.19.0_linux_x86_64.tar.gz
tar -xvf stripe_1.19.0_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

#### Login to Stripe CLI

```bash
stripe login
```

This will open your browser to authorize the CLI.

#### Forward Webhooks to Local Server

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_abc123xyz789...
```

Copy the webhook signing secret and add to `.env`:
```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

#### Keep Stripe CLI Running

Leave this terminal window open while developing. The CLI will forward all webhook events to your local server.

### Step 5: Test Payment

Use these test cards:

**Success:**
```
Card: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Decline:**
```
Card: 4000 0000 0000 0002
```

**3D Secure (requires authentication):**
```
Card: 4000 0025 0000 3155
```

---

## ⚡ Ably Setup (3 minutes)

### Step 1: Create Ably Account

Visit: https://ably.com/signup

### Step 2: Create an App

1. After signing in, click **"Create New App"**
2. Name: **"Vendora"**
3. Click **"Create app"**

### Step 3: Get API Key

1. Click on your new app
2. Go to **"API Keys"** tab
3. Copy the **Root API Key** (starts with your app ID)
   - It looks like: `appId.keyId:keySecret`

### Step 4: Add to Environment Variables

Add to `.env`:
```env
ABLY_API_KEY="your-app-id.your-key-id:your-key-secret"
```

### Step 5: Test Real-time Updates

1. Open product page in two browser windows
2. In one window, make a purchase
3. Watch the inventory update in real-time in both windows!

---

## 🧪 Testing the Complete Flow

### 1. Start Your Server

```bash
# Terminal 1: Your app
npm run dev

# Terminal 2: Stripe webhook forwarding
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 2. Test Shopping Cart

1. Go to http://localhost:3000/products
2. Click on a product
3. Click **"Add to Cart"**
4. See cart badge update (🛒 with number)
5. Click cart icon to view cart
6. Adjust quantities
7. Click **"Proceed to Checkout"**

### 3. Test Payment

1. Enter test card: `4242 4242 4242 4242`
2. Enter any future expiry and CVC
3. Click **"Pay Now"**
4. Wait for redirect to success page
5. Check the Stripe CLI terminal - you should see webhook events:
   ```
   payment_intent.created
   payment_intent.succeeded
   ```

### 4. Verify Order Created

1. Go to http://localhost:3000/orders
2. See your order listed
3. Check order details

### 5. Test Real-time Inventory

1. Open product page in two browser tabs
2. In tab 1: Add to cart (inventory should drop)
3. Watch tab 2: Inventory should update automatically without refresh!

### 6. Test Search

1. Go to http://localhost:3000/products
2. Type in search box: "wireless"
3. See filtered results
4. Try filters: In Stock Only, Price Range

### 7. Test Reviews

1. Sign in with OAuth
2. Go to a product page
3. Click **"Write a Review"**
4. Select rating and add comment
5. Submit review
6. See your review appear instantly
7. Check that average rating updates

---

## 🚀 Production Webhook Setup

When you deploy to production:

### Step 1: Create Webhook Endpoint in Stripe

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Click **"Add endpoint"**

### Step 2: Get Webhook Signing Secret

1. Click on your newly created webhook
2. Reveal the **Signing secret** (starts with `whsec_`)
3. Add to your production environment variables

### Step 3: Update to Live Keys (when ready)

1. Toggle to **Live mode** in Stripe dashboard
2. Get your live API keys
3. Update production environment variables:
   ```env
   STRIPE_SECRET_KEY="sk_live_..."
   STRIPE_PUBLISHABLE_KEY="pk_live_..."
   ```

---

## 🔍 Webhook Event Testing

You can test webhook events manually:

### Send Test Webhook via Stripe CLI

```bash
# Test successful payment
stripe trigger payment_intent.succeeded

# Test failed payment
stripe trigger payment_intent.payment_failed
```

### View Webhook Logs

Dashboard: https://dashboard.stripe.com/test/webhooks

Here you can:
- See all webhook events
- Retry failed webhooks
- View request/response details
- Test your endpoint

---

## 🐛 Troubleshooting

### Stripe Issues

**"No such payment intent"**
- Check that webhook secret matches
- Verify Stripe CLI is running
- Check server logs for errors

**Payments not completing**
- Verify publishable key in `.env.local`
- Check browser console for errors
- Ensure client secret is valid

### Ably Issues

**Inventory not updating in real-time**
- Check Ably API key is correct
- Look for connection errors in browser console
- Verify `/api/ably/auth` endpoint is accessible

**"Failed to connect to Ably"**
- Check API key format (should have colon)
- Verify key has correct permissions
- Check browser network tab for 401 errors

### General Issues

**Environment variables not loading**
- Restart your development server
- Check `.env` and `.env.local` files exist
- Verify no typos in variable names

**Webhooks not triggering**
- Ensure Stripe CLI is running
- Check webhook events are selected
- Look at Stripe CLI output for errors

---

## 📊 What Events Are Handled

### Stripe Webhooks

Your app handles these events:

1. **`payment_intent.succeeded`**
   - Captures inventory reservations
   - Creates order record
   - Publishes inventory updates via Ably

2. **`payment_intent.payment_failed`**
   - Releases inventory reservations
   - Publishes inventory updates via Ably

3. **`payment_intent.canceled`**
   - Releases inventory reservations
   - Publishes inventory updates via Ably

### Ably Channels

Your app uses these channels:

- **`inventory:{variantId}`** - Real-time stock updates per product variant
  - Event: `update`
  - Payload: `{ variantId, available }`

---

## ✅ Success Checklist

After setup, verify:

- [ ] Can make test payment with `4242 4242 4242 4242`
- [ ] Webhook events appear in Stripe CLI
- [ ] Order is created after successful payment
- [ ] Inventory is reserved during checkout
- [ ] Inventory updates in real-time across tabs
- [ ] Failed payments release inventory
- [ ] Cart persists in localStorage
- [ ] Can search and filter products
- [ ] Can write and view reviews

---

## 💰 Pricing

**Stripe:**
- **Test Mode**: Free
- **Live Mode**: 2.9% + 30¢ per successful charge

**Ably:**
- **Free Tier**: 3 million messages/month, 200 concurrent connections
- Plenty for testing and small production use!

---

## 📚 Resources

- [Stripe Testing Cards](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Ably Documentation](https://ably.com/docs)
- [Ably Quickstart](https://ably.com/docs/quick-start-guide)

---

## 🎉 You're All Set!

Your payment processing and real-time features are now fully configured!

**Time to complete**: 8-10 minutes total
