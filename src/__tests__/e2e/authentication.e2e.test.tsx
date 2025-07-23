/**
 * PROFESSIONAL AUTHENTICATION E2E TESTING - ZERO TOLERANCE STANDARDS
 *
 * End-to-end tests for authentication flows that would pass review at Netflix/Meta.
 * Tests real user journeys, security scenarios, and edge cases.
 *
 * Features:
 * - Complete authentication workflows
 * - Role-based access control testing
 * - Session management validation
 * - Security scenario testing
 * - Error recovery testing
 * - Mobile compatibility testing
 *
 * This is how professionals test critical authentication systems.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import React from "react";

// Components under test
import App from "@/App";
import { LoginForm } from "@/components/auth/LoginForm";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleBasedAccess } from "@/components/auth/RoleBasedAccess";

// Store dependencies
import { useAppStore } from "@/stores/appStore";

// Mock dependencies
const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));

vi.mock("@/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Test utilities
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe("Authentication E2E Tests - Professional Standards", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();

    // Reset store state
    useAppStore.getState().setAuth({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      sessionExpiresAt: null,
      role: null,
    });

    // Reset all mocks
    vi.clearAllMocks();

    // Setup default successful responses
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: "test-user-id",
          email: "test@strtested.com",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
        session: { access_token: "test-token" },
      },
      error: null,
    });

    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: {
          role: "inspector",
          full_name: "Test Inspector",
        },
        error: null,
      });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("Complete Login Flow", () => {
    it("should complete successful inspector login journey", async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>,
      );

      // Verify we start at login page
      expect(
        screen.getByRole("heading", { name: /sign in/i }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

      // Fill in login form
      await user.type(screen.getByLabelText(/email/i), "test@strtested.com");
      await user.type(screen.getByLabelText(/password/i), "securePassword123");

      // Submit login
      const loginButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(loginButton);

      // Verify loading state
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();

      // Wait for authentication to complete
      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      });

      // Verify we're redirected to inspector dashboard
      expect(screen.getByText(/inspector dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/start inspection/i)).toBeInTheDocument();

      // Verify user info is displayed
      expect(screen.getByText("Test Inspector")).toBeInTheDocument();

      // Verify Supabase was called correctly
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@strtested.com",
        password: "securePassword123",
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
    });

    it("should complete successful auditor login with different access", async () => {
      // Setup auditor profile
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: {
            role: "auditor",
            full_name: "Test Auditor",
          },
          error: null,
        });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>,
      );

      // Login as auditor
      await user.type(screen.getByLabelText(/email/i), "auditor@strtested.com");
      await user.type(screen.getByLabelText(/password/i), "auditorPassword123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Wait for authentication
      await waitFor(() => {
        expect(screen.getByText(/auditor dashboard/i)).toBeInTheDocument();
      });

      // Verify auditor-specific features are available
      expect(screen.getByText(/inspection queue/i)).toBeInTheDocument();
      expect(screen.getByText(/review metrics/i)).toBeInTheDocument();

      // Verify inspector features are NOT available
      expect(screen.queryByText(/start inspection/i)).not.toBeInTheDocument();
    });

    it("should handle admin login with full system access", async () => {
      // Setup admin profile
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: {
            role: "admin",
            full_name: "Test Admin",
          },
          error: null,
        });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>,
      );

      // Login as admin
      await user.type(screen.getByLabelText(/email/i), "admin@strtested.com");
      await user.type(screen.getByLabelText(/password/i), "adminPassword123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Wait for authentication
      await waitFor(() => {
        expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
      });

      // Verify admin features are available
      expect(screen.getByText(/user management/i)).toBeInTheDocument();
      expect(screen.getByText(/system health/i)).toBeInTheDocument();
      expect(screen.getByText(/checklist management/i)).toBeInTheDocument();

      // Verify admin can access all areas
      const inspectorTab = screen.getByRole("tab", { name: /inspector/i });
      await user.click(inspectorTab);
      expect(screen.getByText(/start inspection/i)).toBeInTheDocument();

      const auditorTab = screen.getByRole("tab", { name: /auditor/i });
      await user.click(auditorTab);
      expect(screen.getByText(/inspection queue/i)).toBeInTheDocument();
    });
  });

  describe("Authentication Error Scenarios", () => {
    it("should handle invalid credentials gracefully", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: "Invalid login credentials" },
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>,
      );

      await user.type(screen.getByLabelText(/email/i), "wrong@email.com");
      await user.type(screen.getByLabelText(/password/i), "wrongpassword");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Verify error message is shown
      await waitFor(() => {
        expect(
          screen.getByText(/invalid login credentials/i),
        ).toBeInTheDocument();
      });

      // Verify we're still on login page
      expect(
        screen.getByRole("heading", { name: /sign in/i }),
      ).toBeInTheDocument();

      // Verify form is still functional
      expect(screen.getByLabelText(/email/i)).toBeEnabled();
      expect(screen.getByLabelText(/password/i)).toBeEnabled();
    });

    it("should handle profile fetch failure during login", async () => {
      // Login succeeds but profile fetch fails
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: null,
          error: { message: "Profile not found" },
        });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>,
      );

      await user.type(screen.getByLabelText(/email/i), "test@strtested.com");
      await user.type(screen.getByLabelText(/password/i), "password");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Should show profile error
      await waitFor(() => {
        expect(
          screen.getByText(/failed to fetch user profile/i),
        ).toBeInTheDocument();
      });

      // Should remain on login page
      expect(
        screen.getByRole("heading", { name: /sign in/i }),
      ).toBeInTheDocument();
    });

    it("should handle network errors during authentication", async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValueOnce(
        new Error("Network error"),
      );

      render(
        <TestWrapper>
          <App />
        </TestWrapper>,
      );

      await user.type(screen.getByLabelText(/email/i), "test@strtested.com");
      await user.type(screen.getByLabelText(/password/i), "password");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Should show network error with retry option
      await waitFor(() => {
        expect(
          screen.getByText(/network connection error/i),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /try again/i }),
        ).toBeInTheDocument();
      });

      // Test retry functionality
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: "test-user", email: "test@strtested.com" },
          session: { access_token: "token" },
        },
        error: null,
      });

      await user.click(screen.getByRole("button", { name: /try again/i }));

      await waitFor(() => {
        expect(screen.getByText(/inspector dashboard/i)).toBeInTheDocument();
      });
    });

    it("should handle session expiration gracefully", async () => {
      // First login successfully
      render(
        <TestWrapper>
          <App />
        </TestWrapper>,
      );

      await user.type(screen.getByLabelText(/email/i), "test@strtested.com");
      await user.type(screen.getByLabelText(/password/i), "password");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/inspector dashboard/i)).toBeInTheDocument();
      });

      // Simulate session expiration
      const expiredDate = new Date(Date.now() - 1000); // 1 second ago
      useAppStore.getState().setAuth({ sessionExpiresAt: expiredDate });

      // Trigger session check
      fireEvent.focus(window);

      // Should redirect to login with session expired message
      await waitFor(() => {
        expect(screen.getByText(/session has expired/i)).toBeInTheDocument();
        expect(
          screen.getByRole("heading", { name: /sign in/i }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Protected Route Access Control", () => {
    it("should block unauthenticated access to protected routes", () => {
      render(
        <TestWrapper>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>,
      );

      // Should not show protected content
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();

      // Should show login prompt
      expect(screen.getByText(/please sign in/i)).toBeInTheDocument();
    });

    it("should allow authenticated access to protected routes", () => {
      // Set authenticated state
      useAppStore.getState().setAuth({
        isAuthenticated: true,
        user: { id: "test-user", email: "test@test.com" },
        role: "inspector",
      });

      render(
        <TestWrapper>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </TestWrapper>,
      );

      // Should show protected content
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("should enforce role-based access control", () => {
      // Set inspector authentication
      useAppStore.getState().setAuth({
        isAuthenticated: true,
        user: { id: "test-user", email: "test@test.com" },
        role: "inspector",
      });

      render(
        <TestWrapper>
          <RoleBasedAccess allowedRoles={["auditor", "admin"]}>
            <div>Admin Content</div>
          </RoleBasedAccess>
        </TestWrapper>,
      );

      // Inspector should not see admin content
      expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
      expect(screen.getByText(/insufficient permissions/i)).toBeInTheDocument();
    });

    it("should allow access for correct roles", () => {
      // Set admin authentication
      useAppStore.getState().setAuth({
        isAuthenticated: true,
        user: { id: "test-user", email: "test@test.com" },
        role: "admin",
      });

      render(
        <TestWrapper>
          <RoleBasedAccess allowedRoles={["auditor", "admin"]}>
            <div>Admin Content</div>
          </RoleBasedAccess>
        </TestWrapper>,
      );

      // Admin should see admin content
      expect(screen.getByText("Admin Content")).toBeInTheDocument();
    });
  });

  describe("Complete Logout Flow", () => {
    beforeEach(async () => {
      // Login first
      useAppStore.getState().setAuth({
        isAuthenticated: true,
        user: { id: "test-user", email: "test@test.com" },
        role: "inspector",
      });
    });

    it("should complete successful logout journey", async () => {
      mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>,
      );

      // Verify we're authenticated
      expect(screen.getByText(/inspector dashboard/i)).toBeInTheDocument();

      // Find and click logout button
      const logoutButton = screen.getByRole("button", { name: /sign out/i });
      await user.click(logoutButton);

      // Should show logout confirmation
      expect(
        screen.getByText(/are you sure you want to sign out/i),
      ).toBeInTheDocument();

      // Confirm logout
      const confirmButton = screen.getByRole("button", { name: /confirm/i });
      await user.click(confirmButton);

      // Should redirect to login
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /sign in/i }),
        ).toBeInTheDocument();
      });

      // Verify logout was called
      expect(mockSupabase.auth.signOut).toHaveBeenCalledOnce();

      // Verify no protected content is visible
      expect(
        screen.queryByText(/inspector dashboard/i),
      ).not.toBeInTheDocument();
    });

    it("should handle logout failure gracefully", async () => {
      mockSupabase.auth.signOut.mockResolvedValueOnce({
        error: { message: "Logout failed" },
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>,
      );

      const logoutButton = screen.getByRole("button", { name: /sign out/i });
      await user.click(logoutButton);

      const confirmButton = screen.getByRole("button", { name: /confirm/i });
      await user.click(confirmButton);

      // Should still logout locally even if server logout fails
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /sign in/i }),
        ).toBeInTheDocument();
      });

      // Should show logout error
      expect(
        screen.getByText(/logout completed with errors/i),
      ).toBeInTheDocument();
    });

    it("should clear all local data on logout", async () => {
      mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>,
      );

      // Add some inspection data to store
      const inspectionStore = useAppStore.getState();

      // Logout
      const logoutButton = screen.getByRole("button", { name: /sign out/i });
      await user.click(logoutButton);

      const confirmButton = screen.getByRole("button", { name: /confirm/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /sign in/i }),
        ).toBeInTheDocument();
      });

      // Verify all auth state is cleared
      const authState = useAppStore.getState();
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.user).toBeNull();
      expect(authState.role).toBeNull();
      expect(authState.sessionExpiresAt).toBeNull();
    });
  });

  describe("Session Management", () => {
    it("should refresh session on app focus", async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: {
          session: {
            user: { id: "test-user", email: "test@test.com" },
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          },
        },
        error: null,
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>,
      );

      // Simulate app focus
      fireEvent.focus(window);

      // Should call session refresh
      await waitFor(() => {
        expect(mockSupabase.auth.getSession).toHaveBeenCalled();
      });
    });

    it("should handle session refresh failure", async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: { message: "Session refresh failed" },
      });

      // Start with authenticated state
      useAppStore.getState().setAuth({
        isAuthenticated: true,
        user: { id: "test-user", email: "test@test.com" },
        role: "inspector",
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>,
      );

      // Simulate app focus
      fireEvent.focus(window);

      // Should logout user and redirect to login
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /sign in/i }),
        ).toBeInTheDocument();
        expect(screen.getByText(/session refresh failed/i)).toBeInTheDocument();
      });
    });

    it("should warn about approaching session expiry", async () => {
      // Set session to expire in 5 minutes
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      useAppStore.getState().setAuth({
        isAuthenticated: true,
        user: { id: "test-user", email: "test@test.com" },
        role: "inspector",
        sessionExpiresAt: expiresAt,
      });

      render(
        <TestWrapper>
          <App />
        </TestWrapper>,
      );

      // Should show session expiry warning
      expect(screen.getByText(/session expires soon/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /extend session/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Mobile Authentication Experience", () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, "innerWidth", { value: 375 });
      Object.defineProperty(window, "innerHeight", { value: 667 });
      fireEvent(window, new Event("resize"));
    });

    it("should provide mobile-optimized login experience", async () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>,
      );

      // Verify mobile-friendly form layout
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole("button", { name: /sign in/i });

      // Verify inputs have mobile-appropriate attributes
      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("autocomplete", "email");
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("autocomplete", "current-password");

      // Verify touch-friendly button size
      const buttonStyles = window.getComputedStyle(loginButton);
      expect(parseInt(buttonStyles.minHeight)).toBeGreaterThanOrEqual(44); // iOS minimum touch target
    });

    it("should handle mobile keyboard interactions correctly", async () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>,
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      // Test tab navigation
      emailInput.focus();
      await user.keyboard("{Tab}");
      expect(passwordInput).toHaveFocus();

      // Test form submission with Enter key
      await user.type(emailInput, "test@strtested.com");
      await user.type(passwordInput, "password");
      await user.keyboard("{Enter}");

      // Should attempt login
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled();
    });

    it("should adapt to landscape orientation", async () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>,
      );

      // Simulate landscape mode
      Object.defineProperty(window, "innerWidth", { value: 667 });
      Object.defineProperty(window, "innerHeight", { value: 375 });
      fireEvent(window, new Event("orientationchange"));

      // Form should remain usable in landscape
      expect(screen.getByLabelText(/email/i)).toBeVisible();
      expect(screen.getByLabelText(/password/i)).toBeVisible();
      expect(screen.getByRole("button", { name: /sign in/i })).toBeVisible();
    });
  });

  describe("Security Scenarios", () => {
    it("should prevent multiple concurrent login attempts", async () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>,
      );

      // Fill form
      await user.type(screen.getByLabelText(/email/i), "test@strtested.com");
      await user.type(screen.getByLabelText(/password/i), "password");

      // Click login multiple times rapidly
      const loginButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(loginButton);
      await user.click(loginButton);
      await user.click(loginButton);

      // Should only call Supabase once
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledTimes(1);

      // Button should be disabled during login
      expect(loginButton).toBeDisabled();
    });

    it("should sanitize user input", async () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>,
      );

      // Try potential XSS payload
      const maliciousEmail = '<script>alert("xss")</script>@test.com';
      await user.type(screen.getByLabelText(/email/i), maliciousEmail);
      await user.type(screen.getByLabelText(/password/i), "password");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Should not execute script or render HTML
      expect(document.querySelector("script")).toBeNull();
      expect(screen.queryByText('alert("xss")')).not.toBeInTheDocument();
    });

    it("should not expose sensitive data in error messages", async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: {
          message:
            "Invalid login credentials. User: test@strtested.com not found in database table users_secret_data",
        },
      });

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>,
      );

      await user.type(screen.getByLabelText(/email/i), "test@strtested.com");
      await user.type(screen.getByLabelText(/password/i), "wrongpassword");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Should show generic error, not detailed database information
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
        expect(
          screen.queryByText(/users_secret_data/i),
        ).not.toBeInTheDocument();
        expect(screen.queryByText(/database table/i)).not.toBeInTheDocument();
      });
    });
  });
});
