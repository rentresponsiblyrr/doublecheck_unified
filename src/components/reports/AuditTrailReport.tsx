// Audit Trail Report Component - Detailed audit history and AI learning documentation
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Download, FileText, Clock, User, Settings, AlertTriangle } from 'lucide-react';
import { reportService } from '@/services/reportService';
import { auditorService } from '@/services/auditorService';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  actorType: 'inspector' | 'ai' | 'auditor' | 'system';
  target: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  confidence?: number;
  overridden?: boolean;
}

interface AuditTrailReportProps {
  inspectionId: string;
  propertyName: string;
}

export const AuditTrailReport: React.FC<AuditTrailReportProps> = ({
  inspectionId,
  propertyName
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditSummary, setAuditSummary] = useState<{
    totalEvents: number;
    aiDecisions: number;
    auditorOverrides: number;
    systemActions: number;
    averageConfidence: number;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAuditTrailData();
  }, [inspectionId]);

  const loadAuditTrailData = async () => {
    try {
      setIsLoadingData(true);
      
      // Get inspection details with audit information
      const inspectionResult = await auditorService.getInspectionForReview(inspectionId);
      if (!inspectionResult.success || !inspectionResult.data) {
        throw new Error('Failed to load inspection data');
      }

      const inspection = inspectionResult.data;
      const events: AuditEvent[] = [];

      // Add inspection creation event
      events.push({
        id: `inspection-created-${inspection.id}`,
        timestamp: inspection.created_at,
        action: 'Inspection Created',
        actor: inspection.users.name,
        actorType: 'inspector',
        target: 'Inspection',
        details: `Inspection created for ${inspection.properties.name}`
      });

      // Add checklist item events
      inspection.checklist_items.forEach(item => {
        // AI analysis event
        if (item.ai_status && item.ai_confidence) {
          events.push({
            id: `ai-analysis-${item.id}`,
            timestamp: item.created_at,
            action: 'AI Analysis Completed',
            actor: 'AI System',
            actorType: 'ai',
            target: item.title,
            details: `AI analyzed item and determined: ${item.ai_status}`,
            newValue: item.ai_status,
            confidence: item.ai_confidence
          });
        }

        // Completion event
        if (item.status === 'completed') {
          events.push({
            id: `item-completed-${item.id}`,
            timestamp: item.created_at,
            action: 'Item Completed',
            actor: inspection.users.name,
            actorType: 'inspector',
            target: item.title,
            details: `Inspector completed checklist item`,
            previousValue: 'pending',
            newValue: 'completed'
          });
        }

        // Auditor override event
        if (item.user_override) {
          events.push({
            id: `override-${item.id}`,
            timestamp: item.created_at,
            action: 'Auditor Override',
            actor: 'Auditor',
            actorType: 'auditor',
            target: item.title,
            details: `Auditor overrode AI decision`,
            previousValue: item.ai_status,
            newValue: 'overridden',
            overridden: true
          });
        }
      });

      // Add inspection completion event
      if (inspection.end_time) {
        events.push({
          id: `inspection-completed-${inspection.id}`,
          timestamp: inspection.end_time,
          action: 'Inspection Completed',
          actor: inspection.users.name,
          actorType: 'inspector',
          target: 'Inspection',
          details: 'Inspection marked as completed and submitted for review'
        });
      }

      // Sort events by timestamp
      events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setAuditEvents(events);

      // Calculate summary statistics
      const aiDecisions = events.filter(e => e.actorType === 'ai').length;
      const auditorOverrides = events.filter(e => e.overridden).length;
      const systemActions = events.filter(e => e.actorType === 'system').length;
      const confidenceValues = events.filter(e => e.confidence !== undefined).map(e => e.confidence!);
      const averageConfidence = confidenceValues.length > 0 
        ? confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length 
        : 0;

      setAuditSummary({
        totalEvents: events.length,
        aiDecisions,
        auditorOverrides,
        systemActions,
        averageConfidence: Math.round(averageConfidence)
      });

    } catch (error) {
      logger.error('Failed to load audit trail data', error, 'AUDIT_TRAIL_REPORT');
      toast({
        title: 'Failed to Load Audit Data',
        description: 'Could not load audit trail information',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      logger.info('Generating audit trail report', { inspectionId, events: auditEvents.length }, 'AUDIT_TRAIL_REPORT');

      // Generate a specialized audit report
      const result = await reportService.generateInspectionReport(inspectionId, {
        includePhotos: false,
        includeAuditTrail: true,
        includeSummary: true,
        format: 'pdf',
        branding: true
      });
      
      if (result.success && result.data) {
        const fileName = `${propertyName.replace(/[^a-zA-Z0-9]/g, '_')}_Audit_Trail_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        await reportService.downloadReport(result.data, fileName);
        
        toast({
          title: 'Audit Trail Report Generated',
          description: `Report saved as ${fileName}`,
          duration: 5000,
        });
      } else {
        throw new Error(result.error || 'Failed to generate report');
      }
    } catch (error) {
      logger.error('Audit trail report generation failed', error, 'AUDIT_TRAIL_REPORT');
      toast({
        title: 'Report Generation Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getActorIcon = (actorType: string) => {
    switch (actorType) {
      case 'inspector':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'ai':
        return <Settings className="w-4 h-4 text-purple-500" />;
      case 'auditor':
        return <User className="w-4 h-4 text-green-500" />;
      case 'system':
        return <Settings className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActorColor = (actorType: string) => {
    switch (actorType) {
      case 'inspector':
        return 'bg-blue-100 text-blue-800';
      case 'ai':
        return 'bg-purple-100 text-purple-800';
      case 'auditor':
        return 'bg-green-100 text-green-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoadingData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Audit Trail Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner className="w-6 h-6 mr-2" />
            <span>Loading audit trail data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Audit Trail Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Statistics */}
        {auditSummary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{auditSummary.totalEvents}</div>
              <div className="text-sm text-blue-700">Total Events</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{auditSummary.aiDecisions}</div>
              <div className="text-sm text-purple-700">AI Decisions</div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{auditSummary.auditorOverrides}</div>
              <div className="text-sm text-yellow-700">Auditor Overrides</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{auditSummary.averageConfidence}%</div>
              <div className="text-sm text-green-700">Avg. AI Confidence</div>
            </div>
          </div>
        )}

        {/* Audit Events Timeline */}
        <div className="space-y-4">
          <h4 className="font-medium">Audit Events Timeline</h4>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {auditEvents.map((event, index) => (
              <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getActorIcon(event.actorType)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{event.action}</span>
                    <Badge className={`text-xs ${getActorColor(event.actorType)}`}>
                      {event.actor}
                    </Badge>
                    {event.confidence && (
                      <span className="text-xs text-gray-500">
                        {event.confidence}% confidence
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-1">{event.details}</p>
                  
                  {event.previousValue && event.newValue && (
                    <div className="text-xs text-gray-500">
                      {event.previousValue} → {event.newValue}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                    {event.overridden && (
                      <Badge variant="outline" className="text-xs">
                        Overridden
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generation Button */}
        <div className="flex gap-2">
          <Button 
            onClick={handleGenerateReport}
            disabled={isGenerating || auditEvents.length === 0}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generate Audit Trail Report
              </>
            )}
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 border-t pt-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p>This report provides a complete audit trail of all actions taken during the inspection.</p>
              <p className="mt-1">Includes AI decisions, auditor overrides, and system events for compliance tracking.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditTrailReport;