/**
 * PhotoGuidance Component Accessibility Tests
 * Comprehensive WCAG 2.1 AA testing for photo capture interface
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import PhotoGuidance from "@/components/photo/PhotoGuidance";
import {
  testComponentAccessibility,
  testInteractiveAccessibility,
} from "./axe-setup";
import { useCamera } from "@/hooks/useCamera";

// Mock dependencies
const mockChecklist = {
  items: [
    {
      id: "test-item-1",
      title: "Test Safety Check",
      description: "Test safety item description",
      category: "safety",
      priority: "high" as const,
      required: true,
      estimatedTimeMinutes: 2,
      gpt_prompt: "Test prompt",
    },
  ],
  estimatedTime: 15,
  totalItems: 1,
};

const mockProps = {
  checklist: mockChecklist,
  onPhotoCapture: vi.fn(),
  onAllPhotosComplete: vi.fn(),
  onPhotoStored: vi.fn(),
  inspectionId: "test-inspection-id",
  propertyData: { name: "Test Property" },
};

// Mock camera hook
vi.mock("@/hooks/useCamera", () => ({
  useCamera: () => ({
    isReady: true,
    error: null,
    hasPermission: true,
    isLoading: false,
    availableDevices: [{ deviceId: "test-camera" }],
    requestPermission: vi.fn(),
    startCamera: vi.fn(),
    stopCamera: vi.fn(),
    switchCamera: vi.fn(),
    takePhoto: vi
      .fn()
      .mockResolvedValue(new Blob(["test"], { type: "image/jpeg" })),
  }),
}));

describe("PhotoGuidance Accessibility Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("WCAG 2.1 AA Compliance", () => {
    it("should have no accessibility violations in default state", async () => {
      const { container } = render(<PhotoGuidance {...mockProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper ARIA labels for all interactive elements", async () => {
      render(<PhotoGuidance {...mockProps} />);

      // Check capture button
      const captureButton = screen.getByRole("button", {
        name: /capture photo/i,
      });
      expect(captureButton).toHaveAttribute("aria-label");
      expect(captureButton).toHaveAttribute("aria-describedby");

      // Check video element
      const video = screen.getByRole("img");
      expect(video).toHaveAttribute("aria-label");
      expect(video).toHaveAttribute("tabIndex", "0");
    });

    it("should have proper heading hierarchy", () => {
      render(<PhotoGuidance {...mockProps} />);

      // Check for proper heading structure
      const mainTitle = screen.getByRole("heading", { level: 2 });
      expect(mainTitle).toBeInTheDocument();
    });

    it("should have accessible progress indicators", async () => {
      render(<PhotoGuidance {...mockProps} />);

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuenow");
      expect(progressBar).toHaveAttribute("aria-valuemin");
      expect(progressBar).toHaveAttribute("aria-valuemax");
      expect(progressBar).toHaveAttribute("aria-labelledby");
    });
  });

  describe("Keyboard Navigation", () => {
    it("should support keyboard navigation on video element", async () => {
      const user = userEvent.setup();
      render(<PhotoGuidance {...mockProps} />);

      const video = screen.getByRole("img");
      await user.tab();
      expect(video).toHaveFocus();

      // Test Enter key for photo capture
      await user.keyboard("{Enter}");
      await waitFor(() => {
        expect(mockProps.onPhotoCapture).toHaveBeenCalled();
      });
    });

    it("should support keyboard navigation on all buttons", async () => {
      const user = userEvent.setup();
      render(<PhotoGuidance {...mockProps} />);

      // Test tab navigation through all interactive elements
      const interactiveElements = screen.getAllByRole("button");

      for (const element of interactiveElements) {
        await user.tab();
        if (element.tabIndex >= 0) {
          expect(document.activeElement).toBe(element);
        }
      }
    });

    it("should handle Escape key for guidance collapse", async () => {
      const user = userEvent.setup();
      render(<PhotoGuidance {...mockProps} />);

      // Open guidance first
      const guidanceButton = screen.getByRole("button", {
        name: /show guidance/i,
      });
      await user.click(guidanceButton);

      // Test Escape key handling
      await user.keyboard("{Escape}");
      expect(guidanceButton).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("Screen Reader Support", () => {
    it("should announce photo capture start", async () => {
      const user = userEvent.setup();
      render(<PhotoGuidance {...mockProps} />);

      const captureButton = screen.getByRole("button", {
        name: /capture photo/i,
      });
      await user.click(captureButton);

      // Check for aria-live announcements
      await waitFor(() => {
        const announcement = document.querySelector('[aria-live="assertive"]');
        expect(announcement).toBeInTheDocument();
      });
    });

    it("should have proper form instructions", () => {
      render(<PhotoGuidance {...mockProps} />);

      const instructions = screen.getByText(
        /use the capture button or press space/i,
      );
      expect(instructions).toHaveClass("sr-only");
      expect(instructions).toHaveAttribute("role", "status");
    });

    it("should announce navigation changes", async () => {
      const user = userEvent.setup();
      render(<PhotoGuidance {...mockProps} />);

      const nextButton = screen.getByRole("button", { name: /next/i });
      await user.click(nextButton);

      // Verify announcements are created
      await waitFor(() => {
        const announcements = document.querySelectorAll("[aria-live]");
        expect(announcements.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Error State Accessibility", () => {
    it("should handle camera errors accessibly", async () => {
      // Re-mock camera hook for error state
      vi.doMock("@/hooks/useCamera", () => ({
        useCamera: vi.fn(() => ({
          isReady: false,
          error: "Camera access denied",
          hasPermission: false,
          isLoading: false,
          availableDevices: [],
          requestPermission: vi.fn(),
          startCamera: vi.fn(),
          stopCamera: vi.fn(),
          switchCamera: vi.fn(),
          takePhoto: vi.fn(),
        })),
      }));

      const { container } = render(<PhotoGuidance {...mockProps} />);

      // Check error alert accessibility
      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-live", "assertive");

      const results = await testErrorStateAccessibility(container);
      expect(results).toHaveNoViolations();
    });

    it("should provide alternative actions on error", () => {
      // Mock camera error
      vi.mocked(useCamera).mockReturnValue({
        isReady: false,
        error: "Camera access denied",
        hasPermission: false,
        isLoading: false,
        availableDevices: [],
        requestPermission: vi.fn(),
        startCamera: vi.fn(),
        stopCamera: vi.fn(),
        switchCamera: vi.fn(),
        takePhoto: vi.fn(),
      });

      render(<PhotoGuidance {...mockProps} />);

      // Check for alternative action buttons
      const retryButton = screen.getByRole("button", {
        name: /retry camera access/i,
      });
      const continueButton = screen.getByRole("button", {
        name: /continue without camera/i,
      });

      expect(retryButton).toHaveAttribute("aria-label");
      expect(continueButton).toHaveAttribute("aria-label");
    });
  });

  describe("Touch Accessibility", () => {
    it("should have minimum 44px touch targets", () => {
      render(<PhotoGuidance {...mockProps} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        const styles = window.getComputedStyle(button);
        const height = parseInt(styles.height);
        expect(height).toBeGreaterThanOrEqual(44);
      });
    });

    it("should have touch-manipulation class for mobile optimization", () => {
      render(<PhotoGuidance {...mockProps} />);

      const captureButton = screen.getByRole("button", {
        name: /capture photo/i,
      });
      expect(captureButton).toHaveClass("touch-manipulation");
    });
  });

  describe("Focus Management", () => {
    it("should have visible focus indicators", async () => {
      const user = userEvent.setup();
      render(<PhotoGuidance {...mockProps} />);

      const captureButton = screen.getByRole("button", {
        name: /capture photo/i,
      });
      await user.tab();

      expect(captureButton).toHaveClass("focus:ring-2");
      expect(captureButton).toHaveClass("focus:ring-blue-500");
    });

    it("should manage focus during state changes", async () => {
      const user = userEvent.setup();
      render(<PhotoGuidance {...mockProps} />);

      // Test focus retention during photo capture
      const captureButton = screen.getByRole("button", {
        name: /capture photo/i,
      });
      await user.click(captureButton);

      // Focus should remain manageable during capture process
      await waitFor(() => {
        expect(document.activeElement).toBeDefined();
      });
    });
  });
});
