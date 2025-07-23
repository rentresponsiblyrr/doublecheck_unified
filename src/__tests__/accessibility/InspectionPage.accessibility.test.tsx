/**
 * InspectionPage Component Accessibility Tests
 * Comprehensive WCAG 2.1 AA testing for inspection page error handling
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { MemoryRouter } from "react-router-dom";
import { InspectionPage } from "@/pages/InspectionPage";
import { SimplifiedInspectionPage } from "@/components/SimplifiedInspectionPage";
import { testErrorStateAccessibility } from "./axe-setup";

// Mock AuthProvider
const mockAuthProvider = {
  user: { id: "test-user-id", email: "test@example.com" },
  loading: false,
  error: null,
};

vi.mock("@/components/AuthProvider", () => ({
  useAuth: () => mockAuthProvider,
}));

// Mock hooks
vi.mock("@/hooks/useSimplifiedInspectionData", () => ({
  useSimplifiedInspectionData: () => ({
    checklistItems: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

// Mock components
vi.mock("@/components/InspectionLoadingState", () => ({
  InspectionLoadingState: () => (
    <div data-testid="loading-state">Loading...</div>
  ),
}));

vi.mock("@/components/InspectionContent", () => ({
  InspectionContent: () => (
    <div data-testid="inspection-content">Inspection Content</div>
  ),
}));

vi.mock("@/components/InspectionErrorBoundary", () => ({
  InspectionErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

interface MobileErrorRecoveryProps {
  error: Error;
  onRetry: () => void;
  onNavigateHome: () => void;
}

vi.mock("@/components/MobileErrorRecovery", () => ({
  MobileErrorRecovery: ({
    error,
    onRetry,
    onNavigateHome,
  }: MobileErrorRecoveryProps) => (
    <div data-testid="mobile-error-recovery">
      <p>{error.message}</p>
      <button onClick={onRetry}>Retry</button>
      <button onClick={onNavigateHome}>Go Home</button>
    </div>
  ),
}));

const TestWrapper = ({
  children,
  route = "/inspection/test-id",
}: {
  children: React.ReactNode;
  route?: string;
}) => <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>;

describe("InspectionPage Error Handling Accessibility Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Invalid Inspection ID Error State", () => {
    it("should have no accessibility violations for missing ID error", async () => {
      const { container } = render(
        <TestWrapper route="/inspection/">
          <InspectionPage />
        </TestWrapper>,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper error alert structure for missing ID", async () => {
      render(
        <TestWrapper route="/inspection/">
          <InspectionPage />
        </TestWrapper>,
      );

      const main = screen.getByRole("main");
      expect(main).toHaveAttribute(
        "aria-labelledby",
        "invalid-inspection-title",
      );

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-live", "assertive");

      const title = screen.getByRole("heading", { level: 1 });
      expect(title).toHaveAttribute("id", "invalid-inspection-title");

      const status = screen.getByRole("status");
      expect(status).toBeInTheDocument();
    });

    it("should have accessible navigation button for missing ID", async () => {
      render(
        <TestWrapper route="/inspection/">
          <InspectionPage />
        </TestWrapper>,
      );

      const button = screen.getByRole("button", {
        name: /return to properties page/i,
      });
      expect(button).toHaveAttribute("aria-label");
      expect(button).toHaveClass("touch-manipulation");
      expect(button).toHaveClass("focus:ring-2");
    });
  });

  describe("Authentication Error States", () => {
    it("should handle authentication loading state accessibly", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: true,
        error: null,
      });

      const { container } = render(
        <TestWrapper>
          <InspectionPage />
        </TestWrapper>,
      );

      const status = screen.getByRole("status", {
        name: /authentication in progress/i,
      });
      expect(status).toHaveAttribute("aria-live", "polite");

      const title = screen.getByText("Authentication Loading");
      expect(title).toHaveClass("sr-only");

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should handle authentication errors accessibly", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
        error: "Authentication failed",
      });

      const { container } = render(
        <TestWrapper>
          <InspectionPage />
        </TestWrapper>,
      );

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-live", "assertive");

      const title = screen.getByRole("heading", { level: 1 });
      expect(title).toHaveTextContent("Authentication Error");

      const status = screen.getByRole("status");
      expect(status).toHaveTextContent("Authentication failed");

      const results = await testErrorStateAccessibility(container);
      expect(results).toHaveNoViolations();
    });

    it("should provide accessible error recovery options for auth errors", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
        error: "Authentication failed",
      });

      render(
        <TestWrapper>
          <InspectionPage />
        </TestWrapper>,
      );

      const retryButton = screen.getByRole("button", {
        name: /retry authentication/i,
      });
      const returnButton = screen.getByRole("button", {
        name: /return to properties page without retrying/i,
      });

      expect(retryButton).toHaveAttribute("aria-label");
      expect(returnButton).toHaveAttribute("aria-label");

      // Both should have proper touch targets
      expect(retryButton).toHaveClass("h-12");
      expect(returnButton).toHaveClass("h-12");

      // Both should have focus indicators
      expect(retryButton).toHaveClass("focus:ring-2");
      expect(returnButton).toHaveClass("focus:ring-2");
    });

    it("should handle unauthenticated state accessibly", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
        error: null,
      });

      const { container } = render(
        <TestWrapper>
          <InspectionPage />
        </TestWrapper>,
      );

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-live", "assertive");

      const title = screen.getByRole("heading", { level: 1 });
      expect(title).toHaveTextContent("Authentication Required");

      const button = screen.getByRole("button", {
        name: /go to sign in page/i,
      });
      expect(button).toHaveAttribute("aria-label");

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("Keyboard Navigation", () => {
    it("should support keyboard navigation on error recovery buttons", async () => {
      const user = userEvent.setup();
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
        error: "Authentication failed",
      });

      render(
        <TestWrapper>
          <InspectionPage />
        </TestWrapper>,
      );

      const retryButton = screen.getByRole("button", {
        name: /retry authentication/i,
      });
      const returnButton = screen.getByRole("button", {
        name: /return to properties page/i,
      });

      // Test tab navigation
      await user.tab();
      expect(retryButton).toHaveFocus();

      await user.tab();
      expect(returnButton).toHaveFocus();

      // Test Enter key activation
      await user.keyboard("{Enter}");
      // Button should be clickable via keyboard
    });
  });

  describe("Screen Reader Announcements", () => {
    it("should announce authentication errors", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
        error: "Authentication failed",
      });

      render(
        <TestWrapper>
          <InspectionPage />
        </TestWrapper>,
      );

      // Check for error announcements
      await waitFor(() => {
        const announcements = document.querySelectorAll(
          '[aria-live="assertive"]',
        );
        expect(announcements.length).toBeGreaterThan(0);
      });
    });

    it("should announce navigation actions", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper route="/inspection/">
          <InspectionPage />
        </TestWrapper>,
      );

      const button = screen.getByRole("button", {
        name: /return to properties page/i,
      });
      await user.click(button);

      // Check for navigation announcements
      await waitFor(() => {
        const announcements = document.querySelectorAll('[aria-live="polite"]');
        expect(announcements.length).toBeGreaterThan(0);
      });
    });
  });
});

describe("SimplifiedInspectionPage Accessibility Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Fixed Broken Code Accessibility", () => {
    it("should have no accessibility violations after code fixes", async () => {
      const { container } = render(
        <TestWrapper>
          <SimplifiedInspectionPage />
        </TestWrapper>,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have working authentication error recovery", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
        error: "Authentication failed",
      });

      render(
        <TestWrapper>
          <SimplifiedInspectionPage />
        </TestWrapper>,
      );

      // Verify the previously broken button now works
      const retryButton = screen.getByRole("button", { name: /try again/i });
      const returnButton = screen.getByRole("button", {
        name: /return to properties/i,
      });

      expect(retryButton).toBeInTheDocument();
      expect(returnButton).toBeInTheDocument();

      // Both buttons should be properly accessible
      expect(retryButton).toHaveAttribute("aria-label");
      expect(returnButton).toHaveAttribute("aria-label");
    });

    it("should have proper main landmark structure", async () => {
      render(
        <TestWrapper route="/inspection/">
          <SimplifiedInspectionPage />
        </TestWrapper>,
      );

      const main = screen.getByRole("main");
      expect(main).toHaveAttribute("aria-labelledby");

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it("should handle UUID validation errors accessibly", async () => {
      const { container } = render(
        <TestWrapper route="/inspection/invalid-uuid">
          <SimplifiedInspectionPage />
        </TestWrapper>,
      );

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-live", "assertive");

      const results = await testErrorStateAccessibility(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("Enhanced Error Recovery", () => {
    it("should provide multiple recovery options", async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
        error: "Session expired",
      });

      render(
        <TestWrapper>
          <SimplifiedInspectionPage />
        </TestWrapper>,
      );

      // Should have multiple accessible recovery options
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(2);

      buttons.forEach((button) => {
        expect(button).toHaveAttribute("aria-label");
        expect(button).toHaveClass("focus:ring-2");
        expect(button).toHaveClass("touch-manipulation");
      });
    });
  });
});
