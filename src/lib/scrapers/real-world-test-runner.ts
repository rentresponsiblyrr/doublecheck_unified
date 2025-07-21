// Real-World VRBO Scraper Test Runner
// Tests the scraper with actual VRBO URLs to validate functionality

import { scrapeVRBOProperty } from './vrbo-scraper';
import { scrapeBrowserVRBOProperty } from './vrbo-browser-scraper';
import { logger } from '../../utils/logger';
import type { VRBOPropertyData, PhotoData } from './types';

// Test Configuration
const TEST_CONFIG = {
  // Sample VRBO URLs for testing (replace with actual URLs)
  testUrls: [
    'https://www.vrbo.com/1234567', // House
    'https://www.vrbo.com/2345678', // Condo
    'https://www.vrbo.com/3456789', // Cabin
    'https://www.vrbo.com/4567890', // Large property
    'https://www.vrbo.com/5678901'  // Minimal property
  ],
  
  // Test options
  options: {
    maxTestProperties: 3,
    timeoutPerProperty: 120000, // 2 minutes
    enableDetailedLogging: true,
    saveResults: true,
    compareStatic: true
  }
};

interface TestResult {
  url: string;
  testName: string;
  success: boolean;
  duration: number;
  photoCount: number;
  galleryPhotoCount?: number;
  staticPhotoCount?: number;
  dataCompleteness: number;
  errorMessage?: string;
  propertyData?: VRBOPropertyData;
  metadata?: any;
}

export class RealWorldVRBOTestRunner {
  private testResults: TestResult[] = [];
  private startTime: number = Date.now();

  /**
   * Run all real-world tests
   */
  async runAllTests(): Promise<void> {

    const urlsToTest = TEST_CONFIG.testUrls.slice(0, TEST_CONFIG.options.maxTestProperties);

    for (let i = 0; i < urlsToTest.length; i++) {
      const url = urlsToTest[i];

      // Test 1: Browser Automation Scraping
      await this.testBrowserAutomation(url);

      // Test 2: Static Fallback Scraping
      if (TEST_CONFIG.options.compareStatic) {
        await this.testStaticScraping(url);
      }

      // Test 3: Performance Comparison
      await this.testPerformanceComparison(url);

      // Small delay between properties
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    this.printFinalResults();
  }

  /**
   * Test browser automation scraping
   */
  private async testBrowserAutomation(url: string): Promise<void> {
    const testName = 'Browser Automation';
    const startTime = Date.now();
    
    try {
      
      const result = await Promise.race([
        scrapeBrowserVRBOProperty(url, {
          useStaticFallback: true,
          headless: true,
          enableStealth: true,
          scrollCycles: 5,
          scrollWaitTime: 3000,
          browserTimeout: 60000,
          enableScreenshots: false,
          screenshotPath: './screenshots'
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), TEST_CONFIG.options.timeoutPerProperty)
        )
      ]) as any;

      const duration = Date.now() - startTime;

      if (result.success) {
        const totalPhotos = result.data.totalImages || 0;
        const galleryPhotos = result.data.galleryImages?.length || 0;
        const staticPhotos = result.data.staticImages?.length || 0;
        const completeness = this.calculateDataCompleteness(result.data.propertyData);

        this.testResults.push({
          url,
          testName,
          success: true,
          duration,
          photoCount: totalPhotos,
          galleryPhotoCount: galleryPhotos,
          staticPhotoCount: staticPhotos,
          dataCompleteness: completeness,
          propertyData: result.data.propertyData,
          metadata: result.metadata
        });

        
        if (TEST_CONFIG.options.enableDetailedLogging) {
          this.logDetailedResults(result.data.propertyData, 'Browser Automation');
        }
      } else {
        throw new Error(`Scraping failed: ${result.errors?.map(e => e.message).join(', ')}`);
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.testResults.push({
        url,
        testName,
        success: false,
        duration,
        photoCount: 0,
        dataCompleteness: 0,
        errorMessage
      });

    }
  }

  /**
   * Test static scraping (fallback)
   */
  private async testStaticScraping(url: string): Promise<void> {
    const testName = 'Static Fallback';
    const startTime = Date.now();
    
    try {
      
      const propertyData = await Promise.race([
        scrapeVRBOProperty(url),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout')), TEST_CONFIG.options.timeoutPerProperty)
        )
      ]) as VRBOPropertyData;

      const duration = Date.now() - startTime;
      const photoCount = propertyData.photos?.length || 0;
      const completeness = this.calculateDataCompleteness(propertyData);

      this.testResults.push({
        url,
        testName,
        success: true,
        duration,
        photoCount,
        dataCompleteness: completeness,
        propertyData
      });

      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.testResults.push({
        url,
        testName,
        success: false,
        duration,
        photoCount: 0,
        dataCompleteness: 0,
        errorMessage
      });

    }
  }

  /**
   * Compare performance between methods
   */
  private async testPerformanceComparison(url: string): Promise<void> {
    const browserResult = this.testResults.find(r => r.url === url && r.testName === 'Browser Automation');
    const staticResult = this.testResults.find(r => r.url === url && r.testName === 'Static Fallback');

    if (browserResult && staticResult) {
      
      const photoImprovement = browserResult.photoCount - staticResult.photoCount;
      const timeOverhead = browserResult.duration - staticResult.duration;
      
      
      if (photoImprovement > 0) {
      } else {
      }
    }
  }

  /**
   * Log detailed results for a property
   */
  private logDetailedResults(propertyData: VRBOPropertyData, method: string): void {
    
    if (propertyData.amenities && propertyData.amenities.length > 0) {
    }
  }

  /**
   * Calculate data completeness percentage
   */
  private calculateDataCompleteness(data: VRBOPropertyData): number {
    const requiredFields = ['title', 'description', 'amenities', 'photos', 'specifications', 'location'];
    const optionalFields = ['rooms', 'pricing', 'host', 'reviews'];
    
    let completedRequired = 0;
    let completedOptional = 0;

    requiredFields.forEach(field => {
      const value = data[field as keyof VRBOPropertyData];
      if (this.isFieldComplete(value)) {
        completedRequired++;
      }
    });

    optionalFields.forEach(field => {
      const value = data[field as keyof VRBOPropertyData];
      if (this.isFieldComplete(value)) {
        completedOptional++;
      }
    });

    const requiredScore = (completedRequired / requiredFields.length) * 80;
    const optionalScore = (completedOptional / optionalFields.length) * 20;

    return Math.round(requiredScore + optionalScore);
  }

  /**
   * Check if a field has meaningful content
   */
  private isFieldComplete(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  }

  /**
   * Print final test results
   */
  private printFinalResults(): void {
    const totalDuration = Date.now() - this.startTime;
    

    // Success rate
    const successfulTests = this.testResults.filter(r => r.success);
    const successRate = Math.round((successfulTests.length / this.testResults.length) * 100);

    // Browser automation results
    const browserResults = this.testResults.filter(r => r.testName === 'Browser Automation' && r.success);
    if (browserResults.length > 0) {
      const avgPhotos = Math.round(browserResults.reduce((sum, r) => sum + r.photoCount, 0) / browserResults.length);
      const avgGalleryPhotos = Math.round(browserResults.reduce((sum, r) => sum + (r.galleryPhotoCount || 0), 0) / browserResults.length);
      const avgStaticPhotos = Math.round(browserResults.reduce((sum, r) => sum + (r.staticPhotoCount || 0), 0) / browserResults.length);
      const avgTime = Math.round(browserResults.reduce((sum, r) => sum + r.duration, 0) / browserResults.length);
      const avgCompleteness = Math.round(browserResults.reduce((sum, r) => sum + r.dataCompleteness, 0) / browserResults.length);

    }

    // Static fallback results
    const staticResults = this.testResults.filter(r => r.testName === 'Static Fallback' && r.success);
    if (staticResults.length > 0) {
      const avgPhotos = Math.round(staticResults.reduce((sum, r) => sum + r.photoCount, 0) / staticResults.length);
      const avgTime = Math.round(staticResults.reduce((sum, r) => sum + r.duration, 0) / staticResults.length);
      const avgCompleteness = Math.round(staticResults.reduce((sum, r) => sum + r.dataCompleteness, 0) / staticResults.length);

    }

    // Performance comparison
    if (browserResults.length > 0 && staticResults.length > 0) {
      const photoImprovement = browserResults.reduce((sum, r) => sum + r.photoCount, 0) - staticResults.reduce((sum, r) => sum + r.photoCount, 0);
      const timeOverhead = browserResults.reduce((sum, r) => sum + r.duration, 0) - staticResults.reduce((sum, r) => sum + r.duration, 0);
      
    }

    // Failed tests
    const failedTests = this.testResults.filter(r => !r.success);
    if (failedTests.length > 0) {
      failedTests.forEach(test => {
      });
    }

    // Recommendations
    if (browserResults.length > 0) {
      const avgPhotos = browserResults.reduce((sum, r) => sum + r.photoCount, 0) / browserResults.length;
      if (avgPhotos > 15) {
      } else {
      }
    }
    
    if (successRate < 80) {
    } else {
    }

  }

  /**
   * Save results to file (if enabled)
   */
  private async saveResults(): Promise<void> {
    if (!TEST_CONFIG.options.saveResults) return;

    const resultsData = {
      timestamp: new Date().toISOString(),
      testConfig: TEST_CONFIG,
      results: this.testResults,
      summary: {
        totalDuration: Date.now() - this.startTime,
        successRate: Math.round((this.testResults.filter(r => r.success).length / this.testResults.length) * 100),
        averagePhotos: Math.round(this.testResults.reduce((sum, r) => sum + r.photoCount, 0) / this.testResults.length),
        averageTime: Math.round(this.testResults.reduce((sum, r) => sum + r.duration, 0) / this.testResults.length)
      }
    };

    // In a real implementation, you'd save to a file
  }
}

// Export for use in other modules
export const runRealWorldTests = async (): Promise<void> => {
  const testRunner = new RealWorldVRBOTestRunner();
  await testRunner.runAllTests();
};

// CLI execution
if (require.main === module) {
}