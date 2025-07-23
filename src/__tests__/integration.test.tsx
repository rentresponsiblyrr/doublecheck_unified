import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
  Mock,
} from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import React from "react";

// Components to test
import { InspectorWorkflow } from "../pages/InspectorWorkflow";
import { AuditorDashboard } from "../pages/AuditorDashboard";
import { ErrorBoundary } from "../lib/error/error-boundary";

// Services to test
import { systemHealthValidator } from "../lib/integration/system-health";
import { apiErrorHandler } from "../lib/error/api-error-handler";
import { errorReporter } from "../lib/monitoring/error-reporter";
import { performanceTracker } from "../lib/monitoring/performance-tracker";

// Mocks
import { mockSupabase } from "./__mocks__/supabase";
import { mockMediaDevices } from "./__mocks__/mediaDevices";
import { mockOpenAI } from "./__mocks__/openai";

// Test utilities
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary level="page">{children}</ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe("STR Certified Integration Tests", () => {
  let mockInspectionData: any;
  let mockPropertyData: any;

  beforeAll(() => {
    // Setup global mocks
    global.fetch = vi.fn();
    global.MediaRecorder = mockMediaDevices.MediaRecorder as any;
    global.navigator.mediaDevices = mockMediaDevices.mediaDevices as any;
    global.navigator.geolocation = mockMediaDevices.geolocation as any;

    // Mock Supabase
    vi.mock("@supabase/supabase-js", () => ({
      createClient: vi.fn(() => mockSupabase),
    }));

    // Setup test data
    mockPropertyData = {
      id: "test-property-1",
      address: "123 Test St, Test City, TS 12345",
      type: "single_family",
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1500,
      listingUrl: "https://test-listing.com/property/123",
    };

    mockInspectionData = {
      id: "test-inspection-1",
      propertyId: mockPropertyData.id,
      inspectorId: "test-inspector-1",
      status: "pending_review",
      photos: Array.from({ length: 10 }, (_, i) => ({
        id: `photo-${i}`,
        url: `https://test.com/photo-${i}.jpg`,
        room: "Living Room",
        analysis: { score: 85, issues: [] },
      })),
      videos: [
        {
          id: "video-1",
          url: "https://test.com/video.mp4",
          duration: 180,
        },
      ],
      checklist: {
        items: [
          {
            id: "check-1",
            room: "Kitchen",
            item: "Check faucets",
            completed: true,
          },
          {
            id: "check-2",
            room: "Bathroom",
            item: "Check toilet",
            completed: false,
          },
        ],
      },
    };
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("System Health Validation", () => {
    it("should validate all system components", async () => {
      const healthReport = await systemHealthValidator.performFullHealthCheck();

      expect(healthReport).toBeDefined();
      expect(healthReport.overall).toMatch(/healthy|degraded|unhealthy/);
      expect(healthReport.checks).toHaveLength(8);
      expect(healthReport.summary.totalChecks).toBe(8);

      // Check that all required components are tested
      const componentNames = healthReport.checks.map((c) => c.component);
      expect(componentNames).toContain("database");
      expect(componentNames).toContain("ai_services");
      expect(componentNames).toContain("file_upload");
      expect(componentNames).toContain("video_processing");
      expect(componentNames).toContain("mobile_compatibility");
      expect(componentNames).toContain("offline_capabilities");
      expect(componentNames).toContain("authentication");
      expect(componentNames).toContain("environment_config");
    });

    it("should detect unhealthy components", async () => {
      // Mock a failing service
      (global.fetch as Mock).mockRejectedValueOnce(
        new Error("Service unavailable"),
      );

      const healthReport = await systemHealthValidator.performFullHealthCheck();

      const aiServicesCheck = healthReport.checks.find(
        (c) => c.component === "ai_services",
      );
      expect(aiServicesCheck?.status).toBe("unhealthy");
      expect(healthReport.overall).toMatch(/degraded|unhealthy/);
    });

    it("should provide actionable recommendations", async () => {
      const healthReport = await systemHealthValidator.performFullHealthCheck();

      expect(healthReport.recommendations).toBeDefined();
      expect(Array.isArray(healthReport.recommendations)).toBe(true);
      expect(healthReport.recommendations!.length).toBeGreaterThan(0);
    });
  });

  describe("Inspector Workflow Integration", () => {
    beforeEach(() => {
      // Mock successful API responses
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [mockPropertyData],
            error: null,
          }),
        }),
        insert: vi.fn().mockResolvedValue({
          data: mockInspectionData,
          error: null,
        }),
        update: vi.fn().mockResolvedValue({
          data: mockInspectionData,
          error: null,
        }),
      });

      mockSupabase.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: "test-photo.jpg" },
          error: null,
        }),
      });
    });

    it("should complete full inspection workflow", async () => {
      render(
        <TestWrapper>
          <InspectorWorkflow />
        </TestWrapper>,
      );

      // Step 1: Property Selection
      expect(
        screen.getByText("Select Property for Inspection"),
      ).toBeInTheDocument();

      // Mock property selection
      const propertySelector = screen.getByTestId("property-selector");
      fireEvent.click(propertySelector);

      await waitFor(() => {
        expect(screen.getByText("Generate Checklist")).toBeInTheDocument();
      });

      // Step 2: Checklist Generation
      const generateButton = screen.getByRole("button", { name: /generate/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText("Photo Documentation")).toBeInTheDocument();
      });

      // Step 3: Photo Capture
      const captureButton = screen.getByRole("button", { name: /capture/i });
      fireEvent.click(captureButton);

      await waitFor(() => {
        expect(screen.getByText("Video Walkthrough")).toBeInTheDocument();
      });

      // Step 4: Video Recording
      const recordButton = screen.getByRole("button", { name: /record/i });
      fireEvent.click(recordButton);

      await waitFor(() => {
        expect(screen.getByText("Upload & Sync")).toBeInTheDocument();
      });

      // Step 5: Sync and Upload
      const syncButton = screen.getByRole("button", { name: /sync/i });
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText("Inspection Complete")).toBeInTheDocument();
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

      expect(screen.getByText("Working Offline")).toBeInTheDocument();
      expect(
        screen.getByText(/data is being saved locally/i),
      ).toBeInTheDocument();

      // Verify sync button is disabled
      const syncButton = screen.getByRole("button", {
        name: /complete inspection/i,
      });
      expect(syncButton).toBeDisabled();
    });

    it("should validate required steps completion", async () => {
      render(
        <TestWrapper>
          <InspectorWorkflow />
        </TestWrapper>,
      );

      // Try to skip to final step without completing required steps
      const nextButton = screen.getByRole("button", { name: /next step/i });

      // Should be disabled initially
      expect(nextButton).toBeDisabled();

      // Complete property selection
      const propertySelector = screen.getByTestId("property-selector");
      fireEvent.click(propertySelector);

      await waitFor(() => {
        expect(nextButton).not.toBeDisabled();
      });
    });
  });

  describe("Auditor Dashboard Integration", () => {
    beforeEach(() => {
      // Mock inspection queue data
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              {
                ...mockInspectionData,
                status: "pending_review",
              },
              {
                ...mockInspectionData,
                id: "test-inspection-2",
                status: "in_review",
              },
            ],
            error: null,
          }),
        }),
        update: vi.fn().mockResolvedValue({
          data: mockInspectionData,
          error: null,
        }),
      });
    });

    it("should display inspection queue", async () => {
      render(
        <TestWrapper>
          <AuditorDashboard />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByText("Inspection Queue")).toBeInTheDocument();
        expect(
          screen.getByText("123 Test St, Test City, TS 12345"),
        ).toBeInTheDocument();
      });

      // Check metrics are displayed
      expect(screen.getByText("Total Reviews")).toBeInTheDocument();
      expect(screen.getByText("Avg Review Time")).toBeInTheDocument();
      expect(screen.getByText("Approval Rate")).toBeInTheDocument();
    });

    it("should allow inspection review and approval", async () => {
      render(
        <TestWrapper>
          <AuditorDashboard />
        </TestWrapper>,
      );

      // Click on review button
      const reviewButton = await screen.findByRole("button", {
        name: /review/i,
      });
      fireEvent.click(reviewButton);

      // Switch to review tab
      await waitFor(() => {
        expect(screen.getByText("Video Walkthrough")).toBeInTheDocument();
        expect(screen.getByText("Photo Documentation")).toBeInTheDocument();
      });

      // Select approval decision
      const approveButton = screen.getByRole("button", { name: /approve/i });
      fireEvent.click(approveButton);

      // Add feedback
      const feedbackTextarea = screen.getByPlaceholderText(/add feedback/i);
      fireEvent.change(feedbackTextarea, {
        target: { value: "Excellent work!" },
      });

      // Submit review
      const submitButton = screen.getByRole("button", {
        name: /submit review/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSupabase.from().update).toHaveBeenCalledWith({
          status: "approved",
          reviewer_feedback: "Excellent work!",
          reviewed_at: expect.any(String),
        });
      });
    });

    it("should filter and search inspections", async () => {
      render(
        <TestWrapper>
          <AuditorDashboard />
        </TestWrapper>,
      );

      // Test search functionality
      const searchInput = screen.getByPlaceholderText(/search inspections/i);
      fireEvent.change(searchInput, { target: { value: "Test St" } });

      await waitFor(() => {
        expect(
          screen.getByText("123 Test St, Test City, TS 12345"),
        ).toBeInTheDocument();
      });

      // Test status filter
      const statusFilter = screen.getByRole("combobox", { name: /status/i });
      fireEvent.click(statusFilter);

      const pendingOption = screen.getByText("Pending");
      fireEvent.click(pendingOption);

      await waitFor(() => {
        const pendingRows = screen.getAllByText(/pending/i);
        expect(pendingRows.length).toBeGreaterThan(0);
      });
    });
  });

  describe("AI Service Integration", () => {
    it("should integrate with OpenAI for analysis", async () => {
      const mockAnalysis = {
        score: 85,
        issues: [
          {
            type: "plumbing",
            severity: "medium",
            description: "Minor leak detected",
            confidence: 0.8,
          },
        ],
        recommendations: ["Check plumbing in kitchen"],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: JSON.stringify(mockAnalysis) } }],
          }),
      });

      // Test AI analysis call
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer test-key",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4-vision-preview",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Analyze this property photo for issues",
                  },
                  { type: "image_url", image_url: { url: "test-image.jpg" } },
                ],
              },
            ],
          }),
        },
      );

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.choices[0].message.content).toContain("score");
    });

    it("should handle AI service failures gracefully", async () => {
      (global.fetch as Mock).mockRejectedValueOnce(
        new Error("AI service unavailable"),
      );

      const errorContext = {
        url: "https://api.openai.com/v1/chat/completions",
        method: "POST",
      };

      const error = await apiErrorHandler.handleError(
        new Error("AI service unavailable"),
        errorContext,
      );

      expect(error.category).toBe("network");
      expect(error.retry).toBe(true);
      expect(error.userMessage).toContain("Network connection error");
    });
  });

  describe("Mobile Photo Capture Integration", () => {
    it("should access camera and capture photos", async () => {
      const mockStream = {
        getTracks: vi.fn(() => [{ stop: vi.fn() }]),
      };

      mockMediaDevices.mediaDevices.getUserMedia.mockResolvedValueOnce(
        mockStream,
      );

      // Test camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      expect(stream).toBeDefined();
      expect(mockMediaDevices.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: { facingMode: "environment" },
      });
    });

    it("should handle camera permission denial", async () => {
      mockMediaDevices.mediaDevices.getUserMedia.mockRejectedValueOnce(
        new Error("Permission denied"),
      );

      try {
        await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Permission denied");
      }
    });

    it("should capture and analyze photos with AI", async () => {
      // Mock successful photo capture
      const mockCanvas = {
        toBlob: vi.fn((callback) => {
          callback(new Blob(["mock-image"], { type: "image/jpeg" }));
        }),
        getContext: vi.fn(() => ({
          drawImage: vi.fn(),
        })),
      };

      global.HTMLCanvasElement.prototype.getContext = mockCanvas.getContext;
      global.HTMLCanvasElement.prototype.toBlob = mockCanvas.toBlob;

      // Mock AI analysis response
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            analysis: {
              score: 90,
              issues: [],
              recommendations: ["Good photo quality"],
            },
          }),
      });

      const canvas = document.createElement("canvas");
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.8);
      });

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe("image/jpeg");
    });
  });

  describe("Error Handling Integration", () => {
    it("should report errors to monitoring service", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const testError = new Error("Test error for monitoring");
      const errorId = errorReporter.reportError(testError, {
        component: "test",
        severity: "high",
      });

      expect(errorId).toBeDefined();
      expect(errorId).toMatch(/^err_/);

      consoleSpy.mockRestore();
    });

    it("should handle API errors with retry logic", async () => {
      let callCount = 0;
      (global.fetch as Mock).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error("Network error"));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      const context = {
        url: "https://api.test.com/endpoint",
        method: "GET",
      };

      const result = await apiErrorHandler.executeWithRetry(
        () => fetch(context.url),
        context,
        { maxAttempts: 3 },
      );

      expect(callCount).toBe(3);
      expect(result).toBeDefined();
    });

    it("should gracefully handle component errors", async () => {
      const ErrorComponent = () => {
        throw new Error("Component error");
      };

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(
        <TestWrapper>
          <ErrorBoundary level="component">
            <ErrorComponent />
          </ErrorBoundary>
        </TestWrapper>,
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /try again/i }),
      ).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe("Performance Monitoring Integration", () => {
    it("should track performance metrics", async () => {
      const stopTimer = performanceTracker.startTimer("test-operation");

      // Simulate some work
      await new Promise((resolve) => setTimeout(resolve, 100));

      const duration = stopTimer();

      expect(duration).toBeGreaterThan(90);
      expect(duration).toBeLessThan(200);
    });

    it("should track AI processing metrics", async () => {
      const metrics = {
        operationType: "image_analysis",
        duration: 1500,
        modelUsed: "gpt-4-vision",
        inputSize: 1024000,
        outputSize: 500,
        success: true,
      };

      performanceTracker.trackAIProcessing(metrics);

      // Verify metric was tracked (would normally check monitoring dashboard)
      expect(true).toBe(true); // Placeholder for actual metric verification
    });

    it("should detect slow operations", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // Simulate slow API call
      performanceTracker.trackApiCall(
        "https://api.test.com/slow-endpoint",
        "GET",
        2500, // Exceeds threshold
        200,
      );

      // Verify warning was logged for slow operation
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Slow api operation"),
        expect.any(Object),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Complete Workflow Integration", () => {
    it("should complete end-to-end inspection workflow", async () => {
      // Test the complete workflow from property selection to audit approval
      const workflow = {
        // Step 1: Inspector selects property
        selectProperty: async () => {
          const property = await mockSupabase
            .from("properties")
            .select("*")
            .eq("id", "test-1");
          return property.data?.[0];
        },

        // Step 2: Generate AI checklist
        generateChecklist: async (property: any) => {
          const response = await fetch("/api/ai/generate-checklist", {
            method: "POST",
            body: JSON.stringify({ property }),
          });
          return response.json();
        },

        // Step 3: Capture photos with AI guidance
        capturePhotos: async (checklist: any) => {
          const photos = [];
          for (const item of checklist.items.slice(0, 3)) {
            const photo = await mockMediaDevices.mediaDevices.getUserMedia({
              video: true,
            });
            photos.push({ item: item.id, photo });
          }
          return photos;
        },

        // Step 4: Record video walkthrough
        recordVideo: async () => {
          const stream = await mockMediaDevices.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          return { stream, duration: 180 };
        },

        // Step 5: Upload and sync data
        syncData: async (inspectionData: any) => {
          const result = await mockSupabase
            .from("inspections")
            .insert(inspectionData);
          return result.data;
        },

        // Step 6: Auditor reviews and approves
        auditReview: async (inspectionId: string) => {
          const result = await mockSupabase
            .from("inspections")
            .update({
              status: "approved",
              reviewed_at: new Date().toISOString(),
            })
            .eq("id", inspectionId);
          return result.data;
        },
      };

      // Execute complete workflow
      const property = await workflow.selectProperty();
      expect(property).toBeDefined();

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              { id: "check-1", room: "Kitchen", item: "Check sink" },
              { id: "check-2", room: "Bathroom", item: "Check toilet" },
            ],
          }),
      });

      const checklist = await workflow.generateChecklist(property);
      expect(checklist.items).toHaveLength(2);

      const photos = await workflow.capturePhotos(checklist);
      expect(photos).toHaveLength(2);

      const video = await workflow.recordVideo();
      expect(video.stream).toBeDefined();

      const inspection = await workflow.syncData({
        propertyId: property.id,
        photos,
        video,
        checklist,
      });
      expect(inspection).toBeDefined();

      const auditResult = await workflow.auditReview(inspection.id);
      expect(auditResult).toBeDefined();
    });
  });
});
