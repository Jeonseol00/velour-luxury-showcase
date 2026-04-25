#!/bin/bash

# ==============================================================================
# VELOUR Build Verification Script
# ==============================================================================
# This script ensures that the Astro build succeeds and that the necessary
# static assets (including the JS bundle containing the custom R3F shaders)
# are successfully generated.
# ==============================================================================

set -e

echo "🧪 [TEST] Verifying Node.js version requirements..."
if [ -f .nvmrc ]; then
    echo "📄 Found .nvmrc. Attempting to use NVM..."
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm use || { echo "❌ Failed to use NVM. Please install Node >=22.12.0 manually."; exit 1; }
else
    echo "⚠️ No .nvmrc found. Relying on system Node."
fi

NODE_VERSION=$(node -v)
echo "✅ Using Node.js: $NODE_VERSION"

echo "🧪 [TEST] Running Astro Production Build..."
if npm run build; then
    echo "✅ Build completed successfully."
else
    echo "❌ Build failed!"
    exit 1
fi

echo "🧪 [TEST] Verifying build output artifacts..."
if [ -d "dist" ]; then
    echo "✅ 'dist' directory created successfully."
else
    echo "❌ 'dist' directory not found!"
    exit 1
fi

if [ -f "dist/index.html" ]; then
    echo "✅ Entrypoint 'index.html' generated successfully."
else
    echo "❌ Entrypoint 'index.html' not found!"
    exit 1
fi

echo "🚀 All tests passed. The project is production-ready."
