import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { InspectorWorkflow } from "../pages/InspectorWorkflow";

// Mock the services
vi.mock("@/services/inspectionService", () => ({
  inspectionService: {
    createInspection: vi.fn().mockResolvedValue({
      success: true,
      data: { id: "test-inspection-123" },
    }),
    getInspectionById: vi.fn().mockResolvedValue({
      success: true,
      data: { id: "test-inspection-123", status: "in_progress" },
    }),
    updateInspectionProgress: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock("@/services/offlineStorageService", () => ({
  offlineStorageService: {
    storeInspectionOffline: vi.fn().mockResolvedValue(true),
    storeMediaOffline: vi.fn().mockResolvedValue("media-123"),
  },
}));

vi.mock("@/services/syncService", () => ({
  syncService: {
    addSyncListener: vi.fn(),
    addStatusListener: vi.fn(),
    removeSyncListener: vi.fn(),
    removeStatusListener: vi.fn(),
    queueInspectionSync: vi.fn(),
    queueMediaUpload: vi.fn(),
    triggerSync: vi.fn(),
  },
}));

vi.mock("@/hooks/useErrorHandling", () => ({
  useErrorHandling: () => ({
    error: { isError: false, error: null },
    handleError: vi.fn(),
    clearError: vi.fn(),
    withErrorHandling: vi.fn((fn) => fn()),
  }),
}));

vi.mock("@/hooks/usePerformanceMonitoring", () => ({
  usePerformanceMonitoring: () => ({
    startTracking: vi.fn(() => vi.fn()),
    trackEvent: vi.fn(),
  }),
}));

vi.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: "test-user-123", email: "test@example.com" },
  }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: {
            id: "test-property-123",
            name: "Test Property",
            address: "123 Test St",
            type: "apartment",
          },
          error: null,
        }),
      }),
      insert: vi.fn().mockResolvedValue({
        data: { id: "test-inspection-123" },
        error: null,
      }),
      update: vi.fn().mockResolvedValue({
        data: { id: "test-inspection-123" },
        error: null,
      }),
    })),
  },
  uploadMedia: vi.fn().mockResolvedValue({
    url: "https://test.com/media/test.jpg",
    error: null,
  }),
}));

// Mock components
vi.mock("@/components/scrapers/PropertySelector", () => ({
  PropertySelector: ({ onPropertySelected }: any) => (
    <div data-testid="property-selector">
      <button
        onClick={() =>
          onPropertySelected({
            id: "test-property-123",
            address: "123 Test St",
            type: "apartment",
            bedrooms: 2,
            bathrooms: 1,
            sqft: 1000,
          })
        }
      >
        Select Property
      </button>
    </div>
  ),
}));

vi.mock("@/components/ai/ChecklistGenerator", () => ({
  ChecklistGenerator: ({ onChecklistGenerated }: any) => (
    <div data-testid="checklist-generator">
      <button
        onClick={() =>
          onChecklistGenerated({
            items: [
              {
                id: "item-1",
                title: "Check Kitchen Sink",
                description: "Test kitchen sink functionality",
                category: "kitchen",
                required: true,
              },
            ],
            estimatedTime: 30,
            totalItems: 1,
          })
        }
      >
        Generate Checklist
      </button>
    </div>
  ),
}));

vi.mock("@/components/photo/PhotoGuidance", () => ({
  PhotoGuidance: ({ onAllPhotosComplete }: any) => (
    <div data-testid="photo-guidance">
      <button onClick={onAllPhotosComplete}>Complete Photos</button>
    </div>
  ),
}));

vi.mock("@/components/video/VideoRecorder", () => ({
  VideoRecorder: ({ onStopRecording }: any) => (
    <div data-testid="video-recorder">
      <button onClick={onStopRecording}>Stop Recording</button>
    </div>
  ),
}));

vi.mock("@/components/mobile/OfflineSync", () => ({
  OfflineSync: ({ onSyncComplete }: any) => (
    <div data-testid="offline-sync">
      <button onClick={onSyncComplete}>Complete Sync</button>
    </div>
  ),
}));

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

describe("InspectorWorkflow Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock navigator.onLine
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });
  });

  it("should render the workflow with initial property selection step", async () => {
    render(
      <TestWrapper>
        <InspectorWorkflow />
      </TestWrapper>,
    );

    // Check that the property selection step is active
    expect(
      screen.getByText("Select Property for Inspection"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("property-selector")).toBeInTheDocument();
  });

  it("should progress through the complete workflow", async () => {
    render(
      <TestWrapper>
        <InspectorWorkflow />
      </TestWrapper>,
    );

    // Step 1: Select property
    const selectPropertyButton = screen.getByText("Select Property");
    fireEvent.click(selectPropertyButton);

    // Wait for checklist generation step
    await waitFor(() => {
      expect(
        screen.getByText("AI-Generated Inspection Checklist"),
      ).toBeInTheDocument();
    });

    // Step 2: Generate checklist
    const generateChecklistButton = screen.getByText("Generate Checklist");
    fireEvent.click(generateChecklistButton);

    // Wait for photo capture step
    await waitFor(() => {
      expect(screen.getByText("Photo Documentation")).toBeInTheDocument();
    });

    // Step 3: Complete photos
    const completePhotosButton = screen.getByText("Complete Photos");
    fireEvent.click(completePhotosButton);

    // Wait for video recording step
    await waitFor(() => {
      expect(screen.getByText("Video Walkthrough")).toBeInTheDocument();
    });

    // Step 4: Complete video recording
    const stopRecordingButton = screen.getByText("Stop Recording");
    fireEvent.click(stopRecordingButton);

    // Wait for sync step
    await waitFor(() => {
      expect(screen.getByText("Upload & Sync Data")).toBeInTheDocument();
    });

    // Step 5: Complete sync
    const completeSyncButton = screen.getByText("Complete Sync");
    fireEvent.click(completeSyncButton);

    // Verify workflow completion
    await waitFor(() => {
      expect(screen.getByText("Complete Inspection")).toBeInTheDocument();
    });
  });

  it("should handle offline mode gracefully", async () => {
    // Simulate offline mode
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });

    render(
      <TestWrapper>
        <InspectorWorkflow />
      </TestWrapper>,
    );

    // Check that offline indicator is shown
    expect(screen.getByText("Working Offline")).toBeInTheDocument();
    expect(
      screen.getByText(/data is being saved locally/i),
    ).toBeInTheDocument();
  });

  it("should track progress correctly", async () => {
    render(
      <TestWrapper>
        <InspectorWorkflow />
      </TestWrapper>,
    );

    // Initial progress should be 0%
    expect(screen.getByText("0%")).toBeInTheDocument();

    // Complete property selection
    const selectPropertyButton = screen.getByText("Select Property");
    fireEvent.click(selectPropertyButton);

    // Progress should increase after completing a step
    await waitFor(() => {
      expect(screen.getByText("20%")).toBeInTheDocument();
    });
  });

  it("should display step validation correctly", async () => {
    render(
      <TestWrapper>
        <InspectorWorkflow />
      </TestWrapper>,
    );

    // Next step button should be disabled initially
    const nextButton = screen.getByText("Next Step");
    expect(nextButton).toBeDisabled();

    // Complete property selection
    const selectPropertyButton = screen.getByText("Select Property");
    fireEvent.click(selectPropertyButton);

    // Next step button should be enabled after completing required step
    await waitFor(() => {
      expect(nextButton).not.toBeDisabled();
    });
  });

  it("should handle errors gracefully", async () => {
    const mockError = new Error("Test error");
    const mockHandleError = vi.fn();

    vi.mock("@/hooks/useErrorHandling", () => ({
      useErrorHandling: () => ({
        error: { isError: true, error: mockError },
        handleError: mockHandleError,
        clearError: vi.fn(),
        withErrorHandling: vi.fn((fn) => {
          try {
            return fn();
          } catch (error) {
            mockHandleError(error);
            throw error;
          }
        }),
      }),
    }));

    render(
      <TestWrapper>
        <InspectorWorkflow />
      </TestWrapper>,
    );

    // Error should be displayed
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });
});

describe("Inspection Workflow Service Integration", () => {
  it("should call inspection service when creating inspection", async () => {
    const { inspectionService } = await import("@/services/inspectionService");

    render(
      <TestWrapper>
        <InspectorWorkflow />
      </TestWrapper>,
    );

    // Complete property selection and checklist generation
    fireEvent.click(screen.getByText("Select Property"));

    await waitFor(() => {
      fireEvent.click(screen.getByText("Generate Checklist"));
    });

    // Verify inspection service was called
    await waitFor(() => {
      expect(inspectionService.createInspection).toHaveBeenCalledWith({
        propertyId: "test-property-123",
        inspectorId: "test-user-123",
        checklistItems: expect.arrayContaining([
          expect.objectContaining({
            title: "Check Kitchen Sink",
            description: "Test kitchen sink functionality",
            category: "kitchen",
            required: true,
          }),
        ]),
      });
    });
  });
});
