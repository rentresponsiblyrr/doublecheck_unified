/**
 * User Table Component
 * Displays users in a sortable, filterable table with actions
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Users,
} from "lucide-react";
import { User, USER_ROLES } from "./types";

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  isLoading?: boolean;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  onEdit,
  onDelete,
  isLoading = false,
}) => {
  const getRoleBadge = (role: string) => {
    const roleConfig = USER_ROLES.find((r) => r.value === role);
    const colorMap: Record<string, string> = {
      admin: "bg-red-100 text-red-800",
      auditor: "bg-blue-100 text-blue-800",
      inspector: "bg-green-100 text-green-800",
    };

    return (
      <Badge
        className={`${colorMap[role] || "bg-gray-100 text-gray-800"} text-xs`}
      >
        <Shield className="h-3 w-3 mr-1" />
        {roleConfig?.label || role}
      </Badge>
    );
  };

  const getStatusBadge = (user: User) => {
    if (user.is_active) {
      return (
        <Badge
          variant="default"
          className="text-xs bg-green-100 text-green-800"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastSignIn = (lastSignIn?: string) => {
    if (!lastSignIn) return "Never";

    const date = new Date(lastSignIn);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No users found
          </h3>
          <p className="text-gray-600">
            Try adjusting your filters or invite new users to the platform.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">Avatar</TableHead>
            <TableHead className="w-[250px]">User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Sign In</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.id}
              className={!user.is_active ? "opacity-60" : ""}
            >
              <TableCell>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </TableCell>

              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium text-sm">{user.name}</div>
                  <div className="flex items-center space-x-1 text-xs text-gray-600">
                    <Mail className="h-3 w-3" />
                    <span>{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="text-xs text-gray-500">{user.phone}</div>
                  )}
                </div>
              </TableCell>

              <TableCell>{getRoleBadge(user.role)}</TableCell>

              <TableCell>{getStatusBadge(user)}</TableCell>

              <TableCell className="text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatLastSignIn(user.last_sign_in_at)}</span>
                </div>
              </TableCell>

              <TableCell className="text-sm text-gray-600">
                {new Date(user.created_at).toLocaleDateString()}
              </TableCell>

              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onEdit(user)}
                      className="cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit User
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigator.clipboard.writeText(user.email)}
                      className="cursor-pointer"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Copy Email
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(user)}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {user.is_active ? "Deactivate User" : "Delete User"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
