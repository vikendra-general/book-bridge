# 📧 Email Setup for Forgot Password Feature

## Overview
The forgot password feature uses **nodemailer** to send 6-digit verification codes to users' email addresses.

## Setup Instructions

### Step 1: Choose Your Email Provider

You can use any email service that supports SMTP:
- **Gmail** (Recommended for development)
- **Outlook/Hotmail**
- **Yahoo Mail**
- **Custom SMTP server**

### Step 2: Gmail Setup (Recommended)

#### Option A: Gmail App Password (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Book Bridge" as the name
   - Click "Generate"
   - **Copy the 16-character password** (you'll need this)

3. **Update `.env` file** in `backend/` folder:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   ```

#### Option B: Gmail OAuth2 (Advanced)
For production, consider using OAuth2 instead of app passwords.

### Step 3: Other Email Providers

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

#### Yahoo Mail
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

### Step 4: Custom SMTP Server
```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-password
```

## Environment Variables

Add these to your `backend/.env` file:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Testing

1. **Start your server:**
   ```bash
   npm run dev:full
   ```

2. **Check console output:**
   - You should see: `✅ Email service is ready to send messages`
   - If you see an error, check your credentials

3. **Test the forgot password flow:**
   - Go to: http://localhost:3000/forgot-password
   - Enter your email
   - Check your inbox for the 6-digit code

## Troubleshooting

### Error: "Invalid login"
- Make sure you're using an **App Password** (not your regular Gmail password)
- Verify 2-Factor Authentication is enabled

### Error: "Connection timeout"
- Check your internet connection
- Verify EMAIL_HOST and EMAIL_PORT are correct
- Some networks block SMTP ports - try a different network

### Error: "Email service error"
- Double-check EMAIL_USER and EMAIL_PASS in `.env`
- Make sure `.env` file is in the `backend/` folder
- Restart the server after changing `.env`

### Code not received
- Check spam/junk folder
- Wait a few seconds (email delivery can take time)
- Verify the email address is correct
- Check server console for error messages

## Security Notes

⚠️ **Important:**
- Never commit `.env` file to git
- Use App Passwords, not regular passwords
- For production, consider using a dedicated email service (SendGrid, Mailgun, etc.)
- The verification code expires in 10 minutes

## Production Recommendations

For production, consider using:
- **SendGrid** (Free tier: 100 emails/day)
- **Mailgun** (Free tier: 5,000 emails/month)
- **AWS SES** (Pay as you go)
- **Postmark** (Paid, but reliable)

These services provide:
- Better deliverability
- Analytics and tracking
- Higher sending limits
- Better security

---

**Need help?** Check the server console for detailed error messages.
