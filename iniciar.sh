#!/bin/bash
# SHYFTEX - Start server and open app
echo "🚀 Starting SHYFTEX backend on http://localhost:4000 ..."
echo "   (Press Ctrl+C to stop)"
echo ""

# Open browser after 2 seconds (when server is ready)
(sleep 2 && xdg-open http://localhost:4000 2>/dev/null) &

# Start the server
cd "$(dirname "$0")/server"
exec npx tsx watch src/index.ts
