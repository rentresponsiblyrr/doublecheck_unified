/**
 * Checklist Form Dialog Component
 * Handles creating and editing checklist items
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { ChecklistItem, ChecklistFormData, CHECKLIST_CATEGORIES, EVIDENCE_TYPES } from './types';
import { sanitizeFormInput } from '@/utils/validation';

interface ChecklistFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ChecklistFormData) => Promise<void>;
  editingItem: ChecklistItem | null;
  isLoading?: boolean;
}

const defaultFormData: ChecklistFormData = {
  label: '',
  category: 'General',
  evidence_type: 'photo',
  required: false,
  notes: '',
  gpt_prompt: ''
};

export const ChecklistFormDialog: React.FC<ChecklistFormDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<ChecklistFormData>(defaultFormData);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when dialog opens/closes or editing item changes
  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setFormData({
          label: editingItem.label,
          category: editingItem.category,
          evidence_type: editingItem.evidence_type,
          required: editingItem.required,
          notes: editingItem.notes || '',
          gpt_prompt: editingItem.gpt_prompt || ''
        });
      } else {
        setFormData(defaultFormData);
      }
      setValidationErrors({});
    }
  }, [isOpen, editingItem]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate label
    if (!formData.label.trim()) {
      errors.label = 'Label is required';
    } else if (formData.label.length < 3) {
      errors.label = 'Label must be at least 3 characters';
    } else if (formData.label.length > 200) {
      errors.label = 'Label must be less than 200 characters';
    }

    // Validate category
    if (!formData.category) {
      errors.category = 'Category is required';
    }

    // Validate evidence type
    if (!formData.evidence_type) {
      errors.evidence_type = 'Evidence type is required';
    }

    // Validate notes length
    if (formData.notes.length > 1000) {
      errors.notes = 'Notes must be less than 1000 characters';
    }

    // Validate GPT prompt length
    if (formData.gpt_prompt.length > 2000) {
      errors.gpt_prompt = 'GPT prompt must be less than 2000 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      
      // Sanitize form inputs
      const sanitizedData: ChecklistFormData = {
        label: sanitizeFormInput(formData.label),
        category: sanitizeFormInput(formData.category),
        evidence_type: sanitizeFormInput(formData.evidence_type),
        required: formData.required,
        notes: sanitizeFormInput(formData.notes),
        gpt_prompt: sanitizeFormInput(formData.gpt_prompt)
      };

      await onSave(sanitizedData);
      onClose();
    } catch (error) {
      setValidationErrors({
        form: error instanceof Error ? error.message : 'Failed to save checklist item'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormData = <K extends keyof ChecklistFormData>(
    key: K,
    value: ChecklistFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    
    // Clear validation error for this field
    if (validationErrors[key]) {
      setValidationErrors(prev => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'Edit Checklist Item' : 'Create New Checklist Item'}
          </DialogTitle>
          <DialogDescription>
            {editingItem 
              ? 'Update the checklist item details below.'
              : 'Add a new item to the inspection checklist.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Form-level error */}
          {validationErrors.form && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{validationErrors.form}</AlertDescription>
            </Alert>
          )}

          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label">
              Label <span className="text-red-500">*</span>
            </Label>
            <Input
              id="label"
              placeholder="Enter checklist item label..."
              value={formData.label}
              onChange={(e) => updateFormData('label', e.target.value)}
              className={validationErrors.label ? 'border-red-500' : ''}
            />
            {validationErrors.label && (
              <p className="text-red-500 text-sm">{validationErrors.label}</p>
            )}
          </div>

          {/* Category and Evidence Type Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => updateFormData('category', value)}
              >
                <SelectTrigger className={validationErrors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CHECKLIST_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.category && (
                <p className="text-red-500 text-sm">{validationErrors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="evidence_type">
                Evidence Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.evidence_type}
                onValueChange={(value) => updateFormData('evidence_type', value)}
              >
                <SelectTrigger className={validationErrors.evidence_type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select evidence type" />
                </SelectTrigger>
                <SelectContent>
                  {EVIDENCE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.evidence_type && (
                <p className="text-red-500 text-sm">{validationErrors.evidence_type}</p>
              )}
            </div>
          </div>

          {/* Required Switch */}
          <div className="flex items-center space-x-2">
            <Switch
              id="required"
              checked={formData.required}
              onCheckedChange={(checked) => updateFormData('required', checked)}
            />
            <Label htmlFor="required" className="text-sm">
              This item is required for all inspections
            </Label>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes <span className="text-gray-500">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Additional notes or instructions for inspectors..."
              value={formData.notes}
              onChange={(e) => updateFormData('notes', e.target.value)}
              rows={3}
              className={validationErrors.notes ? 'border-red-500' : ''}
            />
            <p className="text-xs text-gray-500">
              {formData.notes.length}/1000 characters
            </p>
            {validationErrors.notes && (
              <p className="text-red-500 text-sm">{validationErrors.notes}</p>
            )}
          </div>

          {/* GPT Prompt */}
          <div className="space-y-2">
            <Label htmlFor="gpt_prompt">
              AI Analysis Prompt <span className="text-gray-500">(optional)</span>
            </Label>
            <Textarea
              id="gpt_prompt"
              placeholder="Prompt for AI analysis of this checklist item..."
              value={formData.gpt_prompt}
              onChange={(e) => updateFormData('gpt_prompt', e.target.value)}
              rows={4}
              className={validationErrors.gpt_prompt ? 'border-red-500' : ''}
            />
            <p className="text-xs text-gray-500">
              {formData.gpt_prompt.length}/2000 characters
            </p>
            {validationErrors.gpt_prompt && (
              <p className="text-red-500 text-sm">{validationErrors.gpt_prompt}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingItem ? 'Update Item' : 'Create Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};