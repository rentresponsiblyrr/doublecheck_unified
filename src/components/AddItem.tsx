
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddItemProps {
  inspectionId: string;
  onItemAdded: () => void;
}

export const AddItem = ({ inspectionId, onItemAdded }: AddItemProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<string>("");
  const [evidenceType, setEvidenceType] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!label.trim() || !category || !evidenceType) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // First create a static safety item for the custom item
      const { data: staticItem, error: staticError } = await supabase
        .from('static_safety_items')
        .insert({
          label: label.trim(),
          notes: `Custom item added during inspection`,
          category,
          required: false,
          evidence_type: evidenceType,
          checklist_id: 0 // Use 0 for custom items
        })
        .select('id')
        .single();

      if (staticError) {
        console.error('Error creating static safety item:', staticError);
        toast({
          title: "Error",
          description: "Failed to create checklist item template",
          variant: "destructive",
        });
        return;
      }

      // Then create the inspection checklist item
      const { error } = await supabase
        .from('logs')
        .insert({
          inspection_id: inspectionId,
          static_safety_item_id: staticItem.id,
          status: 'pending',
          photo_evidence_required: evidenceType === 'photo',
          is_critical: false
        });

      if (error) {
        console.error('Error adding checklist item:', error);
        toast({
          title: "Error",
          description: "Failed to add item. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Item added",
        description: "Checklist item has been added successfully.",
      });

      // Reset form
      setLabel("");
      setCategory("");
      setEvidenceType("");
      setIsAdding(false);
      onItemAdded();
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdding) {
    return (
      <div className="text-center py-8">
        <Button onClick={() => setIsAdding(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Checklist Item
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Add New Checklist Item</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(false)}
          className="p-2"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Item Description
          </label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Check smoke detector functionality"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <Select value={category} onValueChange={setCategory} required>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="safety">Safety</SelectItem>
              <SelectItem value="amenity">Amenity</SelectItem>
              <SelectItem value="cleanliness">Cleanliness</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Evidence Type
          </label>
          <Select value={evidenceType} onValueChange={setEvidenceType} required>
            <SelectTrigger>
              <SelectValue placeholder="Select evidence type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="photo">Photo</SelectItem>
              <SelectItem value="video">Video</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Adding..." : "Add Item"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsAdding(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
