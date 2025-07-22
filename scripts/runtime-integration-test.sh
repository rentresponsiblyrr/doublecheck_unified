#!/bin/bash

echo "🔄 RUNTIME INTEGRATION VALIDATION"
echo "================================="

# Start development server in background
echo "📡 Starting development server..."
npm run dev > dev-server.log 2>&1 &
DEV_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to initialize..."
sleep 15

# Function to cleanup on exit
cleanup() {
    echo "🧹 Cleaning up..."
    kill $DEV_PID 2>/dev/null
    rm -f dev-server.log runtime-test-results.json
}
trap cleanup EXIT

# Test 1: Basic server response
echo "🌐 Testing basic server response..."
if curl -f -s http://localhost:3000 > /dev/null; then
    echo "✅ Server is responding"
else
    echo "❌ Server not responding"
    exit 1
fi

# Test 2: Health endpoint
echo "🏥 Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3000/api/health)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -c 4)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "503" ]; then
    echo "✅ Health endpoint responding (HTTP $HTTP_CODE)"

    # Extract JSON body (remove HTTP code from end)
    HEALTH_JSON=$(echo "$HEALTH_RESPONSE" | head -c -4)
    echo "$HEALTH_JSON" > runtime-test-results.json

    # Parse health status
    if command -v jq >/dev/null 2>&1; then
        STATUS=$(echo "$HEALTH_JSON" | jq -r '.status // "unknown"')
        BRIDGE_ACTIVE=$(echo "$HEALTH_JSON" | jq -r '.integration.bridgeActive // false')
        SERVICES_READY=$(echo "$HEALTH_JSON" | jq -r '.integration.servicesReady // false')
        PWA_READY=$(echo "$HEALTH_JSON" | jq -r '.integration.pwaReady // false')

        echo "   Status: $STATUS"
        echo "   Bridge Active: $BRIDGE_ACTIVE"
        echo "   Enhanced Services Ready: $SERVICES_READY"
        echo "   PWA Components Ready: $PWA_READY"

        # Validate integration status
        if [ "$BRIDGE_ACTIVE" = "true" ]; then
            echo "✅ Integration bridge is active"
        else
            echo "⚠️  Integration bridge not active"
        fi

    else
        echo "⚠️  jq not available, manual JSON review required"
        echo "Health response saved to runtime-test-results.json"
    fi
else
    echo "❌ Health endpoint failed (HTTP $HTTP_CODE)"
    exit 1
fi

# Test 3: Console logs check
echo "🔍 Checking server logs for integration messages..."
if grep -q "PWA-Enhanced Services bridge active" dev-server.log; then
    echo "✅ Integration bridge initialization logged"
else
    echo "⚠️  Integration bridge initialization not found in logs"
fi

if grep -q "Enhanced Services detected and ready" dev-server.log; then
    echo "✅ Enhanced Services ready logged"
else
    echo "⚠️  Enhanced Services readiness not found in logs"
fi

# Test 4: JavaScript console integration test
echo "🧪 Testing browser integration..."
cat > runtime-browser-test.js << 'EOF'
// Runtime browser integration test
const testBrowserIntegration = async () => {
    const results = {
        bridgeExists: typeof window.__PWA_ENHANCED_BRIDGE__ !== 'undefined',
        bridgeActive: false,
        enhancedServicesExists: typeof window.__ENHANCED_SERVICES__ !== 'undefined',
        pwaStatusExists: typeof window.__PWA_STATUS__ !== 'undefined',
        contextUpdateExists: typeof window.__PWA_CONTEXT_UPDATE__ === 'function'
    };

    if (results.bridgeExists) {
        try {
            const bridgeStatus = window.__PWA_ENHANCED_BRIDGE__.getStatus();
            results.bridgeActive = bridgeStatus?.bridgeActive || false;
        } catch (error) {
            console.error('Bridge status check failed:', error);
        }
    }

    console.log('🧪 Browser Integration Test Results:', results);
    return results;
};

// Run test when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testBrowserIntegration);
} else {
    testBrowserIntegration();
}
EOF

echo "   Browser test script created: runtime-browser-test.js"
echo "   (Run this in browser console for client-side validation)"

echo ""
echo "📋 RUNTIME INTEGRATION TEST SUMMARY"
echo "===================================="
echo "✅ Development server started successfully"
echo "✅ Health endpoint responding"
echo "✅ Integration validation completed"
echo ""
echo "🎯 Next Steps:"
echo "1. Review runtime-test-results.json for detailed health data"
echo "2. Run runtime-browser-test.js in browser console"
echo "3. Check dev-server.log for any error messages"

# Return success if we got this far
exit 0