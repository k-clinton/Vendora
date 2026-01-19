# 🔐 OAuth Setup Guide

This guide will walk you through setting up OAuth authentication with Google and GitHub for your Vendora e-commerce platform.

---

## 📋 Prerequisites

- A Google account
- A GitHub account
- Your application running (or ready to deploy)
- The callback URLs for your environment

### Callback URLs

**Local Development:**
- Google: `http://localhost:3000/api/auth/callback/google`
- GitHub: `http://localhost:3000/api/auth/callback/github`

**Production:**
- Google: `https://yourdomain.com/api/auth/callback/google`
- GitHub: `https://yourdomain.com/api/auth/callback/github`

---

## 🟦 Google OAuth Setup

### Step 1: Go to Google Cloud Console

Visit: https://console.cloud.google.com/

### Step 2: Create a New Project (or select existing)

1. Click on the project dropdown at the top
2. Click "New Project"
3. Enter project name: **"Vendora"** (or your preferred name)
4. Click "Create"
5. Wait for the project to be created (takes a few seconds)
6. Select your new project from the dropdown

### Step 3: Enable Google+ API

1. In the left sidebar, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click on it and press **"Enable"**

### Step 4: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** user type
3. Click **"Create"**

4. Fill in the required fields:
   - **App name**: Vendora
   - **User support email**: your-email@example.com
   - **Developer contact**: your-email@example.com
   
5. Click **"Save and Continue"**

6. **Scopes**: Click **"Save and Continue"** (use defaults)

7. **Test users**: 
   - Click **"Add Users"**
   - Add your email address (and any others you want to test with)
   - Click **"Save and Continue"**

8. Review and click **"Back to Dashboard"**

### Step 5: Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Select application type: **"Web application"**
4. Name: **"Vendora Web Client"**

5. Add **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   ```

6. Add **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/google
   ```

7. Click **"Create"**

8. **Copy your credentials:**
   - **Client ID**: (starts with something like `123456789-xxx.apps.googleusercontent.com`)
   - **Client Secret**: (random string)

### Step 6: Add to Environment Variables

Add to your `.env` file:
```env
GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
```

---

## 🐙 GitHub OAuth Setup

### Step 1: Go to GitHub Developer Settings

Visit: https://github.com/settings/developers

Or navigate:
1. Click your profile picture (top right)
2. Settings → Developer settings → OAuth Apps

### Step 2: Create New OAuth App

1. Click **"New OAuth App"**

2. Fill in the form:
   - **Application name**: Vendora
   - **Homepage URL**: `http://localhost:3000`
   - **Application description**: E-commerce platform with real-time inventory
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`

3. Click **"Register application"**

### Step 3: Generate Client Secret

1. You'll see your **Client ID** displayed
2. Click **"Generate a new client secret"**
3. **Copy both values immediately** (you can only see the secret once!)

### Step 4: Add to Environment Variables

Add to your `.env` file:
```env
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
```

---

## 🔒 NextAuth Secret

You also need a secret key for NextAuth to encrypt JWT tokens.

### Generate a Secret

Run this command in your terminal:

```bash
openssl rand -base64 32
```

Or use this Node.js script:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Add to Environment Variables

Add to your `.env` file:
```env
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 📝 Complete .env File Example

Your `.env` file should now look like this:

```env
# Core
NODE_ENV=development
DATABASE_PATH="./data/ecommerce.db"
PORT=3000

# Auth
NEXTAUTH_SECRET="abc123XYZ789+/randomBase64String=="
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abcdefghijklmnopqrstuvwxyz"
GITHUB_ID="Iv1.a1b2c3d4e5f6g7h8"
GITHUB_SECRET="0123456789abcdef0123456789abcdef01234567"
ADMIN_EMAILS="admin@example.com,you@example.com"

# Stripe (use test keys)
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Ably
ABLY_API_KEY="your-ably-api-key"
```

---

## ✅ Testing OAuth

### Step 1: Restart Your Server

After updating `.env`, restart your development server:

```bash
npm run dev
```

### Step 2: Test Sign In

1. Visit http://localhost:3000
2. Click **"Sign in with Google"** or **"Sign in with GitHub"**
3. Authorize the application
4. You should be redirected back and signed in!

### Step 3: Make Yourself an Admin

1. Sign in with your account
2. Note the email you signed in with
3. Add it to `ADMIN_EMAILS` in `.env`:
   ```env
   ADMIN_EMAILS="your-email@example.com"
   ```
4. Restart the server
5. Sign out and sign in again
6. You should now see an "Admin" link in the navigation

---

## 🚀 Production Setup

When deploying to production, you need to:

### 1. Update Google OAuth

1. Go back to Google Cloud Console
2. Go to your OAuth client credentials
3. Add your production URLs:
   - **Authorized JavaScript origins**: `https://yourdomain.com`
   - **Authorized redirect URIs**: `https://yourdomain.com/api/auth/callback/google`

### 2. Update GitHub OAuth

1. Go back to GitHub OAuth Apps
2. Click on your application
3. Update:
   - **Homepage URL**: `https://yourdomain.com`
   - **Authorization callback URL**: `https://yourdomain.com/api/auth/callback/github`

### 3. Update Environment Variables

On your production server (e.g., Render):
```env
NEXTAUTH_URL="https://yourdomain.com"
```

Keep the same Client IDs and Secrets!

---

## 🐛 Troubleshooting

### Error: "Redirect URI mismatch"

**Problem**: The callback URL doesn't match what's configured.

**Solution**:
- Double-check the redirect URI in Google/GitHub matches exactly
- Make sure there are no trailing slashes
- Verify `NEXTAUTH_URL` in `.env` is correct

### Error: "Invalid client"

**Problem**: Client ID or Secret is incorrect.

**Solution**:
- Copy the credentials again from Google/GitHub
- Make sure there are no extra spaces
- Restart your server after updating `.env`

### Error: "Access blocked: This app's request is invalid"

**Problem**: OAuth consent screen not configured or app not verified.

**Solution**:
- Complete the OAuth consent screen setup in Google Cloud Console
- Add yourself as a test user
- For production, submit for verification (only needed for >100 users)

### Users can't sign in (only you can)

**Problem**: Google OAuth app is in "Testing" mode.

**Solution**:
- Go to OAuth consent screen in Google Cloud Console
- Add users as "Test users"
- OR publish your app (requires verification for production use)

### "User not found" after sign in

**Problem**: User was created but session is invalid.

**Solution**:
- Check that `NEXTAUTH_SECRET` is set and at least 32 characters
- Clear your browser cookies
- Try signing in again

---

## 📸 Visual Guide

### Google OAuth - Key Screens

**1. Create OAuth Client**
```
APIs & Services → Credentials → Create Credentials → OAuth client ID
```

**2. Authorized redirect URIs**
```
Add: http://localhost:3000/api/auth/callback/google
```

**3. Copy credentials**
```
Client ID and Client Secret will be shown - copy both!
```

### GitHub OAuth - Key Screens

**1. New OAuth App**
```
Settings → Developer settings → OAuth Apps → New OAuth App
```

**2. Application settings**
```
Callback URL: http://localhost:3000/api/auth/callback/github
```

**3. Generate secret**
```
Click "Generate a new client secret" and copy immediately
```

---

## 🎓 Additional Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps)
- [NextAuth.js Documentation](https://next-auth.js.org/)

---

## ✨ Success!

Once you've completed these steps:
- ✅ Users can sign in with Google
- ✅ Users can sign in with GitHub
- ✅ Admins can access admin dashboard
- ✅ Sessions are secure and persistent

Your authentication system is now fully functional! 🎉

**Time to complete**: 10-15 minutes for first-time setup
