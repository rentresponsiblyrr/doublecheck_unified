#!/bin/bash

# Push to doublecheck_unified repository

echo "🚀 Pushing to doublecheck_unified repository..."
echo ""

# Ensure we're in the right directory
cd /Users/ryanrabideau/doublecheck-field-view/lovable-extraction/str-certified-migration/str-certified

# Remove any existing remote
git remote remove origin 2>/dev/null

# Add the correct remote
git remote add origin https://github.com/rentresponsiblyrr/doublecheck_unified.git

# Push to GitHub
git push -u origin main

echo ""
echo "✅ Code pushed successfully!"
echo ""
echo "Next steps:"
echo "1. Verify at: https://github.com/rentresponsiblyrr/doublecheck_unified"
echo "2. Set up Railway:"
echo "   railway init doublecheck_unified"
echo "   ./railway-deploy.sh"