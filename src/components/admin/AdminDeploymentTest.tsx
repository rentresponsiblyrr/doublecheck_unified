import React from 'react';
import { getAppTypeFromDomain, AppType } from '@/lib/config/app-type';

export const AdminDeploymentTest: React.FC = () => {
  const [debugInfo, setDebugInfo] = React.useState<any>({});

  React.useEffect(() => {
    const info = {
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      search: window.location.search,
      appType: getAppTypeFromDomain(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VITE_APP_TYPE: import.meta.env.VITE_APP_TYPE,
        VITE_ADMIN_DOMAIN: import.meta.env.VITE_ADMIN_DOMAIN,
        VITE_INSPECTOR_DOMAIN: import.meta.env.VITE_INSPECTOR_DOMAIN
      }
    };
    setDebugInfo(info);
    console.log('🔍 Admin Deployment Test:', info);
  }, []);

  return (
    <div className="p-8 bg-green-50 border-2 border-green-300 rounded-lg">
      <h1 className="text-2xl font-bold text-green-800 mb-4">
        ✅ Admin Portal Deployment Test
      </h1>
      
      <div className="space-y-4">
        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold mb-2">🌐 Domain Information</h2>
          <p><strong>Hostname:</strong> {debugInfo.hostname}</p>
          <p><strong>Pathname:</strong> {debugInfo.pathname}</p>
          <p><strong>App Type:</strong> {debugInfo.appType}</p>
          <p><strong>Expected:</strong> {AppType.ADMIN}</p>
          <p><strong>Match:</strong> {debugInfo.appType === AppType.ADMIN ? '✅ Correct' : '❌ Incorrect'}</p>
        </div>

        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold mb-2">🔧 Environment Variables</h2>
          {debugInfo.environment && Object.entries(debugInfo.environment).map(([key, value]) => (
            <p key={key}><strong>{key}:</strong> {String(value)}</p>
          ))}
        </div>

        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold mb-2">⏰ Test Information</h2>
          <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
          <p><strong>User Agent:</strong> {debugInfo.userAgent?.substring(0, 100)}...</p>
        </div>

        <div className="bg-blue-50 p-4 rounded border border-blue-300">
          <h2 className="font-semibold mb-2 text-blue-800">🎯 Test Results</h2>
          {debugInfo.appType === AppType.ADMIN ? (
            <div className="text-green-700">
              <p className="font-semibold">✅ SUCCESS: Admin portal is correctly identified</p>
              <p>The domain routing is working properly and this is the correct admin application.</p>
            </div>
          ) : (
            <div className="text-red-700">
              <p className="font-semibold">❌ ERROR: Wrong application detected</p>
              <p>Expected admin portal but got: {debugInfo.appType}</p>
              <p>This indicates a deployment or routing issue.</p>
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded border">
          <h2 className="font-semibold mb-2">🚀 Quick Actions</h2>
          <div className="space-x-2">
            <button 
              onClick={() => window.location.href = '/admin/users'}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Test Users Route
            </button>
            <button 
              onClick={() => window.location.href = '/admin/properties'}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Test Properties Route
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};