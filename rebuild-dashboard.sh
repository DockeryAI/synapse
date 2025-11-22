#!/bin/bash

echo "🔄 Rebuilding dashboard from scratch..."

# Kill any running dev servers
echo "Stopping any running processes..."
pkill -f "vite" || true
pkill -f "node" || true

# Clear all caches
echo "Clearing caches..."
rm -rf node_modules/.vite
rm -rf node_modules/.cache
rm -rf .parcel-cache

# Clear browser storage (instructions)
echo ""
echo "⚠️  IMPORTANT: Clear browser storage manually:"
echo "1. Open DevTools (F12)"
echo "2. Application tab → Storage → Clear site data"
echo "3. Or open: http://localhost:5173"
echo "4. Press Ctrl+Shift+R (hard refresh)"
echo ""

# Rebuild and start
echo "Starting fresh build..."
npm run dev

