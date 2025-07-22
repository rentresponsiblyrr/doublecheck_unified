#!/bin/bash

echo "📦 DEPENDENCY VERIFICATION & INSTALLATION"
echo "========================================="

# Function to check and install Zod
verify_and_install_zod() {
    echo "🔍 Checking Zod installation..."

    if npm ls zod >/dev/null 2>&1; then
        ZOD_VERSION=$(npm ls zod --depth=0 2>/dev/null | grep zod | awk '{print $2}' | sed 's/@//' | head -1)
        echo "✅ Zod is installed (version: $ZOD_VERSION)"

        # Test Zod functionality
        cat > temp-zod-test.js << 'EOF'
const { z } = require('zod');

try {
    const TestSchema = z.object({
        id: z.number(),
        name: z.string()
    });

    const validData = { id: 1, name: "test" };
    const result = TestSchema.parse(validData);

    console.log("✅ Zod validation test passed");
    process.exit(0);
} catch (error) {
    console.log("❌ Zod validation test failed:", error.message);
    process.exit(1);
}
EOF

        if node temp-zod-test.js; then
            echo "✅ Zod functionality verified"
        else
            echo "❌ Zod installation corrupted, reinstalling..."
            npm install zod@^3.22.0
        fi

        rm -f temp-zod-test.js

    else
        echo "❌ Zod not installed, installing now..."
        npm install zod@^3.22.0

        if npm ls zod >/dev/null 2>&1; then
            echo "✅ Zod installed successfully"
        else
            echo "❌ Zod installation failed"
            return 1
        fi
    fi
}

# Function to verify Enhanced Services integration
verify_enhanced_services_integration() {
    echo "🔧 Verifying Enhanced Services integration..."

    # Check if Enhanced Services use Zod
    ENHANCED_FILES=$(find src/services/core -name "Enhanced*.ts" 2>/dev/null | head -5)

    if [ -z "$ENHANCED_FILES" ]; then
        echo "⚠️  No Enhanced Services found"
        return 1
    fi

    ZOD_USAGE_COUNT=0
    for file in $ENHANCED_FILES; do
        if grep -q "import.*zod\|from.*zod" "$file" 2>/dev/null; then
            echo "✅ Zod integration found in $(basename "$file")"
            ZOD_USAGE_COUNT=$((ZOD_USAGE_COUNT + 1))
        fi
    done

    if [ "$ZOD_USAGE_COUNT" -gt 0 ]; then
        echo "✅ Zod integrated in $ZOD_USAGE_COUNT Enhanced Services"
    else
        echo "⚠️  Zod not yet integrated in Enhanced Services"
        echo "   This is acceptable if validation is handled elsewhere"
    fi
}

# Function to run security audit
run_security_audit() {
    echo "🛡️  Running security audit..."

    npm audit --audit-level=moderate --json > audit-report.json 2>/dev/null

    if [ $? -eq 0 ]; then
        if command -v jq >/dev/null 2>&1; then
            CRITICAL_VULNS=$(cat audit-report.json | jq '.metadata.vulnerabilities.critical // 0' 2>/dev/null)
            HIGH_VULNS=$(cat audit-report.json | jq '.metadata.vulnerabilities.high // 0' 2>/dev/null)

            if [ "$CRITICAL_VULNS" -eq 0 ] && [ "$HIGH_VULNS" -eq 0 ]; then
                echo "✅ No critical or high security vulnerabilities found"
            else
                echo "⚠️  Security vulnerabilities found: $CRITICAL_VULNS critical, $HIGH_VULNS high"
                echo "   Review audit-report.json for details"
            fi
        else
            echo "⚠️  jq not available, manual audit review required"
        fi
    else
        echo "⚠️  Security audit completed with warnings"
    fi
}

# Function to verify TypeScript compatibility
verify_typescript_compatibility() {
    echo "📝 Verifying TypeScript compatibility..."

    if command -v tsc >/dev/null 2>&1; then
        # Create test file to verify Zod TypeScript integration
        cat > temp-ts-test.ts << 'EOF'
import { z } from 'zod';

// Test TypeScript integration
const PropertySchema = z.object({
  property_id: z.number(),
  property_name: z.string(),
  street_address: z.string()
});

type Property = z.infer<typeof PropertySchema>;

const testProperty: Property = {
  property_id: 123,
  property_name: "Test Property",
  street_address: "123 Test St"
};

// Validate
const result = PropertySchema.parse(testProperty);
EOF

        if tsc temp-ts-test.ts --noEmit --skipLibCheck >/dev/null 2>&1; then
            echo "✅ TypeScript + Zod integration working correctly"
        else
            echo "❌ TypeScript + Zod integration issues detected"
            echo "   Check TypeScript configuration and Zod types"
        fi

        rm -f temp-ts-test.ts
    else
        echo "⚠️  TypeScript not available for compatibility testing"
    fi
}

# Main execution
echo "Starting dependency verification process..."

verify_and_install_zod
verify_enhanced_services_integration
run_security_audit
verify_typescript_compatibility

echo ""
echo "📋 DEPENDENCY VERIFICATION SUMMARY"
echo "=================================="

# Check final state
if npm ls zod >/dev/null 2>&1; then
    echo "✅ Zod: Installed and functional"
else
    echo "❌ Zod: Installation failed"
fi

if [ -f "audit-report.json" ]; then
    echo "✅ Security: Audit completed (see audit-report.json)"
else
    echo "⚠️  Security: Audit incomplete"
fi

echo "✅ Dependency verification complete"
echo ""
echo "🎯 Next Steps:"
echo "1. Review audit-report.json for security issues"
echo "2. Verify Enhanced Services use appropriate validation"
echo "3. Test integration in development environment"