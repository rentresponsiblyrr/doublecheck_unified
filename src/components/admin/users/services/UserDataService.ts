/**
 * User Data Service - Enterprise Grade
 *
 * Handles all user CRUD operations with proper error handling and logging
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { User, UserFormData } from "../types";
import type { MutableRefObject } from "react";

export class UserDataService {
  constructor(
    private toast: any,
    private mountedRef: MutableRefObject<boolean>,
  ) {}

  /**
   * Load users from database
   */
  async loadUsers(): Promise<User[]> {
    try {
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
    } catch (error) {
      logger.error("Failed to load users:", error, "USER_DATA_SERVICE");

      this.toast({
        title: "Error loading users",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });

      throw error;
    }
  }

  /**
   * Save user (create or update)
   */
  async saveUser(
    formData: UserFormData,
    editingUser: User | null,
  ): Promise<void> {
    try {
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

        this.toast({
          title: "Success",
          description: "User account updated successfully.",
        });

        logger.info(`Updated user: ${editingUser.id}`, {}, "USER_DATA_SERVICE");
      } else {
        // For new users, we would typically integrate with Supabase Auth
        this.toast({
          title: "Information",
          description:
            "User creation requires admin API integration. Please use Supabase dashboard for now.",
          variant: "destructive",
        });

        logger.warn(
          "User creation attempted - requires admin API integration",
          {},
          "USER_DATA_SERVICE",
        );
        return;
      }
    } catch (error) {
      logger.error("Failed to save user:", error, "USER_DATA_SERVICE");
      this.toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save user",
        variant: "destructive",
      });
      throw error;
    }
  }

  /**
   * Delete user (deactivate)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          status: "inactive",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      this.toast({
        title: "Success",
        description: "User deactivated successfully.",
      });

      logger.info(`Deactivated user: ${userId}`, {}, "USER_DATA_SERVICE");
    } catch (error) {
      logger.error("Failed to delete user:", error, "USER_DATA_SERVICE");
      this.toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
      throw error;
    }
  }
}
