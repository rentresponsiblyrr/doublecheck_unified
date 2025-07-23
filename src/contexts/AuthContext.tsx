import { createContext } from "react";
import { User } from "@supabase/supabase-js";

export interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  clearSession: () => void;
  loadUserRole: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
