# MongoDB Atlas Setup Guide

## Step 1: Complete MongoDB Atlas Setup

1. **Go to MongoDB Atlas Dashboard** (you're already there)
2. **Click "Create Database User"** button in the modal
3. **Copy the password** - Make sure you save it securely
4. **Click "Choose a connection method"** and complete the setup

## Step 2: Update .env File

After creating the database user, update the `.env` file in the `backend` folder:

```bash
cd backend
nano .env  # or use your preferred editor
```

Update the connection string with your actual credentials:

```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@book-bridge.ds5fg6x.mongodb.net/bookbridge?retryWrites=true&w=majority&appName=book-bridge
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
```

**Important:** 
- Replace `<username>` and `<password>` with the actual credentials from Atlas
- If your password has special characters, they will be automatically URL-encoded
- The database name is `bookbridge` (already in the connection string)

## Step 3: Network Access

Make sure your IP address is whitelisted in MongoDB Atlas:
1. Go to **Network Access** in Atlas
2. Your current IP (117.99.240.46) should already be added
3. If not, click **Add IP Address** and add your current IP

## Step 4: Initialize Database

After setting up the connection, run:

```bash
cd backend
node scripts/initData.js
```

This will:
- Create the admin user (admin@bookbridge.com / Admin123!)
- Create all 11 categories
- Set up the initial database structure

## Step 5: Start the Application

```bash
npm run dev:full
```

## Troubleshooting

### Authentication Failed Error
- Make sure you clicked "Create Database User" in Atlas
- Verify the password is correct in the .env file
- Check that your IP is whitelisted in Network Access

### Connection Timeout
- Check your internet connection
- Verify the cluster is running in Atlas
- Make sure the connection string is correct

### Database Not Found
- The database `bookbridge` will be created automatically on first connection
- No need to create it manually in Atlas

## Connection String Format

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority&appName=book-bridge
```

Your connection string:
```
mongodb+srv://chorhunbhai_db_user:<password>@book-bridge.ds5fg6x.mongodb.net/bookbridge?retryWrites=true&w=majority&appName=book-bridge
```
