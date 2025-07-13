import React from 'react';

export default function SimpleAdminTest() {
  console.log('🧪 SimpleAdminTest component rendering - this should appear if routing works');
  
  return (
    <div className="p-8 bg-green-100 border-2 border-green-500 rounded-lg">
      <h1 className="text-3xl font-bold text-green-800 mb-4">
        ✅ SUCCESS! Admin Routing is Working!
      </h1>
      <p className="text-green-700 text-lg mb-4">
        This is a test component to verify that admin routes are functioning correctly.
      </p>
      <div className="bg-white p-4 rounded border">
        <h2 className="font-semibold mb-2">Debug Information:</h2>
        <ul className="text-sm space-y-1">
          <li><strong>Current URL:</strong> {window.location.href}</li>
          <li><strong>Pathname:</strong> {window.location.pathname}</li>
          <li><strong>Component:</strong> SimpleAdminTest</li>
          <li><strong>Timestamp:</strong> {new Date().toISOString()}</li>
        </ul>
      </div>
    </div>
  );
}