import React from 'react';
import { Eye, AlertTriangle } from 'lucide-react';

export const AuditCenterFallback: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Eye className="h-6 w-6" />
          Audit Center (Emergency Mode)
        </h1>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800">Component Loading Error</h3>
            <p className="text-yellow-700 text-sm mt-1">
              The main audit center component failed to load. This emergency fallback is active.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Emergency Audit Access</h2>
        <p className="text-gray-600 mb-4">
          To access audit data while the main component is unavailable:
        </p>
        
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded border">
            <strong>Inspections Table:</strong>
            <p className="text-sm mt-1">Main inspection records with completion status</p>
          </div>
          
          <div className="p-3 bg-gray-50 rounded border">
            <strong>Checklist Items:</strong>
            <p className="text-sm mt-1">Individual inspection items in 'inspection_checklist_items' table</p>
          </div>
          
          <div className="p-3 bg-gray-50 rounded border">
            <strong>Media Files:</strong>
            <p className="text-sm mt-1">Photos and videos in 'media' table linked to checklist items</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold text-blue-800 mb-2">Audit SQL Queries</h3>
          <div className="space-y-2 text-sm font-mono bg-white p-3 rounded border">
            <div>-- Get all completed inspections</div>
            <div>SELECT * FROM inspections WHERE completed = true;</div>
            <div className="mt-2">-- Get inspection with checklist items</div>
            <div>SELECT i.*, ici.status, ici.inspector_notes</div>
            <div>FROM inspections i</div>
            <div>LEFT JOIN inspection_checklist_items ici ON i.id = ici.inspection_id;</div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <button 
            onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
            className="block w-full text-left px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Open Supabase Dashboard
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="block w-full text-left px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Retry Component Load
          </button>
        </div>
      </div>
    </div>
  );
};