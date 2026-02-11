# MongoDB Compass Connection String

## Connection URL for MongoDB Compass

Use this connection string in MongoDB Compass:

```
mongodb+srv://chorhunbhai_db_user:a0HuDjjtmv25deuD@book-bridge.ds5fg6x.mongodb.net/bookbridge?retryWrites=true&w=majority&appName=book-bridge
```

## Simplified Version (also works)

```
mongodb+srv://chorhunbhai_db_user:a0HuDjjtmv25deuD@book-bridge.ds5fg6x.mongodb.net/bookbridge
```

## How to Connect in MongoDB Compass

1. **Open MongoDB Compass**
2. **Paste the connection string** in the connection field
3. **Click "Connect"**

## Connection Details

- **Username:** `chorhunbhai_db_user`
- **Password:** `a0HuDjjtmv25deuD`
- **Cluster:** `book-bridge.ds5fg6x.mongodb.net`
- **Database:** `bookbridge`
- **Protocol:** `mongodb+srv` (SRV connection)

## Important Notes

⚠️ **If you changed the password in MongoDB Atlas:**
- Update the password in the connection string above
- Also update it in `backend/.env` file

⚠️ **Network Access:**
- Make sure your IP address is whitelisted in MongoDB Atlas
- Go to Atlas → Network Access → Add your IP if needed

## Troubleshooting

### Connection Failed
- Check if your IP is whitelisted in Atlas Network Access
- Verify the username and password are correct
- Make sure the database user was created in Atlas

### Authentication Error
- The database user must be created in MongoDB Atlas first
- Go to Atlas → Database Access → Create Database User
