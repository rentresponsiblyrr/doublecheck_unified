import React, { useState, useEffect, useCallback } from "react";
import {
  productionDb,
  ProductionUser,
} from "@/services/productionDatabaseService";
import { logger } from "@/lib/logger/production-logger";

interface UserFormData {
  name: string;
  email: string;
  role: string;
  phone: string;
  status: string;
}

interface UserDataManagerProps {
  children: (props: {
    users: ProductionUser[];
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
  const [users, setUsers] = useState<ProductionUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const userList = await productionDb.getUsers();
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
        await productionDb.createUser(data);
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
        await productionDb.updateUser(id, data);
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
        await productionDb.deleteUser(id);
        await loadUsers();

        logger.info("User deleted successfully", {
          component: "UserDataManager",
          userId: id,
          action: "user_delete",
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete user";

        logger.error("Failed to delete user", {
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
