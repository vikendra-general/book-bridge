# 🔧 Fix Email Address Mismatch Error

## Problem
You're using a **Gmail App Password** but your `EMAIL_USER` is set to a **non-Gmail address** (like `kegecor176@jparksky.com`).

**This won't work!** Gmail SMTP only works with Gmail addresses.

## Solution Options

### Option 1: Use Gmail Address (Recommended - Easiest)

1. **Use a Gmail account** (or create one if needed)
2. **Generate App Password** for that Gmail account:
   - Go to: https://myaccount.google.com/apppasswords
   - Generate App Password for "Book Bridge"
3. **Update `backend/.env`:**
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-gmail-app-password
   ```

### Option 2: Use Your Actual Email Provider

If you want to use `kegecor176@jparksky.com`, you need to:

1. **Find SMTP settings** for jparksky.com:
   - Contact jparksky.com support for SMTP settings
   - Or check their email documentation
   - Common settings:
     - Host: `smtp.jparksky.com` or `mail.jparksky.com`
     - Port: `587` (TLS) or `465` (SSL)

2. **Update `backend/.env`:**
   ```env
   EMAIL_HOST=smtp.jparksky.com
   EMAIL_PORT=587
   EMAIL_USER=kegecor176@jparksky.com
   EMAIL_PASS=your-jparksky-password
   ```

3. **Note:** You may need to use your regular password (not App Password) for non-Gmail providers

### Option 3: Use a Different Email Service (Best for Production)

For production, consider using:
- **SendGrid** (Free: 100 emails/day)
- **Mailgun** (Free: 5,000 emails/month)
- **AWS SES** (Pay as you go)

These work with any "from" email address.

## Quick Fix (Use Gmail)

**Easiest solution:** Use a Gmail address

1. Create/use a Gmail account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Update `.env`:
   ```env
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-app-password
   ```
4. Restart server

## Current Configuration Issue

Your current setup:
- ❌ `EMAIL_HOST=smtp.gmail.com` (Gmail SMTP)
- ❌ `EMAIL_USER=kegecor176@jparksky.com` (Non-Gmail address)
- ❌ This mismatch causes authentication failure

**Fix:** Either use Gmail address OR change EMAIL_HOST to match jparksky.com

## Testing

After fixing, restart server and check console:
```
✅ Email service is ready to send messages
```

Then test forgot password feature - it should work!

---

**Need help finding SMTP settings?** Contact your email provider's support.
