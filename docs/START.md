# 🚀 How to Start Book Bridge

## If you get "Port already in use" error:

### Option 1: Use the cleanup script
```bash
./cleanup-ports.sh
```

### Option 2: Manual cleanup
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000  
lsof -ti:3000 | xargs kill -9

# Kill all node processes (be careful!)
killall -9 node
```

### Option 3: Change the port temporarily
Edit `backend/server.js` and change:
```javascript
const PORT = process.env.PORT || 5001; // Changed from 5000 to 5001
```

And update `frontend/.env`:
```
REACT_APP_API_URL=http://localhost:5001/api
```

## Start the application:

```bash
npm run dev:full
```

This will:
- Start backend on http://localhost:5000
- Start frontend on http://localhost:3000
- Automatically open your browser

## If ports are still in use:

1. **Close all terminal windows** running the app
2. **Wait 5 seconds**
3. **Open a fresh terminal**
4. **Run the cleanup script**: `./cleanup-ports.sh`
5. **Start again**: `npm run dev:full`

## Troubleshooting:

- **Backend won't start**: Make sure MongoDB is running
- **Frontend shows blank**: Check browser console for errors
- **Port errors**: Use the cleanup script or restart your computer
