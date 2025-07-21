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

const AuditTrailReport: React.FC<AuditTrailReportProps> = ({
  inspectionId,
  propertyName,
  className = ''
}) => {
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditTrail();
  }, [inspectionId]);

  const fetchAuditTrail = async () => {
    try {
      setIsLoading(true);
      logger.info('Fetching audit trail', { inspectionId }, 'AUDIT_TRAIL_REPORT');

      // Query inspection logs and related audit data
      const { data: logs, error: logsError } = await supabase
        .from('logs')
        .select(`
          *,
          static_safety_items!inner (
            id,
            title,
            category
          ),
          profiles!inner (
            id,
            full_name
          )
        `)
        .eq('property_id', inspectionId.split('-')[0]) // Extract property_id from inspection
        .order('created_at', { ascending: true });

      if (logsError) {
        throw logsError;
      }

      // Transform logs into audit trail entries
      const trailEntries: AuditTrailEntry[] = logs?.map((log: any) => ({
        id: log.log_id?.toString() || log.id,
        timestamp: log.created_at || new Date().toISOString(),
        action: `Checked: ${log.static_safety_items?.title || 'Safety Item'}`,
        user_id: log.inspector_id || 'system',
        user_name: log.profiles?.full_name || 'System',
        details: log.inspector_remarks || log.ai_result || 'No additional details',
        category: log.static_safety_items?.category?.toLowerCase() as 'inspection',
        status: log.pass === true ? 'completed' : log.pass === false ? 'failed' : 'pending',
        metadata: {
          checklistItemId: log.checklist_id,
          pass: log.pass,
          evidence_count: log.media?.length || 0
        }
      })) || [];

      // Add system entries for inspection lifecycle
      const systemEntries: AuditTrailEntry[] = [
        {
          id: `${inspectionId}-start`,
          timestamp: new Date().toISOString(),
          action: 'Inspection Started',
          user_id: 'system',
          user_name: 'System',
          details: `Inspection initiated for property: ${propertyName}`,
          category: 'system',
          status: 'completed',
          metadata: { propertyName }
        },
        {
          id: `${inspectionId}-ai-analysis`,
          timestamp: new Date().toISOString(),
          action: 'AI Analysis Completed',
          user_id: 'system',
          user_name: 'AI System',
          details: 'Automated photo analysis and quality assessment completed',
          category: 'ai_analysis',
          status: 'completed',
          metadata: { analysisType: 'photo_comparison' }
        }
      ];

      const allEntries = [...systemEntries, ...trailEntries].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      setAuditTrail(allEntries);
    } catch (error) {
      logger.error('Failed to fetch audit trail', error, 'AUDIT_TRAIL_REPORT');
      toast({
        title: 'Error Loading Audit Trail',
        description: 'Failed to load inspection audit trail. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportAuditTrail = async () => {
    try {
      setIsExporting(true);
      logger.info('Exporting audit trail', { inspectionId }, 'AUDIT_TRAIL_REPORT');

      // Create CSV content
      const csvHeader = 'Timestamp,Action,User,Details,Category,Status\n';
      const csvContent = auditTrail.map(entry => 
        `"${new Date(entry.timestamp).toLocaleString()}","${entry.action}","${entry.user_name}","${entry.details.replace(/"/g, '""')}","${entry.category}","${entry.status}"`
      ).join('\n');

      const csvData = csvHeader + csvContent;
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      
      // Download CSV file
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${propertyName.replace(/[^a-zA-Z0-9]/g, '_')}_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Audit Trail Exported',
        description: 'Audit trail has been downloaded as CSV file.',
        duration: 3000,
      });
    } catch (error) {
      logger.error('Failed to export audit trail', error, 'AUDIT_TRAIL_REPORT');
      toast({
        title: 'Export Failed',
        description: 'Failed to export audit trail. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getActionIcon = (category: string, status: string) => {
    switch (category) {
      case 'photo':
        return <Camera className="w-4 h-4" />;
      case 'ai_analysis':
        return <Eye className="w-4 h-4" />;
      case 'review':
        return <User className="w-4 h-4" />;
      case 'system':
        return <FileText className="w-4 h-4" />;
      default:
        return status === 'completed' ? <CheckCircle className="w-4 h-4" /> :
               status === 'failed' ? <XCircle className="w-4 h-4" /> :
               <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Audit Trail
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAuditTrail}
            disabled={isExporting || auditTrail.length === 0}
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
      <CardContent>
        {auditTrail.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No audit trail entries found for this inspection.</p>
          </div>
        ) : (
          <ScrollArea className="h-96 w-full">
            <div className="space-y-4">
              {auditTrail.map((entry, index) => (
                <div key={entry.id} className="relative">
                  {index < auditTrail.length - 1 && (
                    <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-200" />
                  )}
                  
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center ${getStatusColor(entry.status)}`}>
                      {getActionIcon(entry.category, entry.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          {entry.action}
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {entry.category.replace('_', ' ')}
                          </Badge>
                          <Badge 
                            variant={entry.status === 'completed' ? 'default' : 
                                   entry.status === 'failed' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {entry.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mt-1 text-sm text-gray-600">
                        {entry.details}
                      </div>
                      
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {entry.user_name}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {index < auditTrail.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {auditTrail.length > 0 && (
          <div className="mt-4 pt-4 border-t text-sm text-gray-500">
            <div className="flex justify-between items-center">
              <span>Total Events: {auditTrail.length}</span>
              <span>
                Generated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditTrailReport;
export { AuditTrailReport };