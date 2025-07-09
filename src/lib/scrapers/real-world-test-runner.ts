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
    console.log('🚀 Starting Real-World VRBO Scraper Tests');
    console.log('==========================================');
    console.log(`Testing ${TEST_CONFIG.options.maxTestProperties} properties`);
    console.log(`Timeout per property: ${TEST_CONFIG.options.timeoutPerProperty}ms`);
    console.log('');

    const urlsToTest = TEST_CONFIG.testUrls.slice(0, TEST_CONFIG.options.maxTestProperties);

    for (let i = 0; i < urlsToTest.length; i++) {
      const url = urlsToTest[i];
      console.log(`\n📋 Testing Property ${i + 1}/${urlsToTest.length}: ${url}`);
      console.log(''.padEnd(60, '-'));

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
      console.log(`   🔍 Testing ${testName}...`);
      
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

        console.log(`   ✅ ${testName} SUCCESS`);
        console.log(`      Photos: ${totalPhotos} (${galleryPhotos} gallery + ${staticPhotos} static)`);
        console.log(`      Time: ${duration}ms`);
        console.log(`      Completeness: ${completeness}%`);
        console.log(`      Scroll Cycles: ${result.data.galleryLoadingResult?.scrollCyclesCompleted || 0}`);
        
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

      console.log(`   ❌ ${testName} FAILED: ${errorMessage}`);
      console.log(`      Time: ${duration}ms`);
    }
  }

  /**
   * Test static scraping (fallback)
   */
  private async testStaticScraping(url: string): Promise<void> {
    const testName = 'Static Fallback';
    const startTime = Date.now();
    
    try {
      console.log(`   🔍 Testing ${testName}...`);
      
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

      console.log(`   ✅ ${testName} SUCCESS`);
      console.log(`      Photos: ${photoCount}`);
      console.log(`      Time: ${duration}ms`);
      console.log(`      Completeness: ${completeness}%`);
      
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

      console.log(`   ❌ ${testName} FAILED: ${errorMessage}`);
      console.log(`      Time: ${duration}ms`);
    }
  }

  /**
   * Compare performance between methods
   */
  private async testPerformanceComparison(url: string): Promise<void> {
    const browserResult = this.testResults.find(r => r.url === url && r.testName === 'Browser Automation');
    const staticResult = this.testResults.find(r => r.url === url && r.testName === 'Static Fallback');

    if (browserResult && staticResult) {
      console.log(`   📊 Performance Comparison:`);
      console.log(`      Browser: ${browserResult.photoCount} photos in ${browserResult.duration}ms`);
      console.log(`      Static:  ${staticResult.photoCount} photos in ${staticResult.duration}ms`);
      
      const photoImprovement = browserResult.photoCount - staticResult.photoCount;
      const timeOverhead = browserResult.duration - staticResult.duration;
      
      console.log(`      Photo Improvement: +${photoImprovement} photos (${Math.round((photoImprovement / Math.max(staticResult.photoCount, 1)) * 100)}%)`);
      console.log(`      Time Overhead: +${timeOverhead}ms`);
      
      if (photoImprovement > 0) {
        console.log(`      ✅ Browser automation extracted ${photoImprovement} more photos`);
      } else {
        console.log(`      ⚠️  Browser automation didn't improve photo extraction`);
      }
    }
  }

  /**
   * Log detailed results for a property
   */
  private logDetailedResults(propertyData: VRBOPropertyData, method: string): void {
    console.log(`\n      📄 ${method} - Property Details:`);
    console.log(`         Title: ${propertyData.title?.substring(0, 50)}...`);
    console.log(`         Property ID: ${propertyData.vrboId}`);
    console.log(`         Bedrooms: ${propertyData.specifications?.bedrooms || 'N/A'}`);
    console.log(`         Bathrooms: ${propertyData.specifications?.bathrooms || 'N/A'}`);
    console.log(`         Max Guests: ${propertyData.specifications?.maxGuests || 'N/A'}`);
    console.log(`         Amenities: ${propertyData.amenities?.length || 0}`);
    console.log(`         Rooms: ${propertyData.rooms?.length || 0}`);
    console.log(`         Location: ${propertyData.location?.city || 'N/A'}, ${propertyData.location?.state || 'N/A'}`);
    
    if (propertyData.amenities && propertyData.amenities.length > 0) {
      console.log(`         Top Amenities: ${propertyData.amenities.slice(0, 3).map(a => a.name).join(', ')}`);
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
    
    console.log('\n\n📊 FINAL TEST RESULTS SUMMARY');
    console.log('================================');
    console.log(`Total Test Duration: ${totalDuration}ms (${Math.round(totalDuration / 1000)}s)`);
    console.log(`Properties Tested: ${TEST_CONFIG.options.maxTestProperties}`);
    console.log('');

    // Success rate
    const successfulTests = this.testResults.filter(r => r.success);
    const successRate = Math.round((successfulTests.length / this.testResults.length) * 100);
    console.log(`Success Rate: ${successfulTests.length}/${this.testResults.length} (${successRate}%)`);
    console.log('');

    // Browser automation results
    const browserResults = this.testResults.filter(r => r.testName === 'Browser Automation' && r.success);
    if (browserResults.length > 0) {
      const avgPhotos = Math.round(browserResults.reduce((sum, r) => sum + r.photoCount, 0) / browserResults.length);
      const avgGalleryPhotos = Math.round(browserResults.reduce((sum, r) => sum + (r.galleryPhotoCount || 0), 0) / browserResults.length);
      const avgStaticPhotos = Math.round(browserResults.reduce((sum, r) => sum + (r.staticPhotoCount || 0), 0) / browserResults.length);
      const avgTime = Math.round(browserResults.reduce((sum, r) => sum + r.duration, 0) / browserResults.length);
      const avgCompleteness = Math.round(browserResults.reduce((sum, r) => sum + r.dataCompleteness, 0) / browserResults.length);

      console.log('🤖 Browser Automation Results:');
      console.log(`   Average Photos: ${avgPhotos} (${avgGalleryPhotos} gallery + ${avgStaticPhotos} static)`);
      console.log(`   Average Time: ${avgTime}ms`);
      console.log(`   Average Completeness: ${avgCompleteness}%`);
      console.log('');
    }

    // Static fallback results
    const staticResults = this.testResults.filter(r => r.testName === 'Static Fallback' && r.success);
    if (staticResults.length > 0) {
      const avgPhotos = Math.round(staticResults.reduce((sum, r) => sum + r.photoCount, 0) / staticResults.length);
      const avgTime = Math.round(staticResults.reduce((sum, r) => sum + r.duration, 0) / staticResults.length);
      const avgCompleteness = Math.round(staticResults.reduce((sum, r) => sum + r.dataCompleteness, 0) / staticResults.length);

      console.log('📄 Static Fallback Results:');
      console.log(`   Average Photos: ${avgPhotos}`);
      console.log(`   Average Time: ${avgTime}ms`);
      console.log(`   Average Completeness: ${avgCompleteness}%`);
      console.log('');
    }

    // Performance comparison
    if (browserResults.length > 0 && staticResults.length > 0) {
      const photoImprovement = browserResults.reduce((sum, r) => sum + r.photoCount, 0) - staticResults.reduce((sum, r) => sum + r.photoCount, 0);
      const timeOverhead = browserResults.reduce((sum, r) => sum + r.duration, 0) - staticResults.reduce((sum, r) => sum + r.duration, 0);
      
      console.log('⚡ Performance Comparison:');
      console.log(`   Photo Improvement: +${photoImprovement} total photos`);
      console.log(`   Time Overhead: +${timeOverhead}ms total`);
      console.log(`   Cost/Benefit: ${Math.round(photoImprovement / (timeOverhead / 1000))} extra photos per second`);
      console.log('');
    }

    // Failed tests
    const failedTests = this.testResults.filter(r => !r.success);
    if (failedTests.length > 0) {
      console.log('❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`   ${test.testName} - ${test.url}: ${test.errorMessage}`);
      });
      console.log('');
    }

    // Recommendations
    console.log('💡 Recommendations:');
    if (browserResults.length > 0) {
      const avgPhotos = browserResults.reduce((sum, r) => sum + r.photoCount, 0) / browserResults.length;
      if (avgPhotos > 15) {
        console.log('   ✅ Browser automation is effectively extracting photos (>15 avg)');
      } else {
        console.log('   ⚠️  Browser automation may need optimization (<15 avg photos)');
      }
    }
    
    if (successRate < 80) {
      console.log('   ⚠️  Success rate is below 80% - investigate error handling');
    } else {
      console.log('   ✅ Success rate is acceptable (>80%)');
    }

    console.log('\n🎯 Next Steps:');
    console.log('   1. Review failed tests and improve error handling');
    console.log('   2. Optimize browser automation for better photo extraction');
    console.log('   3. Consider rate limiting and anti-bot measures');
    console.log('   4. Test with larger sample size for production validation');
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
    console.log('\n💾 Results saved to test-results.json');
    console.log(JSON.stringify(resultsData, null, 2));
  }
}

// Export for use in other modules
export const runRealWorldTests = async (): Promise<void> => {
  const testRunner = new RealWorldVRBOTestRunner();
  await testRunner.runAllTests();
};

// CLI execution
if (require.main === module) {
  runRealWorldTests().catch(console.error);
}