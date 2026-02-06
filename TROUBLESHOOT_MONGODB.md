# Troubleshooting MongoDB Atlas Connection

## Error: "bad auth: Authentication failed"

This error means the database user doesn't exist in MongoDB Atlas yet.

## Solution: Create Database User in MongoDB Atlas

### Step 1: Go to MongoDB Atlas Dashboard
1. Open your browser and go to: https://cloud.mongodb.com
2. Log in to your MongoDB Atlas account
3. Select your project/cluster

### Step 2: Create Database User
1. In the MongoDB Atlas dashboard, you should see a modal or notification
2. Click **"Create Database User"** button
3. You'll see:
   - **Username:** `chorhunbhai_db_user` (or you can change it)
   - **Password:** A generated password (or create your own)
4. **IMPORTANT:** Copy the password immediately!
5. Click **"Create Database User"** to confirm

### Step 3: Update Connection String

After creating the user, update the connection string with the **actual password**:

**For MongoDB Compass:**
```
mongodb+srv://chorhunbhai_db_user:YOUR_ACTUAL_PASSWORD@book-bridge.ds5fg6x.mongodb.net/bookbridge?retryWrites=true&w=majority&appName=book-bridge
```

**For backend/.env file:**
```env
MONGODB_URI=mongodb+srv://chorhunbhai_db_user:YOUR_ACTUAL_PASSWORD@book-bridge.ds5fg6x.mongodb.net/bookbridge?retryWrites=true&w=majority&appName=book-bridge
```

### Step 4: Verify Network Access
1. Go to **Network Access** in MongoDB Atlas
2. Make sure your IP address (117.99.240.46) is whitelisted
3. If not, click **"Add IP Address"** → **"Add Current IP Address"**

### Step 5: Test Connection
1. Try connecting again in MongoDB Compass
2. Or test from terminal:
   ```bash
   cd backend
   node scripts/initData.js
   ```

## Common Issues

### Issue 1: User Not Created
**Symptom:** "bad auth: Authentication failed"
**Solution:** Create the database user in Atlas first (Step 2 above)

### Issue 2: Wrong Password
**Symptom:** Authentication fails even after creating user
**Solution:** 
- Double-check the password in Atlas
- Make sure you copied it correctly
- If password has special characters, they should work as-is in the connection string

### Issue 3: IP Not Whitelisted
**Symptom:** Connection timeout or network error
**Solution:** Add your IP to Network Access in Atlas

### Issue 4: User Created But Still Failing
**Solution:**
1. Wait 1-2 minutes after creating the user (propagation delay)
2. Try connecting again
3. Verify the username is exactly: `chorhunbhai_db_user`
4. Check if you're using the correct cluster name: `book-bridge.ds5fg6x.mongodb.net`

## Quick Checklist

- [ ] Database user created in MongoDB Atlas
- [ ] Password copied correctly
- [ ] Connection string updated with correct password
- [ ] IP address whitelisted in Network Access
- [ ] Cluster is running (not paused)
- [ ] Username matches exactly: `chorhunbhai_db_user`

## Alternative: Create User Manually

If the modal doesn't appear:
1. Go to **Database Access** in Atlas sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter username: `chorhunbhai_db_user`
5. Generate or create a password
6. Set user privileges: **"Atlas admin"** (for full access)
7. Click **"Add User"**

## Test Connection After Setup

Once the user is created, test with:

```bash
cd backend
node scripts/initData.js
```

You should see:
```
✅ MongoDB Connected
✅ Admin user created: admin@bookbridge.com
✅ Created category: Fantasy
...
```
