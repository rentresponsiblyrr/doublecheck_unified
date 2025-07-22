#!/bin/bash

# Claude Code CLI Launcher
# This script loads NVM and launches Claude Code CLI

echo "🚀 Launching Claude Code CLI..."
echo ""

# Load NVM and Node.js
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Check if claude CLI is available
if ! command -v claude &> /dev/null; then
    echo "❌ Claude CLI not found!"
    echo "Installing Claude Code CLI..."
    npm install -g @anthropic-ai/claude-code
fi

echo "✅ Claude Code CLI ready!"
echo ""

# Launch Claude Code with any provided arguments
if [ $# -eq 0 ]; then
    echo "Starting interactive Claude Code session..."
    echo "Use 'claude --help' for more options"
    echo ""
    claude
else
    claude "$@"
fi 