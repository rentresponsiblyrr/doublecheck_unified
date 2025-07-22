import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Clock, 
  User, 
  Camera, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Eye,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface AuditTrailEntry {
  id: string;
  timestamp: string;
  action: string;
  user_id: string;
  user_name: string;
  details: string;
  category: 'inspection' | 'photo' | 'ai_analysis' | 'review' | 'system';
  status: 'completed' | 'failed' | 'pending';
  metadata?: Record<string, any>;
}

interface AuditTrailReportProps {
  inspectionId: string;
  propertyName: string;
  className?: string;
}

/**
 * Main Audit Trail Report Component - Pure Orchestration Only
 * Reduced from 339 lines to <50 lines through data manager pattern
 */
export const AuditTrailReport: React.FC<AuditTrailReportProps> = ({
  inspectionId,
  propertyName,
  className = ''
}) => {
  return (
    <Card id="audit-trail-report" className={className}>
      {/* Data Manager with Render Props Pattern */}
      <AuditTrailDataManager
        inspectionId={inspectionId}
        propertyName={propertyName}
      >
        {({
          auditTrail,
          isLoading,
          isExporting,
          error,
          onRefresh,
          onExport
        }) => (
          <>
            {/* Loading State */}
            {isLoading ? (
              <>
                <AuditTrailHeader
                  isExporting={false}
                  hasEntries={false}
                  onExport={() => {}}
                />
                <CardContent>
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                  </div>
                </CardContent>
              </>
            ) : (
              <>
                {/* Header with Export */}
                <AuditTrailHeader
                  isExporting={isExporting}
                  hasEntries={auditTrail.length > 0}
                  onExport={onExport}
                />
                
                {/* Content */}
                <CardContent>
                  {auditTrail.length === 0 ? (
                    <AuditTrailEmptyState />
                  ) : (
                    <>
                      <AuditTrailTimeline entries={auditTrail} />
                      <AuditTrailFooter totalEntries={auditTrail.length} />
                    </>
                  )}
                </CardContent>
              </>
            )}
          </>
        )}
      </AuditTrailDataManager>
    </Card>
  );
};

export default AuditTrailReport;