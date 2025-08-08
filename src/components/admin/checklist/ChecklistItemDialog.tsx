/**
 * Checklist Item Dialog Component
 * Extracted from FunctionalChecklistManagement.tsx
 */

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, Camera, Video, CheckSquare, FileText } from "lucide-react";
import { ProductionSafetyItem } from "@/services/core/DataService";
import { SafetyItemFormData } from "@/hooks/useFunctionalChecklistManagement";

interface ChecklistItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: ProductionSafetyItem | null;
  formData: SafetyItemFormData;
  setFormData: (data: SafetyItemFormData) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  submitLoading: boolean;
  categories: string[];
}

const evidenceTypes = [
  { value: "photo", label: "Photo", icon: Camera },
  { value: "video", label: "Video", icon: Video },
  { value: "none", label: "Visual Check Only", icon: CheckSquare },
  { value: "documentation", label: "Documentation", icon: FileText },
];

export const ChecklistItemDialog: React.FC<ChecklistItemDialogProps> = ({
  isOpen,
  onClose,
  editingItem,
  formData,
  setFormData,
  onSubmit,
  submitLoading,
  categories,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? "Edit Checklist Item" : "Create New Checklist Item"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="label">Item Label *</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              required
              placeholder="Enter descriptive label for this checklist item"
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="evidence_type">Evidence Type *</Label>
            <Select
              value={formData.evidence_type}
              onValueChange={(value) =>
                setFormData({ ...formData, evidence_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select evidence type" />
              </SelectTrigger>
              <SelectContent>
                {evidenceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center space-x-2">
                      <type.icon className="w-4 h-4" />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="required"
              checked={formData.required}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, required: checked })
              }
            />
            <Label htmlFor="required">Required Item</Label>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional notes or instructions for inspectors"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="gpt_prompt">AI Analysis Prompt</Label>
            <Textarea
              id="gpt_prompt"
              value={formData.gpt_prompt}
              onChange={(e) =>
                setFormData({ ...formData, gpt_prompt: e.target.value })
              }
              placeholder="Prompt for AI analysis of photos/videos for this item"
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              This prompt will be used by AI to analyze evidence captured for
              this checklist item.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitLoading}>
              {submitLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingItem ? (
                "Update Item"
              ) : (
                "Create Item"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
