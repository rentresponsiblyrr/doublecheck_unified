/**
 * User Form Dialog Component
 * Handles creating and editing user accounts
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2, Shield } from "lucide-react";
import { User, UserFormData, USER_ROLES } from "./types";
import { sanitizeFormInput, validateEmail } from "@/utils/validation";

interface UserFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UserFormData) => Promise<void>;
  editingUser: User | null;
  isLoading?: boolean;
}

const defaultFormData: UserFormData = {
  email: "",
  name: "",
  role: "inspector",
  phone: "",
};

export const UserFormDialog: React.FC<UserFormDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  editingUser,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when dialog opens/closes or editing user changes
  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        setFormData({
          email: editingUser.email,
          name: editingUser.full_name,
          role: editingUser.role,
          phone: editingUser.phone || "",
        });
      } else {
        setFormData(defaultFormData);
      }
      setValidationErrors({});
    }
  }, [isOpen, editingUser]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate email
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Validate name
    if (!formData.name.trim()) {
      errors.name = "Full name is required";
    } else if (formData.name.length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else if (formData.name.length > 100) {
      errors.name = "Name must be less than 100 characters";
    }

    // Validate role
    if (!formData.role) {
      errors.role = "Role is required";
    } else if (!USER_ROLES.find((r) => r.value === formData.role)) {
      errors.role = "Please select a valid role";
    }

    // Validate phone (optional but must be valid if provided)
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        errors.phone = "Please enter a valid phone number";
      }
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
      const sanitizedData: UserFormData = {
        email: sanitizeFormInput(formData.email.toLowerCase().trim()),
        name: sanitizeFormInput(formData.name.trim()),
        role: formData.role,
        phone: sanitizeFormInput(formData.phone.trim()),
      };

      await onSave(sanitizedData);
      onClose();
    } catch (error) {
      setValidationErrors({
        form: error instanceof Error ? error.message : "Failed to save user",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormData = <K extends keyof UserFormData>(
    key: K,
    value: UserFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));

    // Clear validation error for this field
    if (validationErrors[key]) {
      setValidationErrors((prev) => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const getSelectedRole = () => {
    return USER_ROLES.find((role) => role.value === formData.role);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingUser ? "Edit User Account" : "Create New User Account"}
          </DialogTitle>
          <DialogDescription>
            {editingUser
              ? "Update the user account details below."
              : "Add a new user to the STR Certified platform."}
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

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="user@company.com"
              value={formData.email}
              onChange={(e) => updateFormData("email", e.target.value)}
              className={validationErrors.email ? "border-red-500" : ""}
              disabled={!!editingUser} // Email shouldn't be changed after creation
            />
            {validationErrors.email && (
              <p className="text-red-500 text-sm">{validationErrors.email}</p>
            )}
            {editingUser && (
              <p className="text-xs text-gray-500">
                Email cannot be changed after account creation
              </p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => updateFormData("name", e.target.value)}
              className={validationErrors.name ? "border-red-500" : ""}
            />
            {validationErrors.name && (
              <p className="text-red-500 text-sm">{validationErrors.name}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">
              Role <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                updateFormData("role", value as UserFormData["role"])
              }
            >
              <SelectTrigger
                className={validationErrors.role ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select user role" />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{role.label}</div>
                        <div className="text-xs text-gray-500">
                          {role.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.role && (
              <p className="text-red-500 text-sm">{validationErrors.role}</p>
            )}
            {getSelectedRole() && (
              <p className="text-xs text-gray-600">
                {getSelectedRole()?.description}
              </p>
            )}
          </div>

          {/* Phone (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone Number <span className="text-gray-500">(optional)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={(e) => updateFormData("phone", e.target.value)}
              className={validationErrors.phone ? "border-red-500" : ""}
            />
            {validationErrors.phone && (
              <p className="text-red-500 text-sm">{validationErrors.phone}</p>
            )}
          </div>

          {/* Role Permissions Info */}
          {formData.role && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Shield className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-blue-800">
                    {getSelectedRole()?.label} Permissions
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {formData.role === "admin" &&
                      "Full system access, user management, and configuration"}
                    {formData.role === "auditor" &&
                      "Review inspections, provide feedback, and generate reports"}
                    {formData.role === "inspector" &&
                      "Conduct property inspections and submit reports"}
                  </div>
                </div>
              </div>
            </div>
          )}
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
            {editingUser ? "Update User" : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
