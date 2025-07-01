'use client';

import { useState } from 'react';
import { api } from '@/utils/api';

export function OpenAITestButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    model?: string;
  } | null>(null);

  const testConnection = api.ai.testConnection.useQuery(undefined, {
    enabled: false,
  });

  const handleTest = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await testConnection.refetch();
      setResult(response.data || { success: false, message: 'No response' });
    } catch (error) {
      setResult({
        success: false,
        message: error.message || 'Connection failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">OpenAI Connection Test</h3>
      
      <button
        onClick={handleTest}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Test OpenAI Connection'}
      </button>
      
      {result && (
        <div className={`mt-4 p-3 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
          <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
            {result.success ? '✅ Success' : '❌ Failed'}
          </p>
          <p className="text-sm mt-1">{result.message}</p>
          {result.model && (
            <p className="text-sm text-gray-600 mt-1">Model: {result.model}</p>
          )}
        </div>
      )}
    </div>
  );
}