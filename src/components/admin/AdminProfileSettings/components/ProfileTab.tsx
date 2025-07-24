/**
 * PROFILE TAB COMPONENT - EXTRACTED FROM GOD COMPONENT
 *
 * Professional profile management tab with avatar and personal info.
 * Clean separation from AdminProfileSettings for better maintainability.
 *
 * @author STR Certified Engineering Team
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Save } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: string;
}

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
}

interface ProfileTabProps {
  userProfile: UserProfile;
  profileForm: ProfileForm;
  setProfileForm: React.Dispatch<React.SetStateAction<ProfileForm>>;
  onSaveProfile: () => void;
  isSaving: boolean;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  userProfile,
  profileForm,
  setProfileForm,
  onSaveProfile,
  isSaving,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Profile Picture */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={userProfile.avatar_url} />
              <AvatarFallback className="text-lg">
                {userProfile.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Upload New Photo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={profileForm.email}
                disabled
                className="bg-gray-50"
                placeholder="Email cannot be changed here"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder="Enter your phone number"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={userProfile.role}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button onClick={onSaveProfile} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
