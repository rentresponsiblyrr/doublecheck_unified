
import React from "react";

const Index = () => {
  console.log('📱 Index page - mobile interface');
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">STR Certified</h1>
        <p className="text-gray-600 mb-8">Welcome to the AI-powered property inspection platform</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-2">Properties</h2>
            <p className="text-gray-600 mb-4">View and manage your property listings</p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              View Properties
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-2">Inspections</h2>
            <p className="text-gray-600 mb-4">Start or continue property inspections</p>
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Start Inspection
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-2">Reports</h2>
            <p className="text-gray-600 mb-4">View inspection reports and analytics</p>
            <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
