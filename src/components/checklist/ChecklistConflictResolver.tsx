/**
 * Checklist Conflict Resolver - Enterprise Grade
 * 
 * Handles conflict resolution when concurrent edits are detected
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ArrowRight, Users } from 'lucide-react';

interface ChecklistConflictResolverProps {
  conflictData: any;
  onResolve: (resolution: 'accept_local' | 'accept_remote' | 'merge') => Promise<void>;
  isResolving: boolean;
}

export const ChecklistConflictResolver: React.FC<ChecklistConflictResolverProps> = ({
  conflictData,
  onResolve,
  isResolving
}) => {
  if (!conflictData) {
    return null;
  }

  return (
    <Card id="checklist-conflict-resolver" className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-800">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Conflict Detected
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-orange-200">
          <Users className="h-4 w-4" />
          <AlertDescription className="text-orange-800">
            Another inspector has modified this item while you were working on it.
            Please choose how to resolve this conflict:
          </AlertDescription>
        </Alert>

        {/* Conflict Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-orange-800">Your Version</h4>
            <div className="p-3 bg-white border border-orange-200 rounded text-sm">
              <div><strong>Status:</strong> {conflictData.local?.status || 'No changes'}</div>
              <div><strong>Notes:</strong> {conflictData.local?.notes || 'No notes'}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-orange-800">Other Inspector's Version</h4>
            <div className="p-3 bg-white border border-orange-200 rounded text-sm">
              <div><strong>Status:</strong> {conflictData.remote?.status || 'No changes'}</div>
              <div><strong>Notes:</strong> {conflictData.remote?.notes || 'No notes'}</div>
              <div className="text-xs text-gray-600 mt-2">
                Modified by: {conflictData.remote?.modifiedBy} at {
                  conflictData.remote?.modifiedAt ? 
                  new Date(conflictData.remote.modifiedAt).toLocaleString() : 
                  'Unknown time'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Resolution Options */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-orange-800">Choose Resolution:</h4>
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={() => onResolve('accept_local')}
              disabled={isResolving}
              variant="outline"
              className="justify-start border-orange-200 hover:bg-orange-100"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Keep My Changes
              <span className="text-xs text-gray-600 ml-2">(Overwrite other inspector's changes)</span>
            </Button>

            <Button
              onClick={() => onResolve('accept_remote')}
              disabled={isResolving}
              variant="outline"
              className="justify-start border-orange-200 hover:bg-orange-100"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Accept Their Changes
              <span className="text-xs text-gray-600 ml-2">(Discard my changes)</span>
            </Button>

            <Button
              onClick={() => onResolve('merge')}
              disabled={isResolving}
              variant="outline"
              className="justify-start border-orange-200 hover:bg-orange-100"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Merge Both Versions
              <span className="text-xs text-gray-600 ml-2">(Combine notes and use latest status)</span>
            </Button>
          </div>
        </div>

        {isResolving && (
          <Alert className="border-blue-200 bg-blue-50">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <AlertDescription className="text-blue-800">
              Resolving conflict...
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};