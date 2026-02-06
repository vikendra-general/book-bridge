# 🚀 Quick Email Setup Guide

## Current Status
Your email service is not configured. The forgot password feature requires email credentials.

## Quick Setup (Gmail - 5 minutes)

### Step 1: Enable 2-Factor Authentication
1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification" if not already enabled

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" from the dropdown
3. Select "Other (Custom name)" 
4. Type: "Book Bridge"
5. Click "Generate"
6. **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

### Step 3: Add to .env File

Open `backend/.env` and add these lines:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

**Important:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Replace `abcdefghijklmnop` with the 16-character app password (remove spaces)
- Use the **App Password**, NOT your regular Gmail password

### Step 4: Restart Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev:full
```

You should now see:
```
✅ Email service is ready to send messages
```

## Example .env File

Your `backend/.env` should look like this:

```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
JWT_SECRET=bookbridge-super-secret-jwt-key-2024-production-ready
JWT_EXPIRE=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

## Testing

1. Go to: http://localhost:3000/forgot-password
2. Enter your email
3. Check your inbox for the 6-digit code

## Troubleshooting

### "Invalid login" error
- Make sure you're using an **App Password**, not your regular password
- Verify 2-Factor Authentication is enabled

### "Missing credentials" error
- Check that EMAIL_USER and EMAIL_PASS are in `.env`
- Make sure there are no spaces or quotes around the values
- Restart the server after adding credentials

### Code not received
- Check spam folder
- Wait 30-60 seconds
- Check server console for errors

## Need More Help?

See `EMAIL_SETUP.md` for:
- Other email providers (Outlook, Yahoo, etc.)
- Production email services (SendGrid, Mailgun)
- Advanced configuration options

---

**That's it!** Once configured, the forgot password feature will work perfectly! 🎉
