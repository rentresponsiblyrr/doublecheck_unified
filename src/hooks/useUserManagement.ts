import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "inspector" | "auditor" | "admin" | "super_admin";
  phone?: string;
  created_at: string;
  last_login_at?: string;
  status: "active" | "inactive" | "suspended";
  is_active: boolean;
  inspection_count?: number;
  audit_count?: number;
}

interface UserManagementState {
  users: User[];
  filteredUsers: User[];
  isLoading: boolean;
  error: string | null;
  currentUser: User | null;
  hasPermission: boolean;
  tableExists: boolean;
}

interface DiagnosticResult {
  usersTableExists: boolean;
  currentUserHasAccess: boolean;
  currentUserRole: string | null;
  fallbackToProfiles: boolean;
  errorDetails: string | null;
}

export const useUserManagement = () => {
  const [state, setState] = useState<UserManagementState>({
    users: [],
    filteredUsers: [],
    isLoading: true,
    error: null,
    currentUser: null,
    hasPermission: false,
    tableExists: false,
  });

  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);

  const runDiagnostic = useCallback(async (): Promise<DiagnosticResult> => {
    logger.info(
      "🔍 Starting user management diagnostic...",
      {},
      "USER_MANAGEMENT",
    );

    const result: DiagnosticResult = {
      usersTableExists: false,
      currentUserHasAccess: false,
      currentUserRole: null,
      fallbackToProfiles: false,
      errorDetails: null,
    };

    try {
      // Step 1: Check if users table exists and is accessible
      const { data: usersTest, error: usersError } = await supabase
        .from("users")
        .select("id, email, role")
        .limit(1);

      if (!usersError) {
        result.usersTableExists = true;
        logger.info(
          "✅ Users table exists and is accessible",
          {},
          "USER_MANAGEMENT",
        );
      } else {
        result.errorDetails = usersError.message;
        logger.warn(
          "⚠️ Users table not accessible:",
          usersError,
          "USER_MANAGEMENT",
        );
      }

      // Step 2: Get current user from auth
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) {
        throw new Error("No authenticated user found");
      }

      // Step 3: Try to find current user in users table
      if (result.usersTableExists) {
        const { data: currentUserData, error: currentUserError } =
          await supabase
            .from("users")
            .select("*")
            .eq("id", authUser.user.id)
            .single();

        if (!currentUserError && currentUserData) {
          result.currentUserRole = currentUserData.role;
          result.currentUserHasAccess = ["admin", "super_admin"].includes(
            currentUserData.role,
          );
          logger.info(
            "✅ Current user found in users table",
            {
              role: currentUserData.role,
              hasAccess: result.currentUserHasAccess,
            },
            "USER_MANAGEMENT",
          );
        } else {
          logger.warn(
            "⚠️ Current user not found in users table",
            currentUserError,
            "USER_MANAGEMENT",
          );
        }
      }

      // Step 4: No fallback needed - users table is the production schema
      // Profiles table does not exist in production
      if (!result.usersTableExists) {
        logger.error(
          "❌ Users table not accessible - this is a critical error",
          {},
          "USER_MANAGEMENT",
        );
      }

      logger.info("📊 Diagnostic complete", result, "USER_MANAGEMENT");
      return result;
    } catch (error) {
      result.errorDetails =
        error instanceof Error ? error.message : "Unknown error";
      logger.error("❌ Diagnostic failed", error, "USER_MANAGEMENT");
      return result;
    }
  }, []);

  const loadUsers = useCallback(async (): Promise<User[]> => {
    logger.info("📥 Loading users...", {}, "USER_MANAGEMENT");

    try {
      // Run diagnostic first if not already done
      const diagResult = diagnostic || (await runDiagnostic());

      if (!diagResult.usersTableExists) {
        throw new Error(
          "Users table does not exist. Please contact your administrator to run the database migration.",
        );
      }

      if (!diagResult.currentUserHasAccess) {
        throw new Error(
          `Access denied. Current user role (${diagResult.currentUserRole || "unknown"}) does not have permission to manage users.`,
        );
      }

      // Load users with activity counts
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) {
        throw new Error(`Failed to load users: ${usersError.message}`);
      }

      if (!usersData || usersData.length === 0) {
        logger.warn("⚠️ No users found in database", {}, "USER_MANAGEMENT");
        return [];
      }

      // Enhance with activity data
      const enhancedUsers = await Promise.all(
        usersData.map(async (user) => {
          let inspectionCount = 0;
          let auditCount = 0;

          try {
            // Get inspection count for inspectors
            if (user.role === "inspector") {
              const { data: inspections } = await supabase
                .from("inspections")
                .select("id")
                .eq("inspector_id", user.id);
              inspectionCount = inspections?.length || 0;
            }

            // Get audit count for auditors (count inspections with auditor feedback)
            if (user.role === "auditor") {
              const { data: audits } = await supabase
                .from("inspections")
                .select("id")
                .not("auditor_feedback", "is", null);
              auditCount = audits?.length || 0;
            }
          } catch (activityError) {
            logger.warn(
              "⚠️ Failed to load activity data for user:",
              user.id,
              "USER_MANAGEMENT",
            );
          }

          // Determine if user is active (signed in within last 30 days)
          const isActive = user.last_login_at
            ? new Date(user.last_login_at).getTime() >
              Date.now() - 30 * 24 * 60 * 60 * 1000
            : false;

          return {
            ...user,
            is_active: isActive,
            inspection_count: inspectionCount,
            audit_count: auditCount,
          } as User;
        }),
      );

      logger.info(
        "✅ Users loaded successfully",
        { count: enhancedUsers.length },
        "USER_MANAGEMENT",
      );
      return enhancedUsers;
    } catch (error) {
      logger.error("❌ Failed to load users", error, "USER_MANAGEMENT");
      throw error;
    }
  }, [diagnostic, runDiagnostic]);

  const createUser = useCallback(
    async (
      userData: Omit<
        User,
        "id" | "created_at" | "is_active" | "inspection_count" | "audit_count"
      >,
    ): Promise<User> => {
      logger.info(
        "➕ Creating new user...",
        { email: userData.email, role: userData.role },
        "USER_MANAGEMENT",
      );

      try {
        // Validate required fields
        if (!userData.email || !userData.name) {
          throw new Error("Email and name are required");
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("email", userData.email.toLowerCase())
          .single();

        if (existingUser) {
          throw new Error("A user with this email already exists");
        }

        // Create user
        const { data: newUser, error } = await supabase
          .from("users")
          .insert([
            {
              ...userData,
              email: userData.email.toLowerCase(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create user: ${error.message}`);
        }

        logger.info(
          "✅ User created successfully",
          { userId: newUser.id },
          "USER_MANAGEMENT",
        );
        return {
          ...newUser,
          is_active: false,
          inspection_count: 0,
          audit_count: 0,
        } as User;
      } catch (error) {
        logger.error("❌ Failed to create user", error, "USER_MANAGEMENT");
        throw error;
      }
    },
    [],
  );

  const updateUser = useCallback(
    async (userId: string, updates: Partial<User>): Promise<User> => {
      logger.info(
        "✏️ Updating user...",
        { userId, updates },
        "USER_MANAGEMENT",
      );

      try {
        const { data: updatedUser, error } = await supabase
          .from("users")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to update user: ${error.message}`);
        }

        logger.info(
          "✅ User updated successfully",
          { userId },
          "USER_MANAGEMENT",
        );
        return updatedUser as User;
      } catch (error) {
        logger.error("❌ Failed to update user", error, "USER_MANAGEMENT");
        throw error;
      }
    },
    [],
  );

  const deleteUser = useCallback(async (userId: string): Promise<void> => {
    logger.info("🗑️ Deleting user...", { userId }, "USER_MANAGEMENT");

    try {
      const { error } = await supabase.from("users").delete().eq("id", userId);

      if (error) {
        throw new Error(`Failed to delete user: ${error.message}`);
      }

      logger.info(
        "✅ User deleted successfully",
        { userId },
        "USER_MANAGEMENT",
      );
    } catch (error) {
      logger.error("❌ Failed to delete user", error, "USER_MANAGEMENT");
      throw error;
    }
  }, []);

  const initialize = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Run diagnostic
      const diagResult = await runDiagnostic();
      setDiagnostic(diagResult);

      if (!diagResult.usersTableExists) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Users table does not exist. Database migration required.",
          hasPermission: false,
          tableExists: false,
        }));
        return;
      }

      if (!diagResult.currentUserHasAccess) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: `Access denied. You need admin permissions to manage users. Current role: ${diagResult.currentUserRole || "unknown"}`,
          hasPermission: false,
          tableExists: true,
        }));
        return;
      }

      // Load users
      const users = await loadUsers();

      setState((prev) => ({
        ...prev,
        users,
        filteredUsers: users,
        isLoading: false,
        error: null,
        hasPermission: true,
        tableExists: true,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to initialize user management";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        hasPermission: false,
      }));
    }
  }, [runDiagnostic, loadUsers]);

  const filterUsers = useCallback(
    (searchQuery: string, roleFilter: string, statusFilter: string) => {
      let filtered = state.users;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (user) =>
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.phone?.toLowerCase().includes(query),
        );
      }

      if (roleFilter !== "all") {
        filtered = filtered.filter((user) => user.role === roleFilter);
      }

      if (statusFilter === "active") {
        filtered = filtered.filter((user) => user.is_active);
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter((user) => !user.is_active);
      }

      setState((prev) => ({ ...prev, filteredUsers: filtered }));
    },
    [state.users],
  );

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    ...state,
    diagnostic,
    actions: {
      initialize,
      loadUsers,
      createUser,
      updateUser,
      deleteUser,
      filterUsers,
      runDiagnostic,
    },
  };
};
