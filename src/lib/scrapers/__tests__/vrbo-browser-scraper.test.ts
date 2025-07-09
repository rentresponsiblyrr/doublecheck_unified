// Comprehensive Test Suite for VRBO Browser Scraper
// Tests browser automation, gallery loading, and dynamic image extraction

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi, Mock } from 'vitest';
import { VRBOBrowserScraper, createVRBOBrowserScraper, scrapeBrowserVRBOProperty } from '../vrbo-browser-scraper';
import { BrowserManager } from '../browser-manager';
import { VRBOGalleryAutomation } from '../vrbo-gallery-automation';
import type { PhotoData, VRBOPropertyData } from '../types';

// Mock Puppeteer
const mockPage = {
  goto: vi.fn(),
  waitForSelector: vi.fn(),
  click: vi.fn(),
  evaluate: vi.fn(),
  waitForTimeout: vi.fn(),
  mouse: {
    move: vi.fn()
  },
  keyboard: {
    press: vi.fn()
  },
  content: vi.fn(),
  screenshot: vi.fn(),
  viewport: vi.fn(),
  metrics: vi.fn(),
  setUserAgent: vi.fn(),
  setExtraHTTPHeaders: vi.fn(),
  setRequestInterception: vi.fn(),
  setDefaultTimeout: vi.fn(),
  setDefaultNavigationTimeout: vi.fn(),
  evaluateOnNewDocument: vi.fn(),
  close: vi.fn(),
  isClosed: vi.fn(),
  on: vi.fn(),
  $: vi.fn(),
  $$: vi.fn()
};

const mockBrowser = {
  newPage: vi.fn(),
  close: vi.fn(),
  connected: vi.fn()
};

const mockPuppeteer = {
  launch: vi.fn()
};

// Mock browser manager
vi.mock('../browser-manager', () => ({
  BrowserManager: vi.fn().mockImplementation(() => ({
    createSession: vi.fn(),
    closeSession: vi.fn(),
    closeAllSessions: vi.fn(),
    getSession: vi.fn(),
    isSessionHealthy: vi.fn(),
    randomDelay: vi.fn(),
    humanMouseMove: vi.fn(),
    humanScroll: vi.fn(),
    config: {
      userAgent: 'Test-Agent'
    }
  }))
}));

// Mock gallery automation
vi.mock('../vrbo-gallery-automation', () => ({
  VRBOGalleryAutomation: vi.fn().mockImplementation(() => ({
    loadAllGalleryImages: vi.fn()
  }))
}));

// Mock AI decision logger
vi.mock('../../ai/decision-logger', () => ({
  aiDecisionLogger: {
    logSimpleDecision: vi.fn()
  }
}));

// Mock logger
vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

// Mock error reporter
vi.mock('../../monitoring/error-reporter', () => ({
  errorReporter: {
    reportError: vi.fn()
  }
}));

// Test data
const mockVRBOUrl = 'https://www.vrbo.com/12345/test-property';
const mockPropertyData: VRBOPropertyData = {
  vrboId: '12345',
  sourceUrl: mockVRBOUrl,
  title: 'Test Property',
  description: 'A beautiful test property',
  amenities: [
    { name: 'WiFi', verified: true, category: 'connectivity', priority: 'essential' },
    { name: 'Pool', verified: true, category: 'outdoor', priority: 'important' }
  ],
  photos: [],
  rooms: [],
  specifications: {
    propertyType: 'house',
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 6
  },
  location: {
    city: 'Test City',
    state: 'Test State',
    country: 'Test Country'
  },
  instantBook: false,
  cancellationPolicy: 'Flexible',
  houseRules: [],
  lastUpdated: new Date()
};

const mockGalleryImages: PhotoData[] = [
  {
    url: 'https://images.vrbo.com/gallery1.jpg',
    thumbnailUrl: 'https://images.vrbo.com/gallery1_thumb.jpg',
    alt: 'Living room',
    category: 'living_area',
    room: 'living_room',
    size: { width: 1200, height: 800 },
    order: 1
  },
  {
    url: 'https://images.vrbo.com/gallery2.jpg',
    thumbnailUrl: 'https://images.vrbo.com/gallery2_thumb.jpg',
    alt: 'Kitchen',
    category: 'kitchen',
    room: 'kitchen',
    size: { width: 1200, height: 800 },
    order: 2
  }
];

const mockStaticImages: PhotoData[] = [
  {
    url: 'https://images.vrbo.com/static1.jpg',
    thumbnailUrl: 'https://images.vrbo.com/static1_thumb.jpg',
    alt: 'Exterior',
    category: 'exterior',
    size: { width: 800, height: 600 },
    order: 1
  }
];

describe('VRBOBrowserScraper', () => {
  let browserScraper: VRBOBrowserScraper;
  let mockBrowserManager: any;
  let mockGalleryAutomation: any;
  let mockBrowserSession: any;

  beforeAll(() => {
    // Mock Puppeteer
    vi.mock('puppeteer', () => ({
      default: mockPuppeteer
    }));

    // Setup mock responses
    mockPuppeteer.launch.mockResolvedValue(mockBrowser);
    mockBrowser.newPage.mockResolvedValue(mockPage);
    mockBrowser.connected.mockReturnValue(true);
    mockPage.isClosed.mockReturnValue(false);
    mockPage.goto.mockResolvedValue(undefined);
    mockPage.content.mockResolvedValue('<html><body>Test content</body></html>');
    mockPage.viewport.mockResolvedValue({ width: 1920, height: 1080 });
    mockPage.metrics.mockResolvedValue({ JSHeapUsedSize: 1000000 });
    mockPage.evaluate.mockResolvedValue('Mozilla/5.0 Test Agent');
  });

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup browser session mock
    mockBrowserSession = {
      browser: mockBrowser,
      page: mockPage,
      sessionId: 'test-session-123',
      startTime: Date.now(),
      isActive: true
    };

    // Setup browser manager mock
    mockBrowserManager = new (BrowserManager as any)();
    mockBrowserManager.createSession.mockResolvedValue(mockBrowserSession);
    mockBrowserManager.closeSession.mockResolvedValue(undefined);
    mockBrowserManager.closeAllSessions.mockResolvedValue(undefined);
    mockBrowserManager.isSessionHealthy.mockResolvedValue(true);
    mockBrowserManager.randomDelay.mockResolvedValue(undefined);
    mockBrowserManager.humanMouseMove.mockResolvedValue(undefined);
    mockBrowserManager.humanScroll.mockResolvedValue(undefined);

    // Setup gallery automation mock
    mockGalleryAutomation = new (VRBOGalleryAutomation as any)();
    mockGalleryAutomation.loadAllGalleryImages.mockResolvedValue({
      images: mockGalleryImages,
      totalImagesFound: mockGalleryImages.length,
      scrollCyclesCompleted: 5,
      loadingTime: 5000,
      screenshots: [],
      errors: []
    });

    // Create scraper instance
    browserScraper = createVRBOBrowserScraper({
      timeout: 30000,
      retries: 3,
      rateLimit: 10
    }, {
      headless: true,
      scrollCycles: 5,
      scrollWaitTime: 3000,
      enableStealth: true
    });

    // Replace internal instances with mocks
    (browserScraper as any).browserManager = mockBrowserManager;
    (browserScraper as any).galleryAutomation = mockGalleryAutomation;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should create scraper with default configuration', () => {
      const scraper = createVRBOBrowserScraper();
      expect(scraper).toBeInstanceOf(VRBOBrowserScraper);
    });

    it('should accept custom browser configuration', () => {
      const customConfig = {
        headless: false,
        scrollCycles: 10,
        scrollWaitTime: 5000,
        enableStealth: false
      };

      const scraper = createVRBOBrowserScraper({}, customConfig);
      expect(scraper).toBeInstanceOf(VRBOBrowserScraper);
    });
  });

  describe('Browser Session Management', () => {
    it('should create and close browser session successfully', async () => {
      mockBrowserManager.createSession.mockResolvedValue(mockBrowserSession);
      mockBrowserManager.closeSession.mockResolvedValue(undefined);

      const result = await browserScraper.scrapeWithBrowserAutomation(mockVRBOUrl);

      expect(mockBrowserManager.createSession).toHaveBeenCalled();
      expect(mockBrowserManager.closeSession).toHaveBeenCalledWith('test-session-123');
    }, 30000); // 30 second timeout for browser tests

    it('should handle browser session creation failure', async () => {
      mockBrowserManager.createSession.mockRejectedValue(new Error('Browser launch failed'));

      const result = await browserScraper.scrapeWithBrowserAutomation(mockVRBOUrl);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('BROWSER_SCRAPING_FAILED');
    }, 30000);

    it('should clean up session even on error', async () => {
      mockGalleryAutomation.loadAllGalleryImages.mockRejectedValue(new Error('Gallery loading failed'));

      const result = await browserScraper.scrapeWithBrowserAutomation(mockVRBOUrl);

      expect(mockBrowserManager.closeSession).toHaveBeenCalledWith('test-session-123');
    }, 30000);
  });

  describe('Gallery Automation Integration', () => {
    it('should successfully load gallery images', async () => {
      const result = await browserScraper.scrapeWithBrowserAutomation(mockVRBOUrl);

      expect(result.success).toBe(true);
      expect(result.data?.galleryImages).toHaveLength(2);
      expect(result.data?.galleryImages[0].url).toBe('https://images.vrbo.com/gallery1.jpg');
      expect(result.data?.galleryLoadingResult.scrollCyclesCompleted).toBe(5);
    }, 30000);

    it('should handle gallery automation errors gracefully', async () => {
      mockGalleryAutomation.loadAllGalleryImages.mockResolvedValue({
        images: [],
        totalImagesFound: 0,
        scrollCyclesCompleted: 0,
        loadingTime: 1000,
        screenshots: [],
        errors: ['Gallery modal failed to open']
      });

      const result = await browserScraper.scrapeWithBrowserAutomation(mockVRBOUrl);

      expect(result.success).toBe(true);
      expect(result.data?.galleryImages).toHaveLength(0);
      expect(result.data?.galleryLoadingResult.errors).toContain('Gallery modal failed to open');
    });

    it('should pass correct configuration to gallery automation', async () => {
      await browserScraper.scrapeWithBrowserAutomation(mockVRBOUrl);

      expect(mockGalleryAutomation.loadAllGalleryImages).toHaveBeenCalledWith(
        mockPage,
        mockVRBOUrl
      );
    });
  });

  describe('Static Fallback Integration', () => {
    it('should use static fallback when enabled', async () => {
      // Mock the comprehensive scraper
      const mockComprehensiveResult = {
        success: true,
        data: {
          propertyData: mockPropertyData,
          images: mockStaticImages,
          extractionReport: {
            completenessScore: 85,
            totalDataPoints: 20,
            processingTime: 2000
          }
        },
        errors: [],
        metadata: {
          duration: 2000,
          dataCompleteness: 85
        }
      };

      // Mock the parent class method
      browserScraper.scrapeComprehensiveProperty = vi.fn().mockResolvedValue(mockComprehensiveResult);

      const result = await browserScraper.scrapeWithBrowserAutomation(mockVRBOUrl, {
        useStaticFallback: true
      });

      expect(result.success).toBe(true);
      expect(result.data?.staticImages).toHaveLength(1);
      expect(result.data?.totalImages).toBe(3); // 2 gallery + 1 static
    });

    it('should fallback to static when browser automation fails', async () => {
      mockBrowserManager.createSession.mockRejectedValue(new Error('Browser failed'));

      const mockComprehensiveResult = {
        success: true,
        data: {
          propertyData: mockPropertyData,
          images: mockStaticImages,
          extractionReport: {
            completenessScore: 60,
            totalDataPoints: 15,
            processingTime: 1000
          }
        },
        errors: [],
        metadata: {
          duration: 1000,
          dataCompleteness: 60
        }
      };

      browserScraper.scrapeComprehensiveProperty = vi.fn().mockResolvedValue(mockComprehensiveResult);

      const result = await browserScraper.scrapeWithBrowserAutomation(mockVRBOUrl, {
        useStaticFallback: true
      });

      expect(result.success).toBe(true);
      expect(result.data?.galleryImages).toHaveLength(0);
      expect(result.data?.staticImages).toHaveLength(1);
      expect(result.data?.galleryLoadingResult.errors).toContain('Browser automation failed, used static fallback');
    });
  });

  describe('Data Merging', () => {
    it('should merge gallery and static images correctly', async () => {
      const mockComprehensiveResult = {
        success: true,
        data: {
          propertyData: mockPropertyData,
          images: mockStaticImages,
          extractionReport: {
            completenessScore: 85,
            totalDataPoints: 20,
            processingTime: 2000
          }
        },
        errors: [],
        metadata: {
          duration: 2000,
          dataCompleteness: 85
        }
      };

      browserScraper.scrapeComprehensiveProperty = vi.fn().mockResolvedValue(mockComprehensiveResult);

      const result = await browserScraper.scrapeWithBrowserAutomation(mockVRBOUrl);

      expect(result.success).toBe(true);
      expect(result.data?.totalImages).toBe(3);
      expect(result.data?.galleryImages).toHaveLength(2);
      expect(result.data?.staticImages).toHaveLength(1);
    });

    it('should deduplicate images across sources', async () => {
      // Add duplicate image to static images
      const duplicateStaticImages = [
        ...mockStaticImages,
        {
          url: 'https://images.vrbo.com/gallery1.jpg', // Duplicate of gallery image
          thumbnailUrl: 'https://images.vrbo.com/gallery1_thumb.jpg',
          alt: 'Living room duplicate',
          category: 'living_area' as const,
          size: { width: 800, height: 600 },
          order: 2
        }
      ];

      const mockComprehensiveResult = {
        success: true,
        data: {
          propertyData: mockPropertyData,
          images: duplicateStaticImages,
          extractionReport: {
            completenessScore: 85,
            totalDataPoints: 20,
            processingTime: 2000
          }
        },
        errors: [],
        metadata: {
          duration: 2000,
          dataCompleteness: 85
        }
      };

      browserScraper.scrapeComprehensiveProperty = vi.fn().mockResolvedValue(mockComprehensiveResult);

      const result = await browserScraper.scrapeWithBrowserAutomation(mockVRBOUrl);

      expect(result.success).toBe(true);
      expect(result.data?.totalImages).toBe(3); // Should be 3, not 4 (duplicate removed)
    });
  });

  describe('Error Handling', () => {
    it('should handle page navigation errors', async () => {
      mockPage.goto.mockRejectedValue(new Error('Navigation failed'));

      const result = await browserScraper.scrapeWithBrowserAutomation(mockVRBOUrl);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should handle browser crash during scraping', async () => {
      mockBrowser.connected.mockReturnValue(false);
      mockBrowserManager.isSessionHealthy.mockResolvedValue(false);

      const result = await browserScraper.scrapeWithBrowserAutomation(mockVRBOUrl);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should handle timeout errors', async () => {
      mockPage.goto.mockRejectedValue(new Error('Navigation timeout'));

      const result = await browserScraper.scrapeWithBrowserAutomation(mockVRBOUrl, {
        browserTimeout: 5000
      });

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('Navigation timeout');
    });
  });

  describe('Performance and Metrics', () => {
    it('should track processing time correctly', async () => {
      const startTime = Date.now();
      
      const result = await browserScraper.scrapeWithBrowserAutomation(mockVRBOUrl);
      
      const endTime = Date.now();
      expect(result.metadata.duration).toBeGreaterThan(0);
      expect(result.metadata.duration).toBeLessThan(endTime - startTime + 100);
    });

    it('should calculate data completeness score', async () => {
      const result = await browserScraper.scrapeWithBrowserAutomation(mockVRBOUrl);

      expect(result.success).toBe(true);
      expect(result.metadata.dataCompleteness).toBeGreaterThan(0);
      expect(result.metadata.dataCompleteness).toBeLessThanOrEqual(100);
    });

    it('should collect browser metadata', async () => {
      const result = await browserScraper.scrapeWithBrowserAutomation(mockVRBOUrl);

      expect(result.success).toBe(true);
      expect(result.data?.browserMetadata).toBeDefined();
      expect(result.data?.browserMetadata.sessionId).toBe('test-session-123');
      expect(result.data?.browserMetadata.userAgent).toBeDefined();
      expect(result.data?.browserMetadata.screenResolution).toBeDefined();
    });
  });

  describe('URL Validation', () => {
    it('should validate VRBO URLs correctly', async () => {
      const invalidUrls = [
        'https://airbnb.com/rooms/12345',
        'https://booking.com/hotel/test',
        'not-a-url',
        ''
      ];

      for (const url of invalidUrls) {
        const result = await browserScraper.scrapeWithBrowserAutomation(url);
        expect(result.success).toBe(false);
      }
    });

    it('should accept valid VRBO URLs', async () => {
      const validUrls = [
        'https://www.vrbo.com/12345',
        'https://vrbo.com/12345/test-property',
        'https://www.homeaway.com/12345',
        'https://www.vacationrentals.com/12345'
      ];

      for (const url of validUrls) {
        const result = await browserScraper.scrapeWithBrowserAutomation(url);
        expect(result.success).toBe(true);
      }
    });
  });
});

describe('Convenience Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('scrapeBrowserVRBOProperty', () => {
    it('should scrape property and cleanup automatically', async () => {
      const mockScraper = {
        scrapeWithBrowserAutomation: vi.fn().mockResolvedValue({
          success: true,
          data: {
            propertyData: mockPropertyData,
            galleryImages: mockGalleryImages,
            totalImages: 2
          },
          errors: [],
          metadata: { duration: 5000 }
        }),
        cleanup: vi.fn()
      };

      // Mock the factory function
      vi.mocked(createVRBOBrowserScraper).mockReturnValue(mockScraper as any);

      const result = await scrapeBrowserVRBOProperty(mockVRBOUrl);

      expect(result.success).toBe(true);
      expect(mockScraper.scrapeWithBrowserAutomation).toHaveBeenCalledWith(mockVRBOUrl, {});
      expect(mockScraper.cleanup).toHaveBeenCalled();
    });

    it('should cleanup even on error', async () => {
      const mockScraper = {
        scrapeWithBrowserAutomation: vi.fn().mockRejectedValue(new Error('Test error')),
        cleanup: vi.fn()
      };

      vi.mocked(createVRBOBrowserScraper).mockReturnValue(mockScraper as any);

      try {
        await scrapeBrowserVRBOProperty(mockVRBOUrl);
      } catch (error) {
        // Error is expected
      }

      expect(mockScraper.cleanup).toHaveBeenCalled();
    });
  });
});

describe('Integration with Real-World Scenarios', () => {
  it('should handle properties with many images', async () => {
    const manyImages = Array.from({ length: 50 }, (_, i) => ({
      url: `https://images.vrbo.com/image${i}.jpg`,
      thumbnailUrl: `https://images.vrbo.com/image${i}_thumb.jpg`,
      alt: `Image ${i}`,
      category: 'interior' as const,
      size: { width: 1200, height: 800 },
      order: i + 1
    }));

    mockGalleryAutomation.loadAllGalleryImages.mockResolvedValue({
      images: manyImages,
      totalImagesFound: 50,
      scrollCyclesCompleted: 5,
      loadingTime: 15000,
      screenshots: [],
      errors: []
    });

    const result = await browserScraper.scrapeWithBrowserAutomation(mockVRBOUrl);

    expect(result.success).toBe(true);
    expect(result.data?.galleryImages).toHaveLength(50);
    expect(result.data?.galleryLoadingResult.loadingTime).toBe(15000);
  });

  it('should handle properties with slow loading', async () => {
    mockGalleryAutomation.loadAllGalleryImages.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        images: mockGalleryImages,
        totalImagesFound: 2,
        scrollCyclesCompleted: 3,
        loadingTime: 30000,
        screenshots: [],
        errors: ['Slow loading detected']
      }), 100))
    );

    const result = await browserScraper.scrapeWithBrowserAutomation(mockVRBOUrl);

    expect(result.success).toBe(true);
    expect(result.data?.galleryLoadingResult.errors).toContain('Slow loading detected');
  });
});