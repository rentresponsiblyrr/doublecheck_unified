
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
    console.log('🗑️ Starting comprehensive property deletion for:', property.id);

    try {
      // Step 1: Get all inspections for this property
      const { data: inspections, error: inspectionsQueryError } = await supabase
        .from('inspections')
        .select('id')
        .eq('property_id', property.id);

      if (inspectionsQueryError) {
        console.error('❌ Error querying inspections:', inspectionsQueryError);
        throw inspectionsQueryError;
      }

      console.log('📋 Found inspections to delete:', inspections?.length || 0);

      if (inspections && inspections.length > 0) {
        const inspectionIds = inspections.map(i => i.id);
        
        // Step 2: Get all checklist items for these inspections
        const { data: checklistItems, error: checklistQueryError } = await supabase
          .from('checklist_items')
          .select('id')
          .in('inspection_id', inspectionIds);

        if (checklistQueryError) {
          console.error('❌ Error querying checklist items:', checklistQueryError);
          throw checklistQueryError;
        }

        console.log('📝 Found checklist items to delete:', checklistItems?.length || 0);

        // Step 3: Delete media files for checklist items
        if (checklistItems && checklistItems.length > 0) {
          const checklistItemIds = checklistItems.map(ci => ci.id);
          
          console.log('🎬 Deleting media for checklist items...');
          const { error: mediaError } = await supabase
            .from('media')
            .delete()
            .in('checklist_item_id', checklistItemIds);

          if (mediaError) {
            console.error('❌ Error deleting media:', mediaError);
            throw mediaError;
          }
          console.log('✅ Media deleted successfully');
        }

        // Step 4: Delete checklist items
        console.log('🗂️ Deleting checklist items...');
        const { error: checklistItemsError } = await supabase
          .from('checklist_items')
          .delete()
          .in('inspection_id', inspectionIds);

        if (checklistItemsError) {
          console.error('❌ Error deleting checklist items:', checklistItemsError);
          throw checklistItemsError;
        }
        console.log('✅ Checklist items deleted successfully');
      }

      // Step 5: Delete listing photos for this property
      console.log('📸 Deleting listing photos...');
      const { error: listingPhotosError } = await supabase
        .from('listing_photos')
        .delete()
        .eq('property_id', property.id);

      if (listingPhotosError) {
        console.error('❌ Error deleting listing photos:', listingPhotosError);
        throw listingPhotosError;
      }
      console.log('✅ Listing photos deleted successfully');

      // Step 6: Delete webhook notifications for this property
      console.log('🔔 Deleting webhook notifications...');
      const { error: webhookError } = await supabase
        .from('webhook_notifications')
        .delete()
        .eq('property_id', property.id);

      if (webhookError) {
        console.error('❌ Error deleting webhook notifications:', webhookError);
        throw webhookError;
      }
      console.log('✅ Webhook notifications deleted successfully');

      // Step 7: Delete all inspections for this property
      console.log('🔍 Deleting inspections...');
      const { error: inspectionsError } = await supabase
        .from('inspections')
        .delete()
        .eq('property_id', property.id);

      if (inspectionsError) {
        console.error('❌ Error deleting inspections:', inspectionsError);
        throw inspectionsError;
      }
      console.log('✅ Inspections deleted successfully');

      // Step 8: Finally, delete the property itself
      console.log('🏠 Deleting property...');
      const { error: propertyError } = await supabase
        .from('properties')
        .delete()
        .eq('id', property.id);

      if (propertyError) {
        console.error('❌ Error deleting property:', propertyError);
        throw propertyError;
      }

      console.log('✅ Property deleted successfully!');
      
      toast({
        title: "Property Deleted",
        description: "The property and all associated data have been permanently removed.",
      });

      // Trigger UI refresh
      onPropertyDeleted();
      
    } catch (error) {
      console.error('💥 Comprehensive deletion failed:', error);
      toast({
        title: "Deletion Failed",
        description: `Failed to delete property: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
              Are you sure you want to delete "{property.name}"? This action cannot be undone and will permanently remove the property and ALL associated data including inspections, checklist items, media files, and notifications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
