# 🔐 Fix "Invalid login" Email Error

## Current Error
```
❌ Email service error: Invalid login: 535-5.7.8 Username and Password not accepted
```

## Root Cause
You're using your **regular Gmail password** instead of a **Gmail App Password**. Gmail requires App Passwords for third-party applications.

## ✅ Solution (3 Steps)

### Step 1: Enable 2-Factor Authentication
1. Go to: https://myaccount.google.com/security
2. Click on "2-Step Verification"
3. Follow the prompts to enable it (if not already enabled)

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
   - If you don't see this link, make sure 2-Factor Authentication is enabled first
2. Select "Mail" from the first dropdown
3. Select "Other (Custom name)" from the second dropdown
4. Type: **Book Bridge**
5. Click **"Generate"**
6. You'll see a 16-character password like: `abcd efgh ijkl mnop`
7. **Copy this password** (you won't see it again!)

### Step 3: Update .env File
1. Open `backend/.env`
2. Find the line with `EMAIL_PASS=`
3. Replace it with your App Password (remove spaces):
   ```env
   EMAIL_PASS=abcdefghijklmnop
   ```
4. Make sure `EMAIL_USER` is your Gmail address:
   ```env
   EMAIL_USER=your-email@gmail.com
   ```

### Step 4: Restart Server
```bash
# Stop server (Ctrl+C)
npm run dev:full
```

You should now see:
```
✅ Email service is ready to send messages
```

## Common Mistakes ❌

1. **Using regular password** → Must use App Password
2. **Not removing spaces** → App Password has spaces, remove them in .env
3. **2FA not enabled** → Must enable 2-Factor Authentication first
4. **Wrong email** → Make sure EMAIL_USER matches the Gmail account

## Example .env Configuration

```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb+srv://...

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

**Important:**
- `EMAIL_PASS` should be 16 characters (no spaces)
- Use the App Password, NOT your regular Gmail password
- The App Password is different from your account password

## Still Having Issues?

### Check These:
1. ✅ 2-Factor Authentication is enabled
2. ✅ App Password was generated (not regular password)
3. ✅ No spaces in EMAIL_PASS in .env
4. ✅ EMAIL_USER matches your Gmail address
5. ✅ Server was restarted after changing .env

### Try This:
1. Generate a **new** App Password
2. Delete the old one from Google Account
3. Update .env with the new password
4. Restart server

### Alternative: Use Different Email Provider
If Gmail continues to cause issues, try:
- **Outlook**: See EMAIL_SETUP.md
- **Yahoo**: See EMAIL_SETUP.md
- **SendGrid** (for production): Free tier available

---

**Need more help?** Check the server console for detailed error messages.
