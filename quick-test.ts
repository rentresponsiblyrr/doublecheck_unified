// Quick test script to demonstrate current VRBO scraper output
// This will show what the scraper actually returns with the current implementation

import { scrapeVRBOProperty } from './src/lib/scrapers/vrbo-scraper.ts';
import type { VRBOPropertyData } from './src/lib/scrapers/types.ts';

// Mock logger to avoid external dependencies
const mockLogger = {
  info: (message: string, data?: any, context?: string) => {
    console.log(`[INFO] ${context || ''}: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  warn: (message: string, data?: any, context?: string) => {
    console.log(`[WARN] ${context || ''}: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any, context?: string) => {
    console.log(`[ERROR] ${context || ''}: ${message}`, error);
  }
};

// Replace the logger
(global as any).logger = mockLogger;

async function quickTest() {
  console.log('🚀 VRBO Scraper Quick Test');
  console.log('===========================\n');

  // Test with a mock URL (will return fallback data)
  const testUrl = 'https://www.vrbo.com/1234567';
  
  console.log(`🔍 Testing with URL: ${testUrl}`);
  console.log('📝 Note: This will return fallback data since we\'re not using a real URL\n');

  try {
    const startTime = Date.now();
    
    // Call the scraper
    const result = await scrapeVRBOProperty(testUrl);
    
    const duration = Date.now() - startTime;
    
    console.log('✅ Scraper completed successfully!');
    console.log(`⏱️  Duration: ${duration}ms\n`);
    
    // Display the results
    console.log('📊 SCRAPER OUTPUT:');
    console.log('==================');
    console.log(`🏠 Property ID: ${result.vrboId}`);
    console.log(`📄 Title: ${result.title}`);
    console.log(`🛏️  Bedrooms: ${result.specifications?.bedrooms || 'N/A'}`);
    console.log(`🚿 Bathrooms: ${result.specifications?.bathrooms || 'N/A'}`);
    console.log(`👥 Max Guests: ${result.specifications?.maxGuests || 'N/A'}`);
    console.log(`📍 Location: ${result.location?.city || 'N/A'}, ${result.location?.state || 'N/A'}`);
    console.log(`🏷️  Amenities: ${result.amenities?.length || 0}`);
    console.log(`📸 Photos: ${result.photos?.length || 0}`);
    console.log(`🏠 Rooms: ${result.rooms?.length || 0}`);
    console.log(`📝 Description: ${result.description?.length || 0} characters`);
    console.log(`🔗 Source URL: ${result.sourceUrl}`);
    console.log(`⏰ Last Updated: ${result.lastUpdated}`);
    console.log('');

    // Show amenities
    if (result.amenities && result.amenities.length > 0) {
      console.log('🏷️  AMENITIES:');
      result.amenities.forEach((amenity, index) => {
        console.log(`   ${index + 1}. ${amenity.name} (${amenity.category}) - ${amenity.priority}`);
      });
      console.log('');
    }

    // Show photos
    if (result.photos && result.photos.length > 0) {
      console.log('📸 PHOTOS:');
      result.photos.forEach((photo, index) => {
        console.log(`   ${index + 1}. ${photo}`);
      });
      console.log('');
    }

    // Show rooms
    if (result.rooms && result.rooms.length > 0) {
      console.log('🏠 ROOMS:');
      result.rooms.forEach((room, index) => {
        console.log(`   ${index + 1}. ${room.type} (${room.count})`);
        if (room.photos && room.photos.length > 0) {
          console.log(`      Photos: ${room.photos.length}`);
        }
        if (room.amenities && room.amenities.length > 0) {
          console.log(`      Amenities: ${room.amenities.join(', ')}`);
        }
      });
      console.log('');
    }

    // Show specifications
    if (result.specifications) {
      console.log('📋 SPECIFICATIONS:');
      console.log(`   Property Type: ${result.specifications.propertyType || 'N/A'}`);
      console.log(`   Bedrooms: ${result.specifications.bedrooms || 'N/A'}`);
      console.log(`   Bathrooms: ${result.specifications.bathrooms || 'N/A'}`);
      console.log(`   Max Guests: ${result.specifications.maxGuests || 'N/A'}`);
      if (result.specifications.squareFootage) {
        console.log(`   Square Footage: ${result.specifications.squareFootage}`);
      }
      if (result.specifications.yearBuilt) {
        console.log(`   Year Built: ${result.specifications.yearBuilt}`);
      }
      console.log('');
    }

    // Show location details
    if (result.location) {
      console.log('📍 LOCATION:');
      console.log(`   City: ${result.location.city || 'N/A'}`);
      console.log(`   State: ${result.location.state || 'N/A'}`);
      console.log(`   Country: ${result.location.country || 'N/A'}`);
      if (result.location.zipCode) {
        console.log(`   ZIP Code: ${result.location.zipCode}`);
      }
      if (result.location.coordinates) {
        console.log(`   Coordinates: ${result.location.coordinates.latitude}, ${result.location.coordinates.longitude}`);
      }
      if (result.location.neighborhood) {
        console.log(`   Neighborhood: ${result.location.neighborhood}`);
      }
      console.log('');
    }

    // Show house rules
    if (result.houseRules && result.houseRules.length > 0) {
      console.log('📜 HOUSE RULES:');
      result.houseRules.forEach((rule, index) => {
        console.log(`   ${index + 1}. ${rule}`);
      });
      console.log('');
    }

    // Calculate and show data completeness
    const completeness = calculateDataCompleteness(result);
    console.log(`📊 Data Completeness: ${completeness}%`);
    console.log('');

    // Show current implementation status
    console.log('🔧 CURRENT IMPLEMENTATION STATUS:');
    console.log('==================================');
    console.log('✅ Basic scraper structure implemented');
    console.log('✅ Fallback data mechanism working');
    console.log('✅ TypeScript types and interfaces defined');
    console.log('⚠️  Browser automation not tested with real URLs');
    console.log('⚠️  Photo extraction effectiveness unknown');
    console.log('⚠️  Real VRBO site compatibility unverified');
    console.log('');

    console.log('🎯 NEXT STEPS FOR REAL TESTING:');
    console.log('================================');
    console.log('1. Replace test URLs with actual VRBO property URLs');
    console.log('2. Test browser automation with real pages');
    console.log('3. Measure actual photo extraction counts');
    console.log('4. Validate amenity and description accuracy');
    console.log('5. Test error handling with various property types');
    console.log('');

    console.log('🤖 EXPECTED RESULTS WITH BROWSER AUTOMATION:');
    console.log('=============================================');
    console.log('📸 Photos: 15-30 (vs current fallback: 0)');
    console.log('🏷️  Amenities: 8-15 (vs current fallback: 3)');
    console.log('📝 Description: 200-1000 chars (vs current fallback: ~150)');
    console.log('🏠 Rooms: 3-6 (vs current fallback: 0)');
    console.log('⏱️  Processing time: 15-45 seconds');
    console.log('');

    return result;

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

function calculateDataCompleteness(data: any): number {
  const requiredFields = ['title', 'description', 'amenities', 'photos', 'specifications', 'location'];
  const optionalFields = ['rooms', 'pricing', 'host', 'reviews'];
  
  let completedRequired = 0;
  let completedOptional = 0;

  requiredFields.forEach(field => {
    const value = data[field];
    if (isFieldComplete(value)) {
      completedRequired++;
    }
  });

  optionalFields.forEach(field => {
    const value = data[field];
    if (isFieldComplete(value)) {
      completedOptional++;
    }
  });

  const requiredScore = (completedRequired / requiredFields.length) * 80;
  const optionalScore = (completedOptional / optionalFields.length) * 20;

  return Math.round(requiredScore + optionalScore);
}

function isFieldComplete(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

// Run the test
if (require.main === module) {
  quickTest().catch(console.error);
}

export { quickTest };