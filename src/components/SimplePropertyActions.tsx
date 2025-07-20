
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { deletePropertyData } from "@/utils/propertyDeletion";

interface SimplePropertyActionsProps {
  propertyId: string;
  propertyName: string;
  onPropertyDeleted: () => void;
}

export const SimplePropertyActions = ({
  propertyId,
  propertyName,
  onPropertyDeleted
}: SimplePropertyActionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    // REMOVED: console.log('✏️ Editing property:', propertyId);
    navigate(`/add-property?edit=${propertyId}`);
  };

  const handleDelete = async () => {
    // REMOVED: console.log('🗑️ Starting comprehensive property deletion:', propertyId);
    setIsDeleting(true);

    try {
      // Use the comprehensive deletion utility that handles all cascade conflicts
      await deletePropertyData(propertyId);

      // REMOVED: console.log('✅ Property deleted successfully via comprehensive deletion');
      toast({
        title: "Property Deleted",
        description: `"${propertyName}" and all associated data have been permanently removed.`,
      });

      setShowDeleteDialog(false);
      onPropertyDeleted();
    } catch (error) {
      // REMOVED: console.error('💥 Comprehensive property deletion failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (errorMessage.includes('already in progress')) {
        toast({
          title: "Deletion In Progress",
          description: "Property deletion is already in progress. Please wait for completion.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error Deleting Property",
          description: `Failed to delete property: ${errorMessage}`,
          variant: "destructive",
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{propertyName}"? This action cannot be undone.
              All associated inspections and data will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
