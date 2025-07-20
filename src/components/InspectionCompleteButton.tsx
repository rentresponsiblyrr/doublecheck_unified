
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InspectionCompleteButtonProps {
  inspectionId: string;
  isAllCompleted: boolean;
  passedCount: number;
  failedCount: number;
}

export const InspectionCompleteButton = ({ 
  inspectionId, 
  isAllCompleted, 
  passedCount, 
  failedCount 
}: InspectionCompleteButtonProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCompleting, setIsCompleting] = useState(false);

  const handleCompleteInspection = async () => {
    if (isCompleting) return;
    
    setIsCompleting(true);
    try {
      // REMOVED: console.log('✅ Starting inspection completion:', inspectionId);
      
      const { error } = await supabase
        .from('inspections')
        .update({ 
          status: 'completed',
          completed: true,
          end_time: new Date().toISOString()
        })
        .eq('id', inspectionId);

      if (error) {
        // REMOVED: console.error('❌ Error completing inspection:', error);
        toast({
          title: "Error",
          description: "Failed to complete inspection. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // REMOVED: console.log('✅ Inspection completed successfully');
      toast({
        title: "Inspection Complete!",
        description: `Inspection submitted with ${passedCount} passed and ${failedCount} failed items.`,
      });
      
      navigate(`/inspection-complete/${inspectionId}`);
    } catch (error) {
      // REMOVED: console.error('💥 Failed to complete inspection:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  if (!isAllCompleted) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
      <div className="mb-3 text-center">
        <div className="text-sm text-gray-600">
          <span className="text-green-600 font-medium">✓ {passedCount} Passed</span>
          {failedCount > 0 && (
            <>
              <span className="mx-2">•</span>
              <span className="text-red-600 font-medium">✗ {failedCount} Failed</span>
            </>
          )}
        </div>
      </div>
      <Button 
        onClick={handleCompleteInspection}
        disabled={isCompleting}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
        size="lg"
      >
        {isCompleting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Completing...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Complete Inspection
          </>
        )}
      </Button>
    </div>
  );
};
