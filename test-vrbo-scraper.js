#!/usr/bin/env node

// Simple test script to validate VRBO scraper with real URLs
// Usage: node test-vrbo-scraper.js [vrbo-url]

const { scrapeVRBOProperty } = require('./dist/lib/scrapers/vrbo-scraper.js');

// Test URLs (replace with real VRBO URLs for testing)
const TEST_URLS = [
  'https://www.vrbo.com/1234567', // Example - replace with real URL
  'https://www.vrbo.com/2345678', // Example - replace with real URL
  'https://www.vrbo.com/3456789'  // Example - replace with real URL
];

async function testSingleProperty(url) {
  console.log(`\n🔍 Testing VRBO Scraper with: ${url}`);
  console.log(''.padEnd(60, '-'));
  
  const startTime = Date.now();
  
  try {
    // Test the scraper
    const propertyData = await scrapeVRBOProperty(url);
    const duration = Date.now() - startTime;
    
    console.log('✅ SUCCESS!');
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📄 Property: ${propertyData.title}`);
    console.log(`🏠 Property ID: ${propertyData.vrboId}`);
    console.log(`🛏️  Bedrooms: ${propertyData.specifications?.bedrooms || 'N/A'}`);
    console.log(`🚿 Bathrooms: ${propertyData.specifications?.bathrooms || 'N/A'}`);
    console.log(`👥 Max Guests: ${propertyData.specifications?.maxGuests || 'N/A'}`);
    console.log(`📍 Location: ${propertyData.location?.city || 'N/A'}, ${propertyData.location?.state || 'N/A'}`);
    console.log(`🏷️  Amenities: ${propertyData.amenities?.length || 0}`);
    console.log(`📸 Photos: ${propertyData.photos?.length || 0}`);
    console.log(`🏠 Rooms: ${propertyData.rooms?.length || 0}`);
    
    if (propertyData.amenities && propertyData.amenities.length > 0) {
      console.log(`🎯 Top Amenities: ${propertyData.amenities.slice(0, 5).map(a => a.name).join(', ')}`);
    }
    
    if (propertyData.photos && propertyData.photos.length > 0) {
      console.log(`📷 Sample Photos:`);
      propertyData.photos.slice(0, 3).forEach((photo, index) => {
        console.log(`   ${index + 1}. ${photo}`);
      });
    }
    
    // Calculate completeness
    const completeness = calculateDataCompleteness(propertyData);
    console.log(`📊 Data Completeness: ${completeness}%`);
    
    return {
      success: true,
      duration,
      photoCount: propertyData.photos?.length || 0,
      completeness,
      propertyData
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log('❌ FAILED!');
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`💥 Error: ${error.message}`);
    
    return {
      success: false,
      duration,
      error: error.message
    };
  }
}

function calculateDataCompleteness(data) {
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

function isFieldComplete(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

async function main() {
  console.log('🚀 VRBO Scraper Test Runner');
  console.log('============================');
  
  // Get URL from command line or use test URLs
  const testUrl = process.argv[2];
  const urlsToTest = testUrl ? [testUrl] : TEST_URLS;
  
  console.log(`Testing ${urlsToTest.length} URLs...`);
  
  const results = [];
  
  for (const url of urlsToTest) {
    const result = await testSingleProperty(url);
    results.push({ url, ...result });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n📊 SUMMARY');
  console.log('===========');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    const avgPhotos = Math.round(successful.reduce((sum, r) => sum + r.photoCount, 0) / successful.length);
    const avgTime = Math.round(successful.reduce((sum, r) => sum + r.duration, 0) / successful.length);
    const avgCompleteness = Math.round(successful.reduce((sum, r) => sum + r.completeness, 0) / successful.length);
    
    console.log(`📸 Average Photos: ${avgPhotos}`);
    console.log(`⏱️  Average Time: ${avgTime}ms`);
    console.log(`📊 Average Completeness: ${avgCompleteness}%`);
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    failed.forEach(f => {
      console.log(`   ${f.url}: ${f.error}`);
    });
  }
  
  console.log('\n💡 To test with a specific URL:');
  console.log('   node test-vrbo-scraper.js https://www.vrbo.com/1234567');
}

// Check if this is being run directly
if (require.main === module) {
  main().catch(console.error);
} else {
  module.exports = { testSingleProperty, calculateDataCompleteness };
}