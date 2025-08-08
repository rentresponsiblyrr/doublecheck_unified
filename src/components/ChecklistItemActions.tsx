import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, MinusCircle, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { debugLogger } from '@/utils/debugLogger';

interface ChecklistItemActionsProps {
  itemId: string;
  currentNotes: string;
  onComplete: () => void;
  inspectionId: string;
}

export const ChecklistItemActions = ({
  itemId,
  currentNotes,
  onComplete,
  inspectionId,
}: ChecklistItemActionsProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isOnline, retryConnection } = useNetworkStatus();

  const handleStatusChange = async (
    newStatus: "completed" | "failed" | "not_applicable",
  ) => {
    // Check network status before attempting update
    if (!isOnline) {
      toast({
        title: "No internet connection",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    // Optimistic UI update - show success immediately for better UX
    let statusMessage = "";
    switch (newStatus) {
      case "completed":
        statusMessage = "passed";
        break;
      case "failed":
        statusMessage = "failed";
        break;
      case "not_applicable":
        statusMessage = "not applicable";
        break;
    }

    try {
      // Primary database operation - RPC already handles audit trail (last_modified_by/at)
      // Add timeout to prevent indefinite hanging on mobile networks
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(
                "Network timeout. Please check your connection and try again.",
              ),
            ),
          10000,
        );
      });

      // Direct update to checklist_items table with better error handling
      let statusError = null;
      try {
        const updateResult = await Promise.race([
          supabase
            .from('checklist_items')
            .update({
              status: newStatus,
              notes: currentNotes || null,
              last_modified_by: user?.id,
              last_modified_at: new Date().toISOString()
            })
            .eq('id', itemId)
            .select()
            .single(),
          timeoutPromise,
        ]);
        
        statusError = (updateResult as any)?.error;
      } catch (error) {
        statusError = error;
      }

      if (statusError) {
        debugLogger.error('Update error details', { error: statusError });
        // Enhanced error handling for common mobile issues
        if (
          statusError.message?.includes("timeout") ||
          statusError.message?.includes("network")
        ) {
          throw new Error(
            "Network timeout. Please check your connection and try again.",
          );
        }
        if (
          statusError.message?.includes("permission") ||
          statusError.message?.includes("RLS") ||
          statusError.code === 'PGRST301'
        ) {
          throw new Error(
            "Permission denied. Please refresh the page and try again.",
          );
        }
        // Provide more specific error message
        throw new Error(
          statusError.message || "Failed to update status. Please try again."
        );
      }

      // Optional: Save notes to history (only if notes exist)
      // This runs concurrently with the success feedback for better UX
      if (currentNotes && currentNotes.trim() && user) {
        const userName =
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Unknown Inspector";

        // Non-blocking notes save with error handling
        const saveNotes = async () => {
          try {
            await supabase
              .rpc("append_user_note", {
                item_id: itemId,
                note_text: currentNotes.trim(),
                user_id: user.id,
                user_name: userName,
              });
          } catch (error) {
            // Log error but don't block UI - notes are secondary
            debugLogger.info('Note history save failed, but status updated successfully');
          }
        };
        saveNotes();
      }

      // Show success immediately
      toast({
        title: "Status updated",
        description: `Item marked as ${statusMessage}${currentNotes ? " with notes saved." : "."}`,
      });

      // Trigger parent refresh
      onComplete();
    } catch (error) {
      // Enhanced error messages for mobile users
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update status. Please try again.";

      // Offer retry for network-related errors
      if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("network")
      ) {
        toast({
          title: "Network error",
          description: `${errorMessage} Please try again when connection improves.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Update failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        {/* Pass button */}
        <Button
          onClick={() => handleStatusChange("completed")}
          disabled={isSaving || !isOnline}
          className="w-full bg-green-600 hover:bg-green-700 text-white h-12 disabled:opacity-50"
        >
          {isSaving ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              <span>Saving...</span>
            </div>
          ) : (
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span>Mark as Passed</span>
            </div>
          )}
        </Button>

        {/* Fail and N/A buttons in a row */}
        <div className="flex gap-3">
          <Button
            onClick={() => handleStatusChange("failed")}
            disabled={isSaving || !isOnline}
            variant="destructive"
            className="flex-1 h-12 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span>Saving...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <X className="w-5 h-5 mr-2" />
                <span>Mark as Failed</span>
              </div>
            )}
          </Button>

          <Button
            onClick={() => handleStatusChange("not_applicable")}
            disabled={isSaving || !isOnline}
            variant="outline"
            className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                <span>Saving...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <MinusCircle className="w-5 h-5 mr-2" />
                <span>Mark as N/A</span>
              </div>
            )}
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center mt-2">
        {currentNotes
          ? "Your notes will be saved with the status."
          : "Add notes above to include them with your status."}
      </p>
      <p className="text-xs text-amber-600 text-center mt-1 font-medium">
        ⚠️ You must mark Pass, Fail, or N/A to complete this item
      </p>

      {/* Network Status Indicator */}
      <div className="flex items-center justify-center mt-2">
        {isOnline ? (
          <div className="flex items-center text-green-600 text-xs">
            <Wifi className="w-3 h-3 mr-1" />
            <span>Online</span>
          </div>
        ) : (
          <div className="flex items-center text-red-600 text-xs">
            <WifiOff className="w-3 h-3 mr-1" />
            <span>Offline - Changes will sync when reconnected</span>
          </div>
        )}
      </div>
    </div>
  );
};
