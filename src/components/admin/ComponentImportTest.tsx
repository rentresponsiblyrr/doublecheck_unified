import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ComponentImportTest() {
  const [results, setResults] = useState<Array<{
    component: string;
    status: 'success' | 'error' | 'testing';
    message: string;
    timestamp: string;
  }>>([]);

  const addResult = (component: string, status: 'success' | 'error', message: string) => {
    setResults(prev => [...prev, {
      component,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testImport = async (componentName: string, importPath: string) => {
    addResult(componentName, 'testing', 'Starting import test...');
    
    try {
      console.log(`🧪 Testing import: ${componentName} from ${importPath}`);
      
      const startTime = performance.now();
      const module = await import(importPath);
      const endTime = performance.now();
      
      console.log(`✅ Successfully imported ${componentName} in ${endTime - startTime}ms`);
      console.log('Module exports:', Object.keys(module));
      
      addResult(componentName, 'success', `Imported successfully in ${Math.round(endTime - startTime)}ms. Exports: ${Object.keys(module).join(', ')}`);
      
    } catch (error) {
      console.error(`❌ Failed to import ${componentName}:`, error);
      addResult(componentName, 'error', `Import failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testComponentRender = async (componentName: string, importPath: string) => {
    addResult(componentName, 'testing', 'Testing component render...');
    
    try {
      console.log(`🎭 Testing render: ${componentName}`);
      
      const module = await import(importPath);
      const Component = module.default || module[componentName];
      
      if (!Component) {
        throw new Error(`No default export or named export '${componentName}' found`);
      }
      
      // Test basic React element creation
      const element = React.createElement(Component, {});
      console.log(`✅ ${componentName} element created successfully:`, element);
      
      addResult(componentName, 'success', 'Component element created successfully');
      
    } catch (error) {
      console.error(`❌ Failed to render ${componentName}:`, error);
      addResult(componentName, 'error', `Render failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testAll = async () => {
    const components = [
      { name: 'SimpleUserManagement', path: './SimpleUserManagement' },
      { name: 'SimpleChecklistManagement', path: './SimpleChecklistManagement' },
      { name: 'PropertyManagement', path: './PropertyManagement' },
      { name: 'AuditCenter', path: './AuditCenter' },
      { name: 'AdminOverview', path: './AdminOverview' },
    ];

    for (const component of components) {
      await testImport(component.name, component.path);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Component Import Test</h1>
        <p className="text-gray-600 mt-1">Test individual component imports to identify failures</p>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Import Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => testImport('SimpleUserManagement', './SimpleUserManagement')}>
                Test Users
              </Button>
              <Button onClick={() => testImport('SimpleChecklistManagement', './SimpleChecklistManagement')}>
                Test Checklists
              </Button>
              <Button onClick={() => testImport('PropertyManagement', './PropertyManagement')}>
                Test Properties
              </Button>
              <Button onClick={() => testImport('AuditCenter', './AuditCenter')}>
                Test Audit
              </Button>
              <Button onClick={() => testImport('AdminOverview', './AdminOverview')}>
                Test Overview
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={testAll} variant="outline">
                Test All Imports
              </Button>
              <Button onClick={() => setResults([])} variant="outline">
                Clear Results
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Render Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Component Render Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => testComponentRender('SimpleUserManagement', './SimpleUserManagement')}>
              Render Users
            </Button>
            <Button onClick={() => testComponentRender('SimpleChecklistManagement', './SimpleChecklistManagement')}>
              Render Checklists
            </Button>
            <Button onClick={() => testComponentRender('PropertyManagement', './PropertyManagement')}>
              Render Properties
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results ({results.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-gray-500">No tests run yet</p>
            ) : (
              results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border ${
                    result.status === 'success' 
                      ? 'border-green-200 bg-green-50' 
                      : result.status === 'error'
                      ? 'border-red-200 bg-red-50'
                      : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {result.component} - {result.status}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {result.message}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {result.timestamp}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}