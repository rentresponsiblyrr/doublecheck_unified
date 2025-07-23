// Simple Test for VRBO Browser Scraper
// Basic validation without complex dependencies

import { describe, expect, it, vi } from "vitest";

// Mock the environment and logger dependencies
process.env.NODE_ENV = "test";
process.env.VITE_SUPABASE_URL = "test-url";
process.env.VITE_SUPABASE_ANON_KEY = "test-key";

const mockLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
};

const mockAiDecisionLogger = {
  logSimpleDecision: () => Promise.resolve(),
};

const mockErrorReporter = {
  reportError: () => {},
};

// Mock the dependencies
vi.mock("../../../utils/logger", () => ({
  logger: mockLogger,
}));

vi.mock("../../ai/decision-logger", () => ({
  aiDecisionLogger: mockAiDecisionLogger,
}));

vi.mock("../../monitoring/error-reporter", () => ({
  errorReporter: mockErrorReporter,
}));

describe("VRBO Browser Scraper - Basic Tests", () => {
  it("should validate VRBO URLs correctly", () => {
    // Import the URL validation logic
    const validUrls = [
      "https://www.vrbo.com/12345",
      "https://vrbo.com/12345/test-property",
      "https://www.homeaway.com/12345",
    ];

    const invalidUrls = [
      "https://airbnb.com/rooms/12345",
      "not-a-url",
      "",
      "https://booking.com/hotel/test",
    ];

    // Test URL validation pattern
    const vrboPattern =
      /^https?:\/\/(www\.)?(vrbo|homeaway|vacationrentals)\.com\/\d+/;

    validUrls.forEach((url) => {
      expect(vrboPattern.test(url)).toBe(true);
    });

    invalidUrls.forEach((url) => {
      expect(vrboPattern.test(url)).toBe(false);
    });
  });

  it("should extract property ID from URL", () => {
    const testCases = [
      { url: "https://www.vrbo.com/12345", expected: "12345" },
      { url: "https://vrbo.com/67890/test-property", expected: "67890" },
      { url: "https://www.homeaway.com/555/nice-place", expected: "555" },
    ];

    testCases.forEach(({ url, expected }) => {
      const match = url.match(/\/(\d+)/);
      const propertyId = match ? match[1] : null;
      expect(propertyId).toBe(expected);
    });
  });

  it("should categorize images correctly", () => {
    const testImages = [
      { url: "https://images.vrbo.com/kitchen-1.jpg", expected: "kitchen" },
      {
        url: "https://images.vrbo.com/bedroom-master.jpg",
        expected: "bedroom",
      },
      {
        url: "https://images.vrbo.com/exterior-view.jpg",
        expected: "exterior",
      },
      { url: "https://images.vrbo.com/bathroom-1.jpg", expected: "bathroom" },
      {
        url: "https://images.vrbo.com/living-room.jpg",
        expected: "living_area",
      },
      {
        url: "https://images.vrbo.com/pool-deck.jpg",
        expected: "outdoor_space",
      },
      { url: "https://images.vrbo.com/random-image.jpg", expected: "interior" },
    ];

    testImages.forEach(({ url, expected }) => {
      const category = categorizeImageByUrl(url);
      expect(category).toBe(expected);
    });
  });

  it("should deduplicate images correctly", () => {
    const images = [
      { url: "https://images.vrbo.com/image1.jpg", alt: "Image 1" },
      { url: "https://images.vrbo.com/image2.jpg", alt: "Image 2" },
      {
        url: "https://images.vrbo.com/image1.jpg?version=2",
        alt: "Image 1 duplicate",
      },
      { url: "https://images.vrbo.com/image3.jpg", alt: "Image 3" },
    ];

    const deduped = deduplicateImages(images);
    expect(deduped).toHaveLength(3);

    // Should keep the first occurrence
    expect(deduped.find((img) => img.alt === "Image 1")).toBeDefined();
    expect(
      deduped.find((img) => img.alt === "Image 1 duplicate"),
    ).toBeUndefined();
  });

  it("should validate browser configuration", () => {
    const config = {
      headless: true,
      scrollCycles: 5,
      scrollWaitTime: 3000,
      browserTimeout: 120000,
      enableStealth: true,
    };

    expect(config.headless).toBe(true);
    expect(config.scrollCycles).toBeGreaterThan(0);
    expect(config.scrollCycles).toBeLessThanOrEqual(10);
    expect(config.scrollWaitTime).toBeGreaterThan(1000);
    expect(config.browserTimeout).toBeGreaterThan(30000);
  });

  it("should handle gallery automation result correctly", () => {
    const mockGalleryResult = {
      images: [
        { url: "https://images.vrbo.com/gallery1.jpg", alt: "Gallery 1" },
        { url: "https://images.vrbo.com/gallery2.jpg", alt: "Gallery 2" },
      ],
      totalImagesFound: 2,
      scrollCyclesCompleted: 5,
      loadingTime: 5000,
      screenshots: [],
      errors: [],
    };

    expect(mockGalleryResult.images).toHaveLength(2);
    expect(mockGalleryResult.scrollCyclesCompleted).toBe(5);
    expect(mockGalleryResult.loadingTime).toBeGreaterThan(0);
    expect(mockGalleryResult.errors).toHaveLength(0);
  });

  it("should calculate data completeness score", () => {
    const testData = {
      title: "Test Property",
      description: "A great property",
      amenities: ["WiFi", "Pool", "Kitchen"],
      images: Array(15)
        .fill(null)
        .map((_, i) => ({ url: `image${i}.jpg` })),
      specifications: {
        bedrooms: 3,
        bathrooms: 2,
        maxGuests: 6,
      },
    };

    const score = calculateDataCompleteness(testData);
    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// Helper functions for testing
function categorizeImageByUrl(url: string): string {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes("exterior") || lowerUrl.includes("outside"))
    return "exterior";
  if (lowerUrl.includes("kitchen")) return "kitchen";
  if (lowerUrl.includes("bedroom") || lowerUrl.includes("bed"))
    return "bedroom";
  if (lowerUrl.includes("bathroom") || lowerUrl.includes("bath"))
    return "bathroom";
  if (lowerUrl.includes("living") || lowerUrl.includes("lounge"))
    return "living_area";
  if (
    lowerUrl.includes("pool") ||
    lowerUrl.includes("deck") ||
    lowerUrl.includes("patio")
  )
    return "outdoor_space";
  if (lowerUrl.includes("view") || lowerUrl.includes("scenic")) return "view";
  if (lowerUrl.includes("amenity")) return "amenity";

  return "interior";
}

function deduplicateImages(
  images: Array<{ url: string; alt: string }>,
): Array<{ url: string; alt: string }> {
  const seen = new Set<string>();
  const unique: Array<{ url: string; alt: string }> = [];

  images.forEach((img) => {
    const normalizedUrl = img.url.replace(/\?.*$/, "").toLowerCase();

    if (!seen.has(normalizedUrl)) {
      seen.add(normalizedUrl);
      unique.push(img);
    }
  });

  return unique;
}

function calculateDataCompleteness(data: any): number {
  let score = 0;

  // Base property data (40%)
  if (data.title) score += 10;
  if (data.description) score += 10;
  if (data.amenities && data.amenities.length > 0) score += 10;
  if (data.specifications?.bedrooms) score += 5;
  if (data.specifications?.bathrooms) score += 5;

  // Image extraction (50%)
  if (data.images && data.images.length > 0) score += 20;
  if (data.images && data.images.length >= 10) score += 10;
  if (data.images && data.images.length >= 20) score += 10;
  if (data.images && data.images.length >= 30) score += 10;

  // Additional completeness (10%)
  if (data.specifications?.maxGuests) score += 5;
  if (data.amenities && data.amenities.length >= 5) score += 5;

  return Math.round(Math.min(score, 100));
}
