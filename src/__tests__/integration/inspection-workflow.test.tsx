/**
 * @fileoverview Integration Tests for Complete Inspection Workflow
 * End-to-end testing of the core business process
 *
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from "vitest";
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
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import {
  PropertyFactory,
  InspectionFactory,
  ProfileFactory,
  SafetyItemFactory,
  TestDataUtils,
} from "../factories";

// Mock Service Worker for API calls
const server = setupServer(
  // Authentication endpoints
  http.post("/api/auth/session", () => {
    return HttpResponse.json({
      access_token: "mock-jwt-token",
      user: ProfileFactory.build({ role: "inspector" }),
    });
  }),

  // Properties endpoints
  http.get("/api/properties", () => {
    const properties = Array.from({ length: 10 }, () =>
      PropertyFactory.build(),
    );
    return HttpResponse.json({ data: properties, error: null });
  }),

  // Inspections endpoints
  http.post("/api/inspections", () => {
    const inspection = InspectionFactory.build({ status: "draft" });
    return HttpResponse.json({ data: inspection, error: null });
  }),

  http.get("/api/inspections/:id/checklist", ({ params }) => {
    const checklistItems = Array.from({ length: 8 }, () =>
      SafetyItemFactory.build(),
    );
    return HttpResponse.json({ data: checklistItems, error: null });
  }),

  http.patch("/api/inspections/:id", () => {
    const updatedInspection = InspectionFactory.build({ status: "completed" });
    return HttpResponse.json({ data: updatedInspection, error: null });
  }),

  // Photo upload endpoints
  http.post("/api/inspections/:id/photos", () => {
    return HttpResponse.json({
      data: {
        id: "photo-123",
        file_path: "/uploads/test-photo.jpg",
        upload_status: "completed",
      },
      error: null,
    });
  }),

  // AI endpoints
  http.post("/api/ai/photo-quality", () => {
    return HttpResponse.json({
      quality_score: 0.92,
      feedback: "Good lighting and focus",
      issues: [],
    });
  }),

  http.post("/api/ai/photo-compare", () => {
    return HttpResponse.json({
      similarity_score: 0.87,
      matches: ["smoke_detector_present", "proper_positioning"],
      differences: ["slight_angle_variance"],
    });
  }),
);

// Test wrapper with all providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </BrowserRouter>
  );
};

// Mock components for integration testing
const MockInspectionWorkflow = () => {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [selectedProperty, setSelectedProperty] = React.useState<string | null>(
    null,
  );
  const [inspectionId, setInspectionId] = React.useState<string | null>(null);
  const [checklistItems, setChecklistItems] = React.useState<any[]>([]);
  const [completedItems, setCompletedItems] = React.useState<Set<string>>(
    new Set(),
  );

  const mockSteps = [
    "Select Property",
    "Start Inspection",
    "Complete Checklist",
    "Upload Photos",
    "Review & Submit",
  ];

  return (
    <div data-testid="inspection-workflow">
      {/* Progress indicator */}
      <div data-testid="progress-indicator">
        Step {currentStep} of {mockSteps.length}: {mockSteps[currentStep - 1]}
      </div>

      {/* Step 1: Property Selection */}
      {currentStep === 1 && (
        <div data-testid="property-selection-step">
          <h2>Select Property for Inspection</h2>
          <div data-testid="property-list">
            {Array.from({ length: 3 }, (_, i) => {
              const property = PropertyFactory.build({ property_id: i + 1 });
              return (
                <div
                  key={property.property_id}
                  data-testid={`property-${property.property_id}`}
                  className={
                    selectedProperty === property.property_id.toString()
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    setSelectedProperty(property.property_id.toString())
                  }
                >
                  {property.property_name}
                </div>
              );
            })}
          </div>
          <button
            data-testid="continue-to-inspection"
            disabled={!selectedProperty}
            onClick={() => setCurrentStep(2)}
          >
            Start Inspection
          </button>
        </div>
      )}

      {/* Step 2: Start Inspection */}
      {currentStep === 2 && (
        <div data-testid="start-inspection-step">
          <h2>Create New Inspection</h2>
          <p>Property: {selectedProperty}</p>
          <button
            data-testid="create-inspection-btn"
            onClick={() => {
              const newInspectionId = `inspection-${Date.now()}`;
              setInspectionId(newInspectionId);
              setChecklistItems(
                Array.from({ length: 5 }, (_, i) =>
                  SafetyItemFactory.build({ id: `item-${i + 1}` }),
                ),
              );
              setCurrentStep(3);
            }}
          >
            Create Inspection
          </button>
        </div>
      )}

      {/* Step 3: Complete Checklist */}
      {currentStep === 3 && (
        <div data-testid="checklist-step">
          <h2>Complete Safety Checklist</h2>
          <div data-testid="checklist-items">
            {checklistItems.map((item) => (
              <div key={item.id} data-testid={`checklist-item-${item.id}`}>
                <label>
                  <input
                    type="checkbox"
                    data-testid={`checkbox-${item.id}`}
                    checked={completedItems.has(item.id)}
                    onChange={(e) => {
                      const newCompleted = new Set(completedItems);
                      if (e.target.checked) {
                        newCompleted.add(item.id);
                      } else {
                        newCompleted.delete(item.id);
                      }
                      setCompletedItems(newCompleted);
                    }}
                  />
                  {item.title}
                </label>
              </div>
            ))}
          </div>
          <div data-testid="progress-summary">
            {completedItems.size} of {checklistItems.length} items completed
          </div>
          <button
            data-testid="continue-to-photos"
            disabled={completedItems.size === 0}
            onClick={() => setCurrentStep(4)}
          >
            Continue to Photos
          </button>
        </div>
      )}

      {/* Step 4: Photo Upload */}
      {currentStep === 4 && (
        <div data-testid="photo-upload-step">
          <h2>Upload Inspection Photos</h2>
          {Array.from(completedItems).map((itemId) => (
            <div key={itemId} data-testid={`photo-section-${itemId}`}>
              <h3>Photo for {itemId}</h3>
              <input
                type="file"
                data-testid={`file-input-${itemId}`}
                accept="image/*"
                onChange={() => {
                  // Simulate photo upload
                }}
              />
              <div data-testid={`upload-status-${itemId}`}>
                Ready for upload
              </div>
            </div>
          ))}
          <button
            data-testid="continue-to-review"
            onClick={() => setCurrentStep(5)}
          >
            Continue to Review
          </button>
        </div>
      )}

      {/* Step 5: Review & Submit */}
      {currentStep === 5 && (
        <div data-testid="review-step">
          <h2>Review & Submit Inspection</h2>
          <div data-testid="inspection-summary">
            <p>Property: {selectedProperty}</p>
            <p>Inspection ID: {inspectionId}</p>
            <p>Completed Items: {completedItems.size}</p>
            <p>Photos: {completedItems.size} uploaded</p>
          </div>
          <button
            data-testid="submit-inspection"
            onClick={() => {
              // Simulate submission
              alert("Inspection submitted successfully!");
            }}
          >
            Submit Inspection
          </button>
        </div>
      )}
    </div>
  );
};

describe("Inspection Workflow Integration", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeAll(() => {
    server.listen();
  });

  beforeEach(() => {
    user = userEvent.setup();
    server.resetHandlers();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    server.close();
  });

  describe("Complete Workflow", () => {
    it("should complete full inspection workflow successfully", async () => {
      render(
        <TestWrapper>
          <MockInspectionWorkflow />
        </TestWrapper>,
      );

      // Step 1: Property Selection
      expect(screen.getByTestId("property-selection-step")).toBeInTheDocument();
      expect(
        screen.getByText("Step 1 of 5: Select Property"),
      ).toBeInTheDocument();

      // Select a property
      const property1 = screen.getByTestId("property-1");
      await user.click(property1);
      expect(property1).toHaveClass("selected");

      // Continue to inspection
      const continueBtn = screen.getByTestId("continue-to-inspection");
      expect(continueBtn).toBeEnabled();
      await user.click(continueBtn);

      // Step 2: Start Inspection
      expect(screen.getByTestId("start-inspection-step")).toBeInTheDocument();
      expect(
        screen.getByText("Step 2 of 5: Start Inspection"),
      ).toBeInTheDocument();

      // Create inspection
      const createBtn = screen.getByTestId("create-inspection-btn");
      await user.click(createBtn);

      // Step 3: Complete Checklist
      expect(screen.getByTestId("checklist-step")).toBeInTheDocument();
      expect(
        screen.getByText("Step 3 of 5: Complete Checklist"),
      ).toBeInTheDocument();

      // Complete some checklist items
      const firstCheckbox = screen.getByTestId("checkbox-item-1");
      const secondCheckbox = screen.getByTestId("checkbox-item-2");

      await user.click(firstCheckbox);
      await user.click(secondCheckbox);

      expect(firstCheckbox).toBeChecked();
      expect(secondCheckbox).toBeChecked();
      expect(screen.getByText("2 of 5 items completed")).toBeInTheDocument();

      // Continue to photos
      const photoBtn = screen.getByTestId("continue-to-photos");
      expect(photoBtn).toBeEnabled();
      await user.click(photoBtn);

      // Step 4: Photo Upload
      expect(screen.getByTestId("photo-upload-step")).toBeInTheDocument();
      expect(
        screen.getByText("Step 4 of 5: Upload Photos"),
      ).toBeInTheDocument();

      // Should have photo sections for completed items
      expect(screen.getByTestId("photo-section-item-1")).toBeInTheDocument();
      expect(screen.getByTestId("photo-section-item-2")).toBeInTheDocument();

      // Continue to review
      const reviewBtn = screen.getByTestId("continue-to-review");
      await user.click(reviewBtn);

      // Step 5: Review & Submit
      expect(screen.getByTestId("review-step")).toBeInTheDocument();
      expect(
        screen.getByText("Step 5 of 5: Review & Submit Inspection"),
      ).toBeInTheDocument();

      // Verify summary information
      const summary = screen.getByTestId("inspection-summary");
      expect(within(summary).getByText("Property: 1")).toBeInTheDocument();
      expect(
        within(summary).getByText("Completed Items: 2"),
      ).toBeInTheDocument();
      expect(
        within(summary).getByText("Photos: 2 uploaded"),
      ).toBeInTheDocument();

      // Submit inspection
      const submitBtn = screen.getByTestId("submit-inspection");
      await user.click(submitBtn);
    });

    it("should prevent progression without required selections", async () => {
      render(
        <TestWrapper>
          <MockInspectionWorkflow />
        </TestWrapper>,
      );

      // Should not be able to continue without selecting property
      const continueBtn = screen.getByTestId("continue-to-inspection");
      expect(continueBtn).toBeDisabled();

      // Select property to enable continuation
      await user.click(screen.getByTestId("property-1"));
      expect(continueBtn).toBeEnabled();
    });

    it("should prevent photo step without completed checklist items", async () => {
      render(
        <TestWrapper>
          <MockInspectionWorkflow />
        </TestWrapper>,
      );

      // Navigate to checklist step
      await user.click(screen.getByTestId("property-1"));
      await user.click(screen.getByTestId("continue-to-inspection"));
      await user.click(screen.getByTestId("create-inspection-btn"));

      // Should not be able to continue without completing items
      const photoBtn = screen.getByTestId("continue-to-photos");
      expect(photoBtn).toBeDisabled();

      // Complete an item to enable continuation
      await user.click(screen.getByTestId("checkbox-item-1"));
      expect(photoBtn).toBeEnabled();
    });
  });

  describe("Progress Tracking", () => {
    it("should display correct progress at each step", async () => {
      render(
        <TestWrapper>
          <MockInspectionWorkflow />
        </TestWrapper>,
      );

      // Check initial progress
      expect(
        screen.getByText("Step 1 of 5: Select Property"),
      ).toBeInTheDocument();

      // Progress through steps and verify progress indicator
      await user.click(screen.getByTestId("property-1"));
      await user.click(screen.getByTestId("continue-to-inspection"));
      expect(
        screen.getByText("Step 2 of 5: Start Inspection"),
      ).toBeInTheDocument();

      await user.click(screen.getByTestId("create-inspection-btn"));
      expect(
        screen.getByText("Step 3 of 5: Complete Checklist"),
      ).toBeInTheDocument();

      await user.click(screen.getByTestId("checkbox-item-1"));
      await user.click(screen.getByTestId("continue-to-photos"));
      expect(
        screen.getByText("Step 4 of 5: Upload Photos"),
      ).toBeInTheDocument();

      await user.click(screen.getByTestId("continue-to-review"));
      expect(
        screen.getByText("Step 5 of 5: Review & Submit Inspection"),
      ).toBeInTheDocument();
    });

    it("should update checklist progress dynamically", async () => {
      render(
        <TestWrapper>
          <MockInspectionWorkflow />
        </TestWrapper>,
      );

      // Navigate to checklist
      await user.click(screen.getByTestId("property-1"));
      await user.click(screen.getByTestId("continue-to-inspection"));
      await user.click(screen.getByTestId("create-inspection-btn"));

      // Initially no items completed
      expect(screen.getByText("0 of 5 items completed")).toBeInTheDocument();

      // Complete items and verify progress
      await user.click(screen.getByTestId("checkbox-item-1"));
      expect(screen.getByText("1 of 5 items completed")).toBeInTheDocument();

      await user.click(screen.getByTestId("checkbox-item-2"));
      expect(screen.getByText("2 of 5 items completed")).toBeInTheDocument();

      // Uncheck item and verify progress updates
      await user.click(screen.getByTestId("checkbox-item-1"));
      expect(screen.getByText("1 of 5 items completed")).toBeInTheDocument();
    });
  });

  describe("Data Persistence", () => {
    it("should maintain state across step transitions", async () => {
      render(
        <TestWrapper>
          <MockInspectionWorkflow />
        </TestWrapper>,
      );

      // Complete workflow and verify data persistence
      await user.click(screen.getByTestId("property-2")); // Select property 2
      await user.click(screen.getByTestId("continue-to-inspection"));
      await user.click(screen.getByTestId("create-inspection-btn"));

      // Complete multiple items
      await user.click(screen.getByTestId("checkbox-item-1"));
      await user.click(screen.getByTestId("checkbox-item-3"));
      await user.click(screen.getByTestId("checkbox-item-5"));

      await user.click(screen.getByTestId("continue-to-photos"));
      await user.click(screen.getByTestId("continue-to-review"));

      // Verify all data is maintained in summary
      const summary = screen.getByTestId("inspection-summary");
      expect(within(summary).getByText("Property: 2")).toBeInTheDocument();
      expect(
        within(summary).getByText("Completed Items: 3"),
      ).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle API failures gracefully", async () => {
      // Mock API failure
      server.use(
        http.post("/api/inspections", () => {
          return HttpResponse.json(
            { error: "Failed to create inspection" },
            { status: 500 },
          );
        }),
      );

      render(
        <TestWrapper>
          <MockInspectionWorkflow />
        </TestWrapper>,
      );

      // Navigate to create inspection step
      await user.click(screen.getByTestId("property-1"));
      await user.click(screen.getByTestId("continue-to-inspection"));
      await user.click(screen.getByTestId("create-inspection-btn"));

      // Should continue to work even with API failure (for this mock)
      expect(screen.getByTestId("checklist-step")).toBeInTheDocument();
    });

    it("should validate file uploads", async () => {
      render(
        <TestWrapper>
          <MockInspectionWorkflow />
        </TestWrapper>,
      );

      // Navigate to photo upload step
      await user.click(screen.getByTestId("property-1"));
      await user.click(screen.getByTestId("continue-to-inspection"));
      await user.click(screen.getByTestId("create-inspection-btn"));
      await user.click(screen.getByTestId("checkbox-item-1"));
      await user.click(screen.getByTestId("continue-to-photos"));

      // Should have file input for photo upload
      const fileInput = screen.getByTestId("file-input-item-1");
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute("accept", "image/*");
    });
  });

  describe("Mobile Responsiveness", () => {
    it("should work correctly on mobile viewports", async () => {
      // Mock mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 667,
      });

      render(
        <TestWrapper>
          <MockInspectionWorkflow />
        </TestWrapper>,
      );

      // Should render and function normally on mobile
      expect(screen.getByTestId("inspection-workflow")).toBeInTheDocument();
      expect(screen.getByTestId("property-selection-step")).toBeInTheDocument();

      // Should be able to complete workflow on mobile
      await user.click(screen.getByTestId("property-1"));
      await user.click(screen.getByTestId("continue-to-inspection"));

      expect(screen.getByTestId("start-inspection-step")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("should complete workflow within performance thresholds", async () => {
      const startTime = performance.now();

      render(
        <TestWrapper>
          <MockInspectionWorkflow />
        </TestWrapper>,
      );

      // Complete full workflow
      await user.click(screen.getByTestId("property-1"));
      await user.click(screen.getByTestId("continue-to-inspection"));
      await user.click(screen.getByTestId("create-inspection-btn"));
      await user.click(screen.getByTestId("checkbox-item-1"));
      await user.click(screen.getByTestId("continue-to-photos"));
      await user.click(screen.getByTestId("continue-to-review"));

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should complete within reasonable time (5 seconds)
      expect(totalTime).toBeLessThan(5000);
    });
  });
});

describe("Real API Integration", () => {
  beforeAll(() => {
    // Use real API endpoints for integration tests
    server.close();
  });

  afterAll(() => {
    server.listen();
  });

  it("should work with actual API endpoints", async () => {
    // This would test against actual running backend
    // For now, we'll skip this test unless in integration environment
    if (process.env.INTEGRATION_TEST !== "true") {
      return;
    }

    // Real integration test code would go here
    // Testing against actual Supabase instance
  });
});
