import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, RefreshCw, AlertTriangle, Users } from "lucide-react";
import { UserDataManager } from "./UserDataManager";
import { UsersTable } from "./UsersTable";
import { UserFormDialogNew } from "./UserFormDialogNew";

export const UserManagementContainer: React.FC = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div id="user-management-container" className="container mx-auto py-6">
      <UserDataManager>
        {({
          users,
          loading,
          error,
          onCreateUser,
          onUpdateUser,
          onDeleteUser,
          onRefresh,
        }) => (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6" />
                <h1 className="text-2xl font-bold">User Management</h1>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading}
                  id="refresh-users-button"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>

                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  disabled={loading}
                  id="add-user-button"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </div>

            {error && (
              <Alert
                variant="destructive"
                className="mb-6"
                id="user-error-alert"
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <UsersTable
              users={users}
              loading={loading}
              onUpdateUser={onUpdateUser}
              onDeleteUser={onDeleteUser}
            />

            <UserFormDialogNew
              isOpen={createDialogOpen}
              onOpenChange={setCreateDialogOpen}
              onSubmit={onCreateUser}
            />
          </>
        )}
      </UserDataManager>
    </div>
  );
};
