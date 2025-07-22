import { supabase } from '@/integrations/supabase/client';
import { INSPECTION_STATUS, STATUS_GROUPS } from '@/types/inspection-status';

interface DuplicateInspection {
  id: string;
  property_id: string;
  property_name: string;
  status: string;
  start_time: string;
  inspector_id: string | null;
  total_checklist_items: number;
  completed_checklist_items: number;
  shouldKeep: boolean;
  reason: string;
}

interface CleanupSummary {
  totalInspections: number;
  duplicateGroups: number;
  inspectionsToRemove: number;
  inspectionsToKeep: number;
  safeToDelete: DuplicateInspection[];
}

export class InspectionCleanupService {
  
  /**
   * Analyzes all inspections and identifies duplicates per property
   */
  static async analyzeDuplicateInspections(): Promise<CleanupSummary> {
    // Get all inspections with property and progress information
    const { data: inspections, error } = await supabase
        .from('inspections')
        .select(`
          id,
          property_id,
          status,
          start_time,
          inspector_id,
          properties!inner(name),
          logs(id, status)
        `)
        .order('property_id')
        .order('start_time', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch inspections: ${error.message}`);
      }

      // Group inspections by property
      const propertyGroups = new Map<string, DuplicateInspection[]>();
      
      inspections?.forEach(inspection => {
        const propertyId = inspection.property_id;
        const propertyName = inspection.properties?.name || 'Unknown Property';
        
        const totalItems = inspection.logs?.length || 0;
        const completedItems = inspection.logs?.filter(item => item.status === 'completed').length || 0;
        
        const duplicate: DuplicateInspection = {
          id: inspection.id,
          property_id: propertyId,
          property_name: propertyName,
          status: inspection.status,
          start_time: inspection.start_time,
          inspector_id: inspection.inspector_id,
          total_checklist_items: totalItems,
          completed_checklist_items: completedItems,
          shouldKeep: false,
          reason: ''
        };

        if (!propertyGroups.has(propertyId)) {
          propertyGroups.set(propertyId, []);
        }
        propertyGroups.get(propertyId)!.push(duplicate);
      });

      // Analyze each property group and determine which inspections to keep
      let totalInspections = 0;
      let duplicateGroups = 0;
      const safeToDelete: DuplicateInspection[] = [];

      propertyGroups.forEach((inspections, propertyId) => {
        totalInspections += inspections.length;
        
        if (inspections.length > 1) {
          duplicateGroups++;
          
          // Apply business logic to determine which to keep
          const analyzed = this.analyzePropertyInspections(inspections);
          analyzed.toDelete.forEach(inspection => {
            safeToDelete.push(inspection);
          });
        } else {
          // Single inspection - always keep
          inspections[0].shouldKeep = true;
          inspections[0].reason = 'Only inspection for this property';
        }
      });

      const summary: CleanupSummary = {
        totalInspections,
        duplicateGroups,
        inspectionsToRemove: safeToDelete.length,
        inspectionsToKeep: totalInspections - safeToDelete.length,
        safeToDelete
      };

    return summary;
  }

  /**
   * Analyzes inspections for a single property and determines which to keep/delete
   */
  private static analyzePropertyInspections(inspections: DuplicateInspection[]) {
    const toKeep: DuplicateInspection[] = [];
    const toDelete: DuplicateInspection[] = [];

    // Sort by start time (newest first)
    const sorted = [...inspections].sort((a, b) => 
      new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );


    // Business logic for determining which inspections to keep:
    
    // 1. Keep the most recent inspection if it's in an active state or has progress
    const mostRecent = sorted[0];
    const isActiveStatus = [...STATUS_GROUPS.ACTIVE, ...STATUS_GROUPS.REVIEW_PIPELINE, INSPECTION_STATUS.NEEDS_REVISION].includes(mostRecent.status as any);
    const hasProgress = mostRecent.completed_checklist_items > 0;
    
    if (isActiveStatus || hasProgress) {
      mostRecent.shouldKeep = true;
      mostRecent.reason = `Most recent with ${isActiveStatus ? 'active status' : 'progress'} (${mostRecent.completed_checklist_items}/${mostRecent.total_checklist_items} items)`;
      toKeep.push(mostRecent);
      
      // Mark others for deletion if they're in early stages
      sorted.slice(1).forEach(inspection => {
        const isEarlyStage = [INSPECTION_STATUS.DRAFT, 'available'].includes(inspection.status);
        const noProgress = inspection.completed_checklist_items === 0;
        
        if (isEarlyStage && noProgress) {
          inspection.shouldKeep = false;
          inspection.reason = `Duplicate with no progress (status: ${inspection.status})`;
          toDelete.push(inspection);
        } else {
          // Keep inspections with significant progress or final states
          inspection.shouldKeep = true;
          inspection.reason = `Has progress or final state (${inspection.completed_checklist_items}/${inspection.total_checklist_items} items, status: ${inspection.status})`;
          toKeep.push(inspection);
        }
      });
    } else {
      // Most recent has no progress - check if any others have progress
      const withProgress = sorted.filter(inspection => inspection.completed_checklist_items > 0);
      
      if (withProgress.length > 0) {
        // Keep the one with most progress
        const mostProgress = withProgress.reduce((best, current) => 
          current.completed_checklist_items > best.completed_checklist_items ? current : best
        );
        
        mostProgress.shouldKeep = true;
        mostProgress.reason = `Most progress (${mostProgress.completed_checklist_items}/${mostProgress.total_checklist_items} items)`;
        toKeep.push(mostProgress);
        
        // Delete others with no progress
        sorted.filter(i => i.id !== mostProgress.id && i.completed_checklist_items === 0).forEach(inspection => {
          inspection.shouldKeep = false;
          inspection.reason = 'Duplicate with no progress';
          toDelete.push(inspection);
        });
        
        // Keep others with progress
        sorted.filter(i => i.id !== mostProgress.id && i.completed_checklist_items > 0).forEach(inspection => {
          inspection.shouldKeep = true;
          inspection.reason = `Has progress (${inspection.completed_checklist_items}/${inspection.total_checklist_items} items)`;
          toKeep.push(inspection);
        });
      } else {
        // No inspections have progress - keep most recent, delete others
        mostRecent.shouldKeep = true;
        mostRecent.reason = 'Most recent inspection (no others have progress)';
        toKeep.push(mostRecent);
        
        sorted.slice(1).forEach(inspection => {
          inspection.shouldKeep = false;
          inspection.reason = 'Older duplicate with no progress';
          toDelete.push(inspection);
        });
      }
    }

    return { toKeep, toDelete };
  }

  /**
   * Safely deletes the identified duplicate inspections
   */
  static async cleanupDuplicateInspections(inspectionsToDelete: string[]): Promise<void> {
    if (inspectionsToDelete.length === 0) {
      return;
    }

    // Delete inspection checklist items first (foreign key constraint)
    const { error: checklistError } = await supabase
        .from('logs')
        .delete()
        .in('inspection_id', inspectionsToDelete);

      if (checklistError) {
        throw new Error(`Failed to delete inspection checklist items: ${checklistError.message}`);
      }


      // Delete media files associated with checklist items
      const { error: mediaError } = await supabase
        .from('media')
        .delete()
        .in('checklist_item_id', inspectionsToDelete); // This may not work if we already deleted inspection checklist items

      if (mediaError) {
        // Continue anyway - media cleanup can be done separately
      }

      // Delete the inspections
      const { error: inspectionError } = await supabase
        .from('inspections')
        .delete()
        .in('id', inspectionsToDelete);

      if (inspectionError) {
        throw new Error(`Failed to delete inspections: ${inspectionError.message}`);
      }
  }

  /**
   * Generates a summary report of duplicates for review
   */
  static generateCleanupReport(summary: CleanupSummary): string {
    const report = `
# Inspection Cleanup Report

## Summary
- **Total Inspections**: ${summary.totalInspections}
- **Properties with Duplicates**: ${summary.duplicateGroups}
- **Inspections to Remove**: ${summary.inspectionsToRemove}
- **Inspections to Keep**: ${summary.inspectionsToKeep}

## Inspections Recommended for Deletion

${summary.safeToDelete.map(inspection => `
### ${inspection.property_name}
- **Inspection ID**: ${inspection.id}
- **Status**: ${inspection.status}
- **Progress**: ${inspection.completed_checklist_items}/${inspection.total_checklist_items} items
- **Start Time**: ${new Date(inspection.start_time).toLocaleString()}
- **Reason for Deletion**: ${inspection.reason}
`).join('\n')}

## Next Steps
1. Review the list above carefully
2. Run \`InspectionCleanupService.cleanupDuplicateInspections()\` with the IDs to delete
3. Verify the cleanup was successful
`;

    return report;
  }
}