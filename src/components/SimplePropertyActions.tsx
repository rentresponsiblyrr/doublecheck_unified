
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
    console.log('✏️ Editing property:', propertyId);
    navigate(`/add-property?edit=${propertyId}`);
  };

  const handleDelete = async () => {
    console.log('🗑️ Deleting property:', propertyId);
    setIsDeleting(true);

    try {
      // First, delete any related inspections and their checklist items
      const { data: inspections } = await supabase
        .from('inspections')
        .select('id')
        .eq('property_id', propertyId);

      if (inspections && inspections.length > 0) {
        const inspectionIds = inspections.map(i => i.id);
        
        // Delete checklist items for these inspections
        await supabase
          .from('checklist_items')
          .delete()
          .in('inspection_id', inspectionIds);
        
        // Delete inspections
        await supabase
          .from('inspections')
          .delete()
          .eq('property_id', propertyId);
      }

      // Delete the property
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) {
        console.error('❌ Error deleting property:', error);
        toast({
          title: "Error Deleting Property",
          description: "Failed to delete the property. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Property deleted successfully');
      toast({
        title: "Property Deleted",
        description: `"${propertyName}" has been deleted successfully.`,
      });

      setShowDeleteDialog(false);
      onPropertyDeleted();
    } catch (error) {
      console.error('💥 Unexpected error deleting property:', error);
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred while deleting the property.",
        variant: "destructive",
      });
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
