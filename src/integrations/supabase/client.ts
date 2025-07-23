// EMERGENCY DATABASE FIX: Using resilient client to solve critical connectivity issues
// This replaces the auto-generated client with enhanced error handling and retry logic

import type { Database } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";

// Import from the resilient client to get enhanced error handling and retry logic
import { supabase as resilientSupabase } from "@/lib/supabase/resilient-client";

// Re-export the enhanced client with proper typing
export const supabase = resilientSupabase as SupabaseClient<Database>;

// Also export testing utilities for development and debugging
export {
  testDatabaseConnection,
  getDatabaseAuthStatus,
} from "@/lib/supabase/resilient-client";

// Export types for compatibility
export type { Database } from "./types";
