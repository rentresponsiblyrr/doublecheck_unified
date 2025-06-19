
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
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
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Property {
  id: string;
  name: string;
  address: string;
  vrbo_url: string | null;
  airbnb_url: string | null;
  status: string | null;
}

interface PropertyActionsProps {
  property: Property;
  onPropertyDeleted: () => void;
}

export const PropertyActions = ({ property, onPropertyDeleted }: PropertyActionsProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleEdit = () => {
    console.log('🔧 Editing property:', property.id);
    navigate(`/add-property?edit=${property.id}`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    console.log('🗑️ Deleting property:', property.id);

    try {
      // First, delete any related inspections
      const { error: inspectionsError } = await supabase
        .from('inspections')
        .delete()
        .eq('property_id', property.id);

      if (inspectionsError) {
        console.error('❌ Error deleting inspections:', inspectionsError);
        throw inspectionsError;
      }

      // Then delete the property
      const { error: propertyError } = await supabase
        .from('properties')
        .delete()
        .eq('id', property.id);

      if (propertyError) {
        console.error('❌ Error deleting property:', propertyError);
        throw propertyError;
      }

      console.log('✅ Property deleted successfully');
      
      toast({
        title: "Property Deleted",
        description: "The property has been removed successfully.",
      });

      onPropertyDeleted();
    } catch (error) {
      console.error('💥 Failed to delete property:', error);
      toast({
        title: "Error",
        description: "Failed to delete property. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white">
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
            className="cursor-pointer"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Property
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Property
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{property.name}"? This action cannot be undone and will also delete any associated inspections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
