/**
 * Audit Trail Header - Focused Component
 * 
 * Displays header with title and export functionality
 */

import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface AuditTrailHeaderProps {
  isExporting: boolean;
  hasEntries: boolean;
  onExport: () => void;
}

export const AuditTrailHeader: React.FC<AuditTrailHeaderProps> = ({
  isExporting,
  hasEntries,
  onExport
}) => {
  return (
    <CardHeader id="audit-trail-header">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Audit Trail
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={isExporting || !hasEntries}
        >
          {isExporting ? (
            <>
              <LoadingSpinner className="w-4 h-4 mr-2" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </>
          )}
        </Button>
      </div>
    </CardHeader>
  );
};
