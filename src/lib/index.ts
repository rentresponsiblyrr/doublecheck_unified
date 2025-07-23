// Library utilities
export { supabase } from "./supabase";
export * from "./utils";

// AI Module
export * from "./ai";

// Scrapers Module
export * from "./scrapers";

// Constants and configurations
export const APP_CONFIG = {
  name: "STR Certified",
  version: "1.0.0",
  description:
    "Professional short-term rental property inspection and certification platform",
} as const;
