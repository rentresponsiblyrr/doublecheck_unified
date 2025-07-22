# Claude Code CLI Guide

## ✅ Installation Complete!

Claude Code CLI has been successfully installed and is ready to use.

## 🚀 How to Use Claude Code

### **Method 1: Use the Convenience Script (Recommended)**
```bash
# Start interactive Claude Code session
./claude-code.sh

# Or with specific arguments
./claude-code.sh "Help me review this React component"
```

### **Method 2: Direct CLI Usage**
```bash
# Load NVM and use Claude directly
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && claude

# Or with a prompt
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && claude "Review this code"
```

### **Method 3: Set Up Persistent Access**
Add this to your `~/.zshrc` file to make `claude` available everywhere:
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

## 🎯 Common Use Cases for STR Certified

### **1. Code Review**
```bash
claude "Review this React component for best practices and security issues"
```

### **2. Generate Documentation**
```bash
claude "Generate API documentation for the property inspection endpoints"
```

### **3. Debug Issues**
```bash
claude "Help me debug this TypeScript error in the inspection workflow"
```

### **4. Refactor Code**
```bash
claude "Refactor this component to use React hooks instead of class components"
```

### **5. Add Features**
```bash
claude "Add form validation to the property inspection form"
```

## 🔧 CLI Options

### **Interactive Mode (Default)**
```bash
claude
```
Starts an interactive session where you can chat with Claude about your code.

### **Non-Interactive Mode**
```bash
claude -p "Your prompt here"
```
Prints the response and exits (useful for scripts).

### **Debug Mode**
```bash
claude --debug
```
Enables debug mode for troubleshooting.

### **Model Selection**
```bash
claude --model sonnet
```
Use a specific Claude model (sonnet, opus, etc.).

### **File Access**
```bash
claude --add-dir ./src
```
Give Claude access to specific directories.

## 📁 Project-Specific Examples

### **Review Property Inspection Code**
```bash
claude "Review the property inspection workflow in src/pages/inspector/InspectionWorkflow.tsx"
```

### **Generate Test Cases**
```bash
claude "Generate unit tests for the property selection component"
```

### **Optimize Performance**
```bash
claude "Analyze the bundle size and suggest optimizations for the React app"
```

### **Security Audit**
```bash
claude "Perform a security audit of the authentication system"
```

## 🛠️ Configuration

### **Set Up Authentication Token**
```bash
claude setup-token
```
Set up a long-lived authentication token (requires Claude subscription).

### **Configure Theme**
```bash
claude config set -g theme dark
```
Set dark theme for the CLI.

### **Manage MCP Servers**
```bash
claude mcp
```
Configure Model Context Protocol servers.

## 🚨 Troubleshooting

### **"Command not found: claude"**
```bash
# Load NVM first
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
claude --help
```

### **Permission Issues**
```bash
# Use the convenience script
./claude-code.sh
```

### **Update Claude Code**
```bash
claude update
```
Check for updates and install if available.

## 🎉 You're Ready!

Your Claude Code CLI is now set up and ready to help you with:

- ✅ Code review and analysis
- ✅ Bug fixing and debugging
- ✅ Feature development
- ✅ Documentation generation
- ✅ Performance optimization
- ✅ Security auditing

Start using Claude Code with:
```bash
./claude-code.sh
``` 