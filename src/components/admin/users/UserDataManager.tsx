import React, { useState, useEffect, useCallback } from "react";
import { secureUserDataService } from "@/services/admin/SecureUserDataService";
import { User } from "@/types/database-verified";
import { logger } from "@/utils/logger";

interface UserFormData {
  name: string;
  email: string;
  role: string;
  phone: string;
  status: string;
}

interface UserDataManagerProps {
  children: (props: {
    users: User[];
    loading: boolean;
    error: string | null;
    onCreateUser: (data: UserFormData) => Promise<void>;
    onUpdateUser: (id: string, data: UserFormData) => Promise<void>;
    onDeleteUser: (id: string) => Promise<void>;
    onRefresh: () => void;
  }) => React.ReactNode;
}

export const UserDataManager: React.FC<UserDataManagerProps> = ({
  children,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const userList = await secureUserDataService.loadUsers();
      setUsers(userList);

      logger.info("Users loaded successfully", {
        component: "UserDataManager",
        count: userList.length,
        action: "users_load",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load users";
      setError(errorMessage);

      logger.error("Failed to load users", {
        component: "UserDataManager",
        error: errorMessage,
        action: "users_load",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(
    async (data: UserFormData) => {
      try {
        const userData = {
          name: data.name,
          email: data.email,
          role: data.role as any,
          status: data.status as any,
          phone: data.phone || undefined,
        };

        await secureUserDataService.createUser(userData);
        await loadUsers();

        logger.info("User created successfully", {
          component: "UserDataManager",
          email: data.email,
          role: data.role,
          action: "user_create",
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create user";

        logger.error("Failed to create user", {
          component: "UserDataManager",
          error: errorMessage,
          email: data.email,
          action: "user_create",
        });

        throw new Error(errorMessage);
      }
    },
    [loadUsers],
  );

  const updateUser = useCallback(
    async (id: string, data: UserFormData) => {
      try {
        const updates = {
          name: data.name,
          email: data.email,
          role: data.role as any,
          status: data.status as any,
          phone: data.phone || undefined,
        };

        await secureUserDataService.updateUser(id, updates);
        await loadUsers();

        logger.info("User updated successfully", {
          component: "UserDataManager",
          userId: id,
          action: "user_update",
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update user";

        logger.error("Failed to update user", {
          component: "UserDataManager",
          error: errorMessage,
          userId: id,
          action: "user_update",
        });

        throw new Error(errorMessage);
      }
    },
    [loadUsers],
  );

  const deleteUser = useCallback(
    async (id: string) => {
      try {
        // Note: For security, we typically soft-delete users by updating status
        // Hard deletion might violate audit trails
        await secureUserDataService.updateUser(id, {
          status: "suspended" as any,
        });
        await loadUsers();

        logger.info("User suspended (soft delete) successfully", {
          component: "UserDataManager",
          userId: id,
          action: "user_delete",
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to suspend user";

        logger.error("Failed to suspend user", {
          component: "UserDataManager",
          error: errorMessage,
          userId: id,
          action: "user_delete",
        });

        throw new Error(errorMessage);
      }
    },
    [loadUsers],
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <>
      {children({
        users,
        loading,
        error,
        onCreateUser: createUser,
        onUpdateUser: updateUser,
        onDeleteUser: deleteUser,
        onRefresh: loadUsers,
      })}
    </>
  );
};
