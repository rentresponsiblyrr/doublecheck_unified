import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, UserCheck, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SystemStatusPanel } from "../SystemStatusPanel";
import { cn } from "@/lib/utils";

interface AdminHeaderProps {
  userProfile: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  } | null;
  className?: string;
  onMobileMenuClick?: () => void;
  isMobile?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  userProfile,
  className = "",
  onMobileMenuClick,
  isMobile = false,
}) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header
      id="admin-header"
      className={cn(
        "bg-white shadow-sm border-b sticky top-0 z-30 transition-all duration-300",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between transition-all duration-300",
          isMobile ? "px-3 py-3" : "px-6 py-4",
        )}
      >
        {/* Left Section: Mobile Menu + Title */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileMenuClick}
              className="p-2 -ml-2"
              id="mobile-menu-button"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {/* Header Content */}
          <div className="flex-1 min-w-0">
            <h2
              className={cn(
                "font-semibold text-gray-900 truncate transition-all duration-300",
                isMobile ? "text-lg" : "text-xl",
              )}
            >
              Admin Dashboard
            </h2>
            {!isMobile && (
              <p className="text-sm text-gray-500 truncate">
                Manage properties, users, and system configuration
              </p>
            )}
          </div>
        </div>

        {/* Right Section: Status + User Menu */}
        <div
          className={cn(
            "flex items-center flex-shrink-0",
            isMobile ? "space-x-2" : "space-x-4",
          )}
        >
          {/* System Status - Hidden on mobile to save space */}
          {!isMobile && <SystemStatusPanel />}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "relative rounded-full p-1",
                  isMobile ? "h-9 w-9" : "h-10 w-10",
                )}
                id="user-menu-button"
                aria-label="User menu"
              >
                <Avatar className={cn(isMobile ? "h-7 w-7" : "h-8 w-8")}>
                  <AvatarImage
                    src={userProfile?.avatar_url}
                    alt={userProfile?.full_name || "Admin"}
                  />
                  <AvatarFallback className="text-xs">
                    {getInitials(userProfile?.full_name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-56"
              align="end"
              id="user-menu-content"
              sideOffset={5}
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none truncate">
                    {userProfile?.full_name || "Admin User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {userProfile?.email || "admin@strbook.com"}
                  </p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {/* Mobile-only: System Status */}
              {isMobile && (
                <>
                  <DropdownMenuItem id="system-status-mobile" className="p-2">
                    <SystemStatusPanel />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem id="profile-menu-item">
                <UserCheck className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                id="signout-menu-item"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
