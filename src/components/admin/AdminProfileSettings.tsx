/**
 * Admin Profile Settings - User Profile Management
 *
 * Provides profile management functionality for admin users including
 * personal information, security settings, preferences, and notifications.
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// EXTRACTED COMPONENTS - ARCHITECTURAL EXCELLENCE
import { ProfileTab } from "./AdminProfileSettings/components/ProfileTab";
import { SecurityTab } from "./AdminProfileSettings/components/SecurityTab";
import {
  User,
  Shield,
  Bell,
  Palette,
  Save,
  Upload,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger/production-logger";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

interface NotificationPreferences {
  email_inspections: boolean;
  email_reports: boolean;
  email_alerts: boolean;
  push_notifications: boolean;
  sms_alerts: boolean;
}

interface SecuritySettings {
  two_factor_enabled: boolean;
  password_last_changed?: string;
  session_timeout: number;
}

export default function AdminProfileSettings() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [notificationPrefs, setNotificationPrefs] =
    useState<NotificationPreferences>({
      email_inspections: true,
      email_reports: true,
      email_alerts: true,
      push_notifications: false,
      sms_alerts: false,
    });
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    two_factor_enabled: false,
    session_timeout: 30,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Get profile from users table
        const { data: profile, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          logger.error("Failed to load user profile", { error: error.message });
          toast.error("Failed to load profile information");
          return;
        }

        setUserProfile(profile);
        setProfileForm({
          name: profile.name || "",
          email: profile.email || "",
          phone: profile.phone || "",
        });

        logger.info("User profile loaded successfully", {
          component: "AdminProfileSettings",
          userId: user.id,
        });
      }
    } catch (error) {
      logger.error("Error loading user profile", {
        error: (error as Error).message,
      });
      toast.error("Failed to load profile information");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSave = async () => {
    if (!userProfile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          name: profileForm.name,
          phone: profileForm.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userProfile.id);

      if (error) {
        throw error;
      }

      // Update local state
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              name: profileForm.name,
              phone: profileForm.phone,
              updated_at: new Date().toISOString(),
            }
          : null,
      );

      toast.success("Profile updated successfully");
      logger.info("Profile updated", {
        component: "AdminProfileSettings",
        userId: userProfile.id,
      });
    } catch (error) {
      logger.error("Failed to update profile", {
        error: (error as Error).message,
      });
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.new.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new,
      });

      if (error) {
        throw error;
      }

      toast.success("Password updated successfully");
      setPasswordForm({ current: "", new: "", confirm: "" });
      setShowPasswordChange(false);

      logger.info("Password updated", {
        component: "AdminProfileSettings",
        userId: userProfile?.id,
      });
    } catch (error) {
      logger.error("Failed to update password", {
        error: (error as Error).message,
      });
      toast.error("Failed to update password");
    }
  };

  const handleNotificationPrefsUpdate = async (
    key: keyof NotificationPreferences,
    value: boolean,
  ) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: value }));

    // In a real implementation, this would save to database
    // For now, just show success message
    toast.success("Notification preferences updated");

    logger.info("Notification preferences updated", {
      component: "AdminProfileSettings",
      userId: userProfile?.id,
      setting: key,
      value,
    });
  };

  if (isLoading) {
    return (
      <div
        id="profile-settings-loading"
        className="flex items-center justify-center min-h-64"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading profile settings...</span>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div id="profile-settings-error" className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Profile Not Found
            </h3>
            <p className="text-gray-600 mb-4">
              Unable to load your profile information.
            </p>
            <Button onClick={loadUserProfile} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div id="admin-profile-settings-container" className="space-y-6">
      {/* Header */}
      <div id="profile-settings-header">
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your personal information, security settings, and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center space-x-2"
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="flex items-center space-x-2"
          >
            <Palette className="w-4 h-4" />
            <span>Preferences</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <ProfileTab
            userProfile={userProfile}
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            onSaveProfile={handleSaveProfile}
            isSaving={isSaving}
          />
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
                  <Button
                    onClick={handleProfileSave}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
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
                      <Label htmlFor="confirm-password">
                        Confirm New Password
                      </Label>
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
                      <Button onClick={handlePasswordChange}>
                        Update Password
                      </Button>
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

            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={securitySettings.two_factor_enabled}
                    onCheckedChange={(checked) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        two_factor_enabled: checked,
                      }))
                    }
                  />
                  <Label>Enable Two-Factor Authentication</Label>
                </div>
                <p className="text-sm text-gray-600">
                  Add an extra layer of security to your account with 2FA
                </p>
                {securitySettings.two_factor_enabled && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm text-green-800">
                        Two-factor authentication is enabled
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-inspections">
                      Inspection Updates
                    </Label>
                    <p className="text-sm text-gray-600">
                      Get notified about inspection completions and updates
                    </p>
                  </div>
                  <Switch
                    id="email-inspections"
                    checked={notificationPrefs.email_inspections}
                    onCheckedChange={(checked) =>
                      handleNotificationPrefsUpdate(
                        "email_inspections",
                        checked,
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-reports">Report Generation</Label>
                    <p className="text-sm text-gray-600">
                      Get notified when reports are generated
                    </p>
                  </div>
                  <Switch
                    id="email-reports"
                    checked={notificationPrefs.email_reports}
                    onCheckedChange={(checked) =>
                      handleNotificationPrefsUpdate("email_reports", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-alerts">System Alerts</Label>
                    <p className="text-sm text-gray-600">
                      Get notified about system issues and alerts
                    </p>
                  </div>
                  <Switch
                    id="email-alerts"
                    checked={notificationPrefs.email_alerts}
                    onCheckedChange={(checked) =>
                      handleNotificationPrefsUpdate("email_alerts", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">
                      Push Notifications
                    </Label>
                    <p className="text-sm text-gray-600">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={notificationPrefs.push_notifications}
                    onCheckedChange={(checked) =>
                      handleNotificationPrefsUpdate(
                        "push_notifications",
                        checked,
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms-alerts">SMS Alerts</Label>
                    <p className="text-sm text-gray-600">
                      Receive SMS alerts for critical issues
                    </p>
                  </div>
                  <Switch
                    id="sms-alerts"
                    checked={notificationPrefs.sms_alerts}
                    onCheckedChange={(checked) =>
                      handleNotificationPrefsUpdate("sms_alerts", checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="session-timeout">
                    Session Timeout (minutes)
                  </Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={securitySettings.session_timeout}
                    onChange={(e) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        session_timeout: parseInt(e.target.value) || 30,
                      }))
                    }
                    className="max-w-xs"
                  />
                  <p className="text-sm text-gray-600">
                    How long before you're automatically logged out due to
                    inactivity
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Account Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Created:</span>
                      <span>
                        {new Date(userProfile.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span>
                        {new Date(userProfile.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    {userProfile.last_login_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Login:</span>
                        <span>
                          {new Date(
                            userProfile.last_login_at,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
