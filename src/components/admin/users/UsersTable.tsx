import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Users } from "lucide-react";
import { ProductionUser } from "@/services/core/DataService";
import { UserFormDialogNew } from "./UserFormDialogNew";

interface UserFormData {
  name: string;
  email: string;
  role: string;
  phone: string;
  status: string;
}

interface UsersTableProps {
  users: ProductionUser[];
  loading: boolean;
  onUpdateUser: (id: string, data: UserFormData) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  loading,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ProductionUser | null>(null);

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "destructive";
      case "inspector":
        return "default";
      case "auditor":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "suspended":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handleEditUser = (user: ProductionUser) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      await onDeleteUser(id);
    }
  };

  const handleUpdateSubmit = async (data: UserFormData) => {
    if (editingUser) {
      await onUpdateUser(editingUser.id, data);
    }
  };

  if (loading) {
    return (
      <Card id="users-loading-card">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading users...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="users-table-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Users ({users.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div
            className="text-center py-8 text-muted-foreground"
            id="no-users-message"
          >
            No users found. Create the first user to get started.
          </div>
        ) : (
          <div className="space-y-4" id="users-list">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg"
                id={`user-item-${user.id}`}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium">{user.name}</h3>
                    <Badge variant={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                    <Badge variant={getStatusBadgeColor(user.status)}>
                      {user.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.phone && (
                    <p className="text-sm text-muted-foreground">
                      {user.phone}
                    </p>
                  )}
                  {user.last_login_at && (
                    <p className="text-xs text-muted-foreground">
                      Last login:{" "}
                      {new Date(user.last_login_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                    id={`edit-user-${user.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-700"
                    id={`delete-user-${user.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <UserFormDialogNew
          editingUser={editingUser}
          isOpen={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setEditingUser(null);
          }}
          onSubmit={handleUpdateSubmit}
        />
      </CardContent>
    </Card>
  );
};
