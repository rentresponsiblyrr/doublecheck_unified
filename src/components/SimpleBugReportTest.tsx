/**
 * @fileoverview Simple Bug Report Test Component
 * Basic test to ensure bug reporting functionality is working
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bug } from 'lucide-react';
import BugReportDialog from './BugReportDialog';

export const SimpleBugReportTest: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          background: 'white',
          padding: '20px',
          border: '2px solid red',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}
      >
        <h3 style={{ margin: '0 0 15px 0', color: 'red' }}>
          🐛 Bug Report Test
        </h3>
        <Button 
          onClick={() => setIsOpen(true)}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          <Bug className="w-4 h-4 mr-2" />
          Test Bug Report
        </Button>
        <p style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
          If you can see this, the bug report system is loaded
        </p>
      </div>

      <BugReportDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialTitle="Test Bug Report"
        initialDescription="This is a test of the bug reporting system"
      />
    </>
  );
};

export default SimpleBugReportTest;