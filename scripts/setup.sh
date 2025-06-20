#!/bin/bash

# Project setup script
set -e

echo "🚀 Setting up Nara OpenData project..."

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20 or higher is required. Current version: $(node -v)"
    exit 1
fi

# Check pnpm installation
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm@8
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Copy environment file
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your actual configuration values"
fi

# Setup git hooks
echo "🪝 Setting up git hooks..."
pnpm prepare

# Create necessary directories
echo "📁 Creating project structure..."
mkdir -p apps/web apps/api
mkdir -p packages/domain packages/types packages/validation packages/utils
mkdir -p docs/specs

# Set execute permissions for husky hooks
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your configuration"
echo "2. Run 'pnpm dev' to start development"
echo "3. Run 'pnpm test' to run tests"
echo ""
echo "Happy coding! 🎉"