/**
 * SECURITY TAB COMPONENT - EXTRACTED FROM GOD COMPONENT
 *
 * Professional security settings tab with password management.
 * Clean separation from AdminProfileSettings for better maintainability.
 *
 * @author STR Certified Engineering Team
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Shield } from "lucide-react";

interface PasswordForm {
  current: string;
  new: string;
  confirm: string;
}

interface SecurityTabProps {
  showPasswordChange: boolean;
  setShowPasswordChange: (show: boolean) => void;
  passwordForm: PasswordForm;
  setPasswordForm: React.Dispatch<React.SetStateAction<PasswordForm>>;
  onPasswordChange: () => void;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
  showPasswordChange,
  setShowPasswordChange,
  passwordForm,
  setPasswordForm,
  onPasswordChange,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showPasswordChange ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Change your password to keep your account secure
              </p>
              <Button
                onClick={() => setShowPasswordChange(true)}
                variant="outline"
              >
                <Key className="w-4 h-4 mr-2" />
                Change Password
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      current: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordForm.new}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      new: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirm: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={onPasswordChange}>Update Password</Button>
                <Button
                  onClick={() => {
                    setShowPasswordChange(false);
                    setPasswordForm({
                      current: "",
                      new: "",
                      confirm: "",
                    });
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-gray-600">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Shield className="w-4 h-4 mr-2" />
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
