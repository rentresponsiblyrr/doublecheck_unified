/**
 * PropertySelector Component Accessibility Tests
 * Comprehensive WCAG 2.1 AA testing for property selection interface
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropertySelector } from "@/components/scrapers/PropertySelector";
import {
  testComponentAccessibility,
  testErrorStateAccessibility,
} from "./axe-setup";

// Mock AuthProvider
const mockAuthProvider = {
  user: { id: "test-user-id", email: "test@example.com" },
  loading: false,
  error: null,
};

vi.mock("@/components/AuthProvider", () => ({
  useAuth: () => mockAuthProvider,
}));

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({
      data: [
        {
          property_id: "1",
          property_name: "Test Property",
          property_address: "123 Test St",
          property_vrbo_url: "https://vrbo.com/test",
          property_airbnb_url: null,
          inspection_count: 2,
          completed_inspection_count: 1,
          active_inspection_count: 1,
        },
      ],
      error: null,
    }),
  },
}));

const mockProps = {
  onPropertySelected: vi.fn(),
  selectedProperty: null,
  isLoading: false,
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("PropertySelector Accessibility Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("WCAG 2.1 AA Compliance", () => {
    it("should have no accessibility violations in default state", async () => {
      const { container } = render(
        <TestWrapper>
          <PropertySelector {...mockProps} />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Test Property")).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper landmark structure", async () => {
      render(
        <TestWrapper>
          <PropertySelector {...mockProps} />
        </TestWrapper>,
      );

      // Check for main landmark
      const main = screen.getByRole("main");
      expect(main).toBeInTheDocument();
      expect(main).toHaveAttribute("aria-labelledby");

      // Check for region landmarks
      const regions = screen.getAllByRole("region");
      expect(regions.length).toBeGreaterThan(0);
      regions.forEach((region) => {
        expect(region).toHaveAttribute("aria-labelledby");
      });
    });

    it("should have accessible search functionality", async () => {
      render(
        <TestWrapper>
          <PropertySelector {...mockProps} />
        </TestWrapper>,
      );

      const searchBox = screen.getByRole("searchbox");
      expect(searchBox).toHaveAttribute("aria-describedby");
      expect(searchBox).toHaveAttribute("type", "search");
      expect(searchBox).toHaveAttribute("aria-expanded");

      // Check search help text
      const helpText = screen.getByText(/search will filter properties/i);
      expect(helpText).toHaveClass("sr-only");
    });

    it("should have accessible form with proper labels", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PropertySelector {...mockProps} />
        </TestWrapper>,
      );

      // Open add property form
      const addButton = screen.getByRole("button", {
        name: /open add property form/i,
      });
      await user.click(addButton);

      // Check form accessibility
      const form = screen.getByRole("region", { name: /add new property/i });
      expect(form).toHaveAttribute("aria-live", "polite");

      const urlInput = screen.getByLabelText(/property listing url/i);
      expect(urlInput).toHaveAttribute("aria-required", "true");
      expect(urlInput).toHaveAttribute("aria-describedby");
      expect(urlInput).toHaveAttribute("type", "url");
    });
  });

  describe("Keyboard Navigation", () => {
    it("should support keyboard navigation through all interactive elements", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PropertySelector {...mockProps} />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Test Property")).toBeInTheDocument();
      });

      // Test tab navigation
      const searchBox = screen.getByRole("searchbox");
      const addButton = screen.getByRole("button", { name: /add property/i });
      const refreshButton = screen.getByRole("button", { name: /refresh/i });
      const propertyCard = screen.getByRole("button", {
        name: /select property/i,
      });

      await user.tab();
      expect(searchBox).toHaveFocus();

      await user.tab();
      expect(addButton).toHaveFocus();

      await user.tab();
      expect(refreshButton).toHaveFocus();

      await user.tab();
      expect(propertyCard).toHaveFocus();
    });

    it("should support Enter and Space key activation on property cards", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PropertySelector {...mockProps} />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Test Property")).toBeInTheDocument();
      });

      const propertyCard = screen.getByRole("button", {
        name: /select property/i,
      });

      // Test Enter key
      propertyCard.focus();
      await user.keyboard("{Enter}");
      expect(mockProps.onPropertySelected).toHaveBeenCalled();

      vi.clearAllMocks();

      // Test Space key
      propertyCard.focus();
      await user.keyboard(" ");
      expect(mockProps.onPropertySelected).toHaveBeenCalled();
    });

    it("should support keyboard form submission", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PropertySelector {...mockProps} />
        </TestWrapper>,
      );

      // Open form
      const addButton = screen.getByRole("button", { name: /add property/i });
      await user.click(addButton);

      // Fill form and submit with Enter
      const urlInput = screen.getByLabelText(/property listing url/i);
      await user.type(urlInput, "https://vrbo.com/test");
      await user.keyboard("{Enter}");

      expect(mockProps.onPropertySelected).toHaveBeenCalled();
    });
  });

  describe("Screen Reader Support", () => {
    it("should announce search results changes", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PropertySelector {...mockProps} />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Test Property")).toBeInTheDocument();
      });

      const searchBox = screen.getByRole("searchbox");
      await user.type(searchBox, "Test");

      // Check for search results announcements
      await waitFor(
        () => {
          const announcements = document.querySelectorAll(
            '[aria-live="polite"]',
          );
          expect(announcements.length).toBeGreaterThan(0);
        },
        { timeout: 500 },
      );
    });

    it("should announce property selection", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PropertySelector {...mockProps} />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Test Property")).toBeInTheDocument();
      });

      const propertyCard = screen.getByRole("button", {
        name: /select property/i,
      });
      await user.click(propertyCard);

      // Check for selection announcements
      await waitFor(() => {
        const announcements = document.querySelectorAll(
          '[aria-live="assertive"]',
        );
        expect(announcements.length).toBeGreaterThan(0);
      });
    });

    it("should announce form state changes", async () => {
      const user = userEvent.setup();
      render(
        <TestWrapper>
          <PropertySelector {...mockProps} />
        </TestWrapper>,
      );

      const addButton = screen.getByRole("button", {
        name: /open add property form/i,
      });
      await user.click(addButton);

      // Check for form open announcement
      await waitFor(() => {
        const announcements = document.querySelectorAll('[aria-live="polite"]');
        expect(announcements.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Error State Accessibility", () => {
    it("should handle loading errors accessibly", async () => {
      // Mock error state
      vi.mocked(supabase.rpc).mockRejectedValueOnce(new Error("Network error"));

      const { container } = render(
        <TestWrapper>
          <PropertySelector {...mockProps} />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-live", "assertive");

      const results = await testErrorStateAccessibility(container);
      expect(results).toHaveNoViolations();
    });

    it("should provide accessible error recovery options", async () => {
      // Mock error state
      vi.mocked(supabase.rpc).mockRejectedValueOnce(new Error("Network error"));

      render(
        <TestWrapper>
          <PropertySelector {...mockProps} />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      // Check error recovery buttons
      const retryButton = screen.getByRole("button", {
        name: /retry loading properties/i,
      });
      const addButton = screen.getByRole("button", {
        name: /add new property instead/i,
      });

      expect(retryButton).toHaveAttribute("aria-label");
      expect(addButton).toHaveAttribute("aria-label");

      // Both should have proper focus indicators
      expect(retryButton).toHaveClass("focus:ring-2");
      expect(addButton).toHaveClass("focus:ring-2");
    });
  });

  describe("Touch Accessibility", () => {
    it("should have minimum 44px touch targets", async () => {
      render(
        <TestWrapper>
          <PropertySelector {...mockProps} />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Test Property")).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        const styles = window.getComputedStyle(button);
        const height = parseInt(styles.height);
        expect(height).toBeGreaterThanOrEqual(44);
      });
    });

    it("should have touch-manipulation class for mobile optimization", async () => {
      render(
        <TestWrapper>
          <PropertySelector {...mockProps} />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Test Property")).toBeInTheDocument();
      });

      const interactiveElements = [
        screen.getByRole("searchbox"),
        ...screen.getAllByRole("button"),
      ];

      interactiveElements.forEach((element) => {
        expect(element).toHaveClass("touch-manipulation");
      });
    });
  });

  describe("Loading State Accessibility", () => {
    it("should have accessible loading indicators", () => {
      render(
        <TestWrapper>
          <PropertySelector {...mockProps} isLoading={true} />
        </TestWrapper>,
      );

      const loadingRegion = screen.getByRole("status", {
        name: /loading properties/i,
      });
      expect(loadingRegion).toHaveAttribute("aria-live", "polite");

      const loadingText = screen.getByText(/loading properties, please wait/i);
      expect(loadingText).toHaveClass("sr-only");
    });

    it("should hide loading skeletons from screen readers", () => {
      render(
        <TestWrapper>
          <PropertySelector {...mockProps} isLoading={true} />
        </TestWrapper>,
      );

      const skeletons = screen.getAllByTestId(/skeleton/i);
      skeletons.forEach((skeleton) => {
        expect(skeleton.closest('[aria-hidden="true"]')).toBeInTheDocument();
      });
    });
  });
});
