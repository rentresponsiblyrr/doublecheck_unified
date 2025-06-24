
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DataIntegrityCheck {
  id: string;
  type: 'missing_data' | 'orphaned_record' | 'duplicate_data' | 'invalid_state';
  severity: 'low' | 'medium' | 'high';
  message: string;
  data?: any;
}

export const useDataIntegrity = (inspectionId?: string) => {
  const [checks, setChecks] = useState<DataIntegrityCheck[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const runIntegrityChecks = async () => {
    if (!inspectionId) return;
    
    setIsChecking(true);
    const issues: DataIntegrityCheck[] = [];

    try {
      // Check for orphaned media items
      const { data: orphanedMedia } = await supabase
        .from('media')
        .select('id, checklist_item_id')
        .not('checklist_item_id', 'in', 
          `(SELECT id FROM checklist_items WHERE inspection_id = '${inspectionId}')`
        );

      if (orphanedMedia && orphanedMedia.length > 0) {
        issues.push({
          id: 'orphaned-media',
          type: 'orphaned_record',
          severity: 'medium',
          message: `Found ${orphanedMedia.length} orphaned media items`,
          data: orphanedMedia
        });
      }

      // Check for checklist items without required evidence
      const { data: itemsWithoutEvidence } = await supabase
        .from('checklist_items')
        .select('id, label, status')
        .eq('inspection_id', inspectionId)
        .in('status', ['completed', 'failed'])
        .not('id', 'in', 
          `(SELECT DISTINCT checklist_item_id FROM media)`
        );

      if (itemsWithoutEvidence && itemsWithoutEvidence.length > 0) {
        issues.push({
          id: 'missing-evidence',
          type: 'missing_data',
          severity: 'high',
          message: `${itemsWithoutEvidence.length} completed items missing evidence`,
          data: itemsWithoutEvidence
        });
      }

      // Check for duplicate checklist items
      const { data: duplicates } = await supabase
        .rpc('analyze_checklist_duplicates');

      if (duplicates && duplicates.length > 0) {
        const inspectionDuplicates = duplicates.filter(d => d.inspection_id === inspectionId);
        if (inspectionDuplicates.length > 0) {
          issues.push({
            id: 'duplicate-items',
            type: 'duplicate_data',
            severity: 'high',
            message: `Found duplicate checklist items`,
            data: inspectionDuplicates
          });
        }
      }

      setChecks(issues);

      if (issues.length > 0) {
        const highSeverityIssues = issues.filter(i => i.severity === 'high').length;
        if (highSeverityIssues > 0) {
          toast({
            title: "Data Integrity Issues Found",
            description: `Found ${highSeverityIssues} high-priority issues that need attention.`,
            variant: "destructive",
          });
        }
      }

    } catch (error) {
      console.error('Data integrity check failed:', error);
      toast({
        title: "Integrity Check Failed",
        description: "Unable to complete data integrity checks.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const fixIssue = async (issueId: string) => {
    const issue = checks.find(c => c.id === issueId);
    if (!issue) return;

    try {
      switch (issue.type) {
        case 'duplicate_data':
          if (issueId === 'duplicate-items') {
            await supabase.rpc('cleanup_duplicate_checklist_items');
            toast({
              title: "Duplicates Cleaned",
              description: "Duplicate checklist items have been removed.",
            });
          }
          break;
        
        case 'orphaned_record':
          if (issueId === 'orphaned-media' && issue.data) {
            const mediaIds = issue.data.map((item: any) => item.id);
            await supabase
              .from('media')
              .delete()
              .in('id', mediaIds);
            toast({
              title: "Orphaned Records Cleaned",
              description: "Orphaned media items have been removed.",
            });
          }
          break;
      }

      // Remove the fixed issue from the list
      setChecks(prev => prev.filter(c => c.id !== issueId));
      
    } catch (error) {
      console.error('Failed to fix issue:', error);
      toast({
        title: "Fix Failed",
        description: "Unable to fix the data integrity issue.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (inspectionId) {
      runIntegrityChecks();
    }
  }, [inspectionId]);

  return {
    checks,
    isChecking,
    runIntegrityChecks,
    fixIssue,
    hasIssues: checks.length > 0,
    highPriorityIssues: checks.filter(c => c.severity === 'high').length
  };
};
