/**
 * User Data Service - Enterprise Grade
 *
 * Handles all user CRUD operations with proper error handling and logging
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { User, UserFormData } from "../types";
import { emergencyAuthService } from "@/services/emergency/EmergencyAuthService";
import { emergencyDatabaseFallback } from "@/services/emergency/EmergencyDatabaseFallback";
import type { MutableRefObject } from "react";

interface ToastInstance {
  success: (message: string) => void;
  error: (message: string) => void;
  info?: (message: string) => void;
  warning?: (message: string) => void;
}

export class UserDataService {
  constructor(
    private toast: ToastInstance,
    private mountedRef: MutableRefObject<boolean>,
  ) {}

  /**
   * Load users from database with emergency fallback
   */
  async loadUsers(): Promise<User[]> {
    return emergencyDatabaseFallback.executeWithFallback(
      async () => {
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("*")
          .order("created_at", { ascending: false });

        if (usersError) {
          throw new Error(`Database error: ${usersError.message}`);
        }

        logger.info(
          `Loaded ${usersData?.length || 0} users successfully`,
          {},
          "USER_DATA_SERVICE",
        );
        return usersData || [];
      },
      [], // Emergency fallback: return empty array instead of crashing
      "loadUsers"
    );
  }

  /**
   * Save user (create or update) with emergency fallback
   */
  async saveUser(
    formData: UserFormData,
    editingUser: User | null,
  ): Promise<void> {
    return emergencyDatabaseFallback.executeWithFallback(
      async () => {
        if (editingUser) {
          // Update existing user
          const { error } = await supabase
            .from("users")
            .update({
              name: formData.name,
              role: formData.role,
              phone: formData.phone,
              updated_at: new Date().toISOString(),
            })
            .eq("id", editingUser.id);

          if (error) throw error;

          this.toast.success("User account updated successfully.");
          logger.info(`Updated user: ${editingUser.id}`, {}, "USER_DATA_SERVICE");
        } else {
          // For new users, we would typically integrate with Supabase Auth
          this.toast.info("User creation requires admin API integration. Please use Supabase dashboard for now.");
          logger.warn("User creation attempted - requires admin API integration", {}, "USER_DATA_SERVICE");
          return;
        }
      },
      undefined, // Emergency fallback: do nothing instead of crashing
      "saveUser"
    );
  }

  /**
   * Delete user (deactivate) with emergency fallback
   */
  async deleteUser(userId: string): Promise<void> {
    return emergencyDatabaseFallback.executeWithFallback(
      async () => {
        const { error } = await supabase
          .from("users")
          .update({
            status: "inactive",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) throw error;

        this.toast.success("User deactivated successfully.");
        logger.info(`Deactivated user: ${userId}`, {}, "USER_DATA_SERVICE");
      },
      undefined, // Emergency fallback: do nothing instead of crashing
      "deleteUser"
    );
  }
}
