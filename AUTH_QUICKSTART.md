# Authentication Quick Start

## 🚀 Test the New Features (3 Minutes)

### Test 1: Email Verification Flow ✅

1. **Register a new account:**
   - Go to: http://localhost:3000/auth/register
   - Fill in name, email, password
   - Notice the eye icon to show/hide password 👁️
   - Click "Sign Up"

2. **Check verification email:**
   - Look at your terminal/console
   - You'll see: `📧 Email sent (development mode):`
   - Copy the verification URL

3. **Verify email:**
   - Paste the URL in browser
   - See success message ✅
   - Auto-redirect to sign in

4. **Sign in:**
   - Use your credentials
   - Should work! 🎉

---

### Test 2: Password Reset Flow 🔑

1. **Request password reset:**
   - Go to: http://localhost:3000/auth/signin
   - Click "Forgot password?"
   - Enter your email
   - Click "Send Reset Link"

2. **Check reset email:**
   - Look at console for reset URL
   - Copy the URL

3. **Reset password:**
   - Paste URL in browser
   - Enter new password (use eye icon to check)
   - Confirm password
   - Click "Reset Password"

4. **Sign in with new password:**
   - Redirected to sign in
   - Use new password ✅

---

### Test 3: Protected Checkout 🛒

1. **Add items to cart (while signed out):**
   - Browse products
   - Add to cart
   - Click cart icon

2. **Try to checkout:**
   - Click "Proceed to Checkout"
   - Should redirect to sign in page ✅

3. **Sign in:**
   - Enter credentials
   - Auto-redirected back to checkout 🎉

---

### Test 4: Try Signing In Without Verification ❌

1. **Create another account:**
   - Register with a different email
   - Don't click the verification link

2. **Try to sign in:**
   - Go to sign in page
   - Enter credentials
   - Should see error: "Please verify your email..." ✅

3. **Resend verification:**
   - Go to: `/auth/verify-email?email=your@email.com`
   - Click "Resend Verification Email"
   - Check console for new link

---

## 🎯 What to Look For

### Password Visibility Toggle
- [ ] Eye icon appears on all password fields
- [ ] Clicking toggles between visible/hidden
- [ ] Works on register, sign in, and reset pages

### Email Verification
- [ ] Registration redirects to verification page
- [ ] Verification email logged to console (dev mode)
- [ ] Clicking link verifies email
- [ ] Can't sign in without verification
- [ ] Resend option works

### Password Reset
- [ ] Forgot password link on sign in page
- [ ] Reset email logged to console
- [ ] Reset link works (one-time use)
- [ ] Can sign in with new password

### Protected Checkout
- [ ] Checkout redirects to sign in if not authenticated
- [ ] After sign in, returns to checkout
- [ ] Cart items preserved in URL

---

## 🔧 Common Issues & Solutions

### "Email not verified" error
**Solution:** Check console for verification email, click the link

### Can't find verification email
**Solution:** It's in the console logs (dev mode) - look for `📧 Email sent`

### Reset link doesn't work
**Solution:** Links expire in 1 hour - request a new one

### Checkout redirects to sign in repeatedly
**Solution:** 
- Clear browser cache
- Make sure cookies are enabled
- Check you successfully signed in

---

## 📝 For Production

Before deploying, set up a real email service:

1. **Choose an email service** (Resend, SendGrid, AWS SES)
2. **Install the package:**
   ```bash
   npm install resend
   ```
3. **Add API key to `.env.local`:**
   ```env
   RESEND_API_KEY=your_api_key
   EMAIL_FROM=noreply@yourdomain.com
   ```
4. **Uncomment email code in `lib/email.ts`**

---

## ✅ Checklist

- [x] Database tables created automatically
- [x] Password visibility toggle working
- [x] Email verification required
- [x] Password reset working
- [x] Checkout requires authentication
- [x] Clear error messages
- [x] Proper token security
- [x] Admin bypass for email verification

---

**Everything is ready! Start testing now!** 🚀

For detailed information, see `AUTH_FEATURES_GUIDE.md`
