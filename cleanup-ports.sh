#!/bin/bash
echo "🧹 Cleaning up ports 3000 and 5000..."

# Kill processes on port 5000
lsof -ti:5000 | xargs kill -9 2>/dev/null
sleep 1

# Kill processes on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null
sleep 1

# Kill all node processes related to bookbridge
pkill -9 -f "bookbridge" 2>/dev/null
pkill -9 -f "nodemon" 2>/dev/null
pkill -9 -f "react-scripts" 2>/dev/null
pkill -9 -f "concurrently" 2>/dev/null

sleep 2

# Check if ports are free
if lsof -ti:5000 > /dev/null 2>&1; then
    echo "⚠️  Port 5000 is still in use. Trying again..."
    lsof -ti:5000 | xargs kill -9 2>/dev/null
    sleep 1
fi

if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 is still in use. Trying again..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 1
fi

# Final check
if ! lsof -ti:5000,3000 > /dev/null 2>&1; then
    echo "✅ Ports 3000 and 5000 are now free!"
else
    echo "❌ Some ports are still in use. You may need to restart your terminal."
fi
