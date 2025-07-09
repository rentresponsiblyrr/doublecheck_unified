#!/usr/bin/env node

/**
 * Generate Test Data for STR Certified Staging Environment
 * 
 * This script creates realistic but fake data for testing the application
 * without exposing any production user data.
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Configuration
const config = {
  supabaseUrl: process.env.STAGING_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  supabaseKey: process.env.STAGING_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  dataSetSize: {
    properties: 100,
    users: 30,
    inspections: 150,
    checklistItems: 1000,
    media: 500,
    auditFeedback: 200,
    knowledgeBase: 50
  }
};

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseKey);

// Test data generators
const generators = {
  // Generate realistic property addresses
  generateAddress() {
    const streets = [
      'Main St', 'Oak Ave', 'Pine St', 'Maple Dr', 'Cedar Ln', 'Elm St',
      'Park Ave', 'First St', 'Second St', 'Washington St', 'Lincoln Ave',
      'Broadway', 'Church St', 'School St', 'Mill St', 'River Rd'
    ];
    
    const cities = [
      'San Francisco', 'Los Angeles', 'San Diego', 'Oakland', 'Sacramento',
      'Fresno', 'Long Beach', 'Santa Ana', 'Riverside', 'Stockton',
      'Fremont', 'Irvine', 'San Jose', 'Anaheim', 'Santa Rosa'
    ];
    
    const streetNumber = Math.floor(Math.random() * 9999) + 1;
    const street = streets[Math.floor(Math.random() * streets.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    
    return {
      address: `${streetNumber} ${street}`,
      city: city,
      state: 'CA',
      zipCode: (90000 + Math.floor(Math.random() * 9999)).toString()
    };
  },

  // Generate property data
  generateProperty() {
    const propertyTypes = ['house', 'apartment', 'condo', 'townhouse', 'villa'];
    const amenities = [
      'WiFi', 'Kitchen', 'Parking', 'Pool', 'Hot Tub', 'Air Conditioning',
      'Heating', 'Washer/Dryer', 'Dishwasher', 'BBQ Grill', 'Fireplace'
    ];
    
    const location = this.generateAddress();
    const type = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    const bedrooms = Math.floor(Math.random() * 5) + 1;
    const bathrooms = Math.floor(Math.random() * 3) + 1;
    const sqft = Math.floor(Math.random() * 2000) + 800;
    
    // Generate some sample amenities
    const selectedAmenities = amenities
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 6) + 3)
      .map(name => ({
        name,
        category: name.includes('Kitchen') ? 'kitchen' : 
                 name.includes('Pool') || name.includes('Hot Tub') ? 'outdoor' :
                 name.includes('WiFi') ? 'connectivity' : 'general',
        priority: Math.random() > 0.7 ? 'essential' : 'important'
      }));

    return {
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} at ${location.address}`,
      address: location.address,
      city: location.city,
      state: location.state,
      zip_code: location.zipCode,
      type: type,
      bedrooms: bedrooms,
      bathrooms: bathrooms,
      sqft: sqft,
      max_guests: bedrooms * 2,
      vrbo_url: `https://www.vrbo.com/test-${crypto.randomUUID().slice(0, 8)}`,
      airbnb_url: `https://www.airbnb.com/rooms/test-${crypto.randomUUID().slice(0, 8)}`,
      scraped_data: {
        images: [
          `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`,
          `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`,
          `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`
        ],
        amenities: selectedAmenities,
        description: `Beautiful ${type} with ${bedrooms} bedrooms and ${bathrooms} bathrooms. Perfect for families or groups.`,
        pricing: {
          base_rate: Math.floor(Math.random() * 300) + 100,
          cleaning_fee: Math.floor(Math.random() * 100) + 50
        }
      }
    };
  },

  // Generate user data
  generateUser(role = 'inspector') {
    const firstNames = [
      'John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Chris', 'Emma',
      'James', 'Ashley', 'Robert', 'Jessica', 'William', 'Amanda', 'Michael'
    ];
    
    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
      'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez'
    ];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@staging.test`;
    
    return {
      id: crypto.randomUUID(),
      email: email,
      name: `${firstName} ${lastName}`,
      role: role,
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      is_active: Math.random() > 0.1, // 90% active users
      last_login: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  },

  // Generate inspection data
  generateInspection(propertyId, inspectorId) {
    const statuses = ['draft', 'in_progress', 'completed', 'pending_review', 'approved', 'rejected'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const startTime = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
    const endTime = status === 'completed' || status === 'pending_review' || status === 'approved' || status === 'rejected'
      ? new Date(startTime.getTime() + Math.random() * 4 * 60 * 60 * 1000) // 0-4 hours later
      : null;

    return {
      id: crypto.randomUUID(),
      property_id: propertyId,
      inspector_id: inspectorId,
      status: status,
      start_time: startTime.toISOString(),
      end_time: endTime?.toISOString() || null,
      notes: status === 'completed' ? 'Inspection completed successfully' : null,
      weather_conditions: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)],
      ai_analysis_summary: status === 'completed' || status === 'pending_review' ? {
        overall_score: Math.floor(Math.random() * 40) + 60, // 60-100
        confidence_average: Math.random() * 0.3 + 0.7, // 0.7-1.0
        total_items: Math.floor(Math.random() * 20) + 10,
        completed_items: Math.floor(Math.random() * 15) + 8,
        photo_count: Math.floor(Math.random() * 30) + 10,
        video_count: Math.floor(Math.random() * 3) + 1,
        issues_count: Math.floor(Math.random() * 5)
      } : null
    };
  },

  // Generate checklist items
  generateChecklistItem(inspectionId) {
    const categories = ['safety', 'kitchen', 'bathrooms', 'bedrooms', 'general'];
    const titles = {
      safety: ['Smoke Detector Check', 'Carbon Monoxide Detector', 'Fire Extinguisher', 'Emergency Exits', 'First Aid Kit'],
      kitchen: ['Appliance Functionality', 'Cleanliness', 'Utensils Available', 'Dishwasher Working', 'Refrigerator Clean'],
      bathrooms: ['Water Pressure', 'Hot Water', 'Cleanliness', 'Towels Provided', 'Toilet Paper Stock'],
      bedrooms: ['Bed Quality', 'Linens Clean', 'Lighting', 'Closet Space', 'Window Operation'],
      general: ['WiFi Working', 'Heating/Cooling', 'Cleanliness', 'Check-in Instructions', 'Property Access']
    };
    
    const category = categories[Math.floor(Math.random() * categories.length)];
    const categoryTitles = titles[category];
    const title = categoryTitles[Math.floor(Math.random() * categoryTitles.length)];
    
    const statuses = ['pending', 'completed', 'failed', 'not_applicable'];
    const aiStatuses = ['pending', 'pass', 'fail', 'needs_review'];
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const aiStatus = status === 'completed' ? aiStatuses[Math.floor(Math.random() * aiStatuses.length)] : null;

    return {
      id: crypto.randomUUID(),
      inspection_id: inspectionId,
      title: title,
      description: `Verify ${title.toLowerCase()} meets standards`,
      category: category,
      required: Math.random() > 0.3, // 70% required
      status: status,
      ai_status: aiStatus,
      ai_confidence: aiStatus ? Math.random() * 0.4 + 0.6 : null, // 0.6-1.0
      ai_reasoning: aiStatus ? `AI analysis suggests ${aiStatus}` : null,
      order: Math.floor(Math.random() * 100),
      priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      room_type: category === 'general' ? null : category,
      gpt_prompt: `Analyze this ${category} area for compliance and quality standards`,
      reference_photo: Math.random() > 0.5 ? `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000)}` : null,
      notes: status === 'completed' ? 'Item completed successfully' : null
    };
  },

  // Generate knowledge base entries
  generateKnowledgeEntry() {
    const categories = ['safety_regulation', 'best_practice', 'compliance_rule', 'maintenance_guide'];
    const sources = ['STR Regulations 2024', 'Safety Standards Manual', 'Best Practices Guide', 'Compliance Handbook'];
    
    const category = categories[Math.floor(Math.random() * categories.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    
    const titles = {
      safety_regulation: [
        'Smoke Detector Requirements',
        'Carbon Monoxide Safety Standards',
        'Emergency Exit Regulations',
        'Fire Safety Equipment'
      ],
      best_practice: [
        'Property Cleanliness Standards',
        'Guest Communication Guidelines',
        'Maintenance Scheduling',
        'Quality Assurance Procedures'
      ],
      compliance_rule: [
        'Local Zoning Requirements',
        'Business License Requirements',
        'Tax Compliance Rules',
        'Insurance Requirements'
      ],
      maintenance_guide: [
        'HVAC System Maintenance',
        'Plumbing Maintenance Guide',
        'Electrical Safety Checks',
        'Appliance Care Instructions'
      ]
    };
    
    const categoryTitles = titles[category];
    const title = categoryTitles[Math.floor(Math.random() * categoryTitles.length)];
    
    const content = `This is detailed information about ${title.toLowerCase()}. ` +
      'It includes important guidelines, requirements, and best practices that must be followed. ' +
      'Regular compliance with these standards ensures safety and quality for all guests.';

    return {
      id: crypto.randomUUID(),
      title: title,
      content: content,
      category: category,
      source: source,
      version: '1.0',
      effective_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      tags: [category, 'compliance', 'standards'],
      query_count: Math.floor(Math.random() * 100),
      relevance_score: Math.random() * 0.3 + 0.7, // 0.7-1.0
      citation_count: Math.floor(Math.random() * 20),
      // Note: embedding will be generated when inserted
      embedding: null
    };
  }
};

// Data insertion functions
async function insertTestData() {
  console.log('🚀 Starting test data generation for STR Certified staging...\n');
  
  try {
    // Clear existing test data
    console.log('🧹 Cleaning up existing test data...');
    await cleanupTestData();
    
    // Generate and insert users
    console.log('👥 Generating users...');
    const users = [];
    
    // Create inspectors
    for (let i = 0; i < config.dataSetSize.users * 0.7; i++) {
      users.push(generators.generateUser('inspector'));
    }
    
    // Create auditors
    for (let i = 0; i < config.dataSetSize.users * 0.3; i++) {
      users.push(generators.generateUser('auditor'));
    }
    
    const { data: insertedUsers, error: usersError } = await supabase
      .from('users')
      .insert(users)
      .select('id, role');
    
    if (usersError) {
      console.error('Error inserting users:', usersError);
      throw usersError;
    }
    
    console.log(`✅ Created ${insertedUsers.length} users`);
    
    // Generate and insert properties
    console.log('🏠 Generating properties...');
    const properties = [];
    
    for (let i = 0; i < config.dataSetSize.properties; i++) {
      properties.push(generators.generateProperty());
    }
    
    const { data: insertedProperties, error: propertiesError } = await supabase
      .from('properties')
      .insert(properties)
      .select('id');
    
    if (propertiesError) {
      console.error('Error inserting properties:', propertiesError);
      throw propertiesError;
    }
    
    console.log(`✅ Created ${insertedProperties.length} properties`);
    
    // Generate and insert inspections
    console.log('📋 Generating inspections...');
    const inspections = [];
    const inspectors = insertedUsers.filter(u => u.role === 'inspector');
    
    for (let i = 0; i < config.dataSetSize.inspections; i++) {
      const propertyId = insertedProperties[Math.floor(Math.random() * insertedProperties.length)].id;
      const inspectorId = inspectors[Math.floor(Math.random() * inspectors.length)].id;
      inspections.push(generators.generateInspection(propertyId, inspectorId));
    }
    
    const { data: insertedInspections, error: inspectionsError } = await supabase
      .from('inspections')
      .insert(inspections)
      .select('id');
    
    if (inspectionsError) {
      console.error('Error inserting inspections:', inspectionsError);
      throw inspectionsError;
    }
    
    console.log(`✅ Created ${insertedInspections.length} inspections`);
    
    // Generate and insert checklist items
    console.log('📝 Generating checklist items...');
    const checklistItems = [];
    
    for (const inspection of insertedInspections) {
      const itemCount = Math.floor(Math.random() * 10) + 5; // 5-15 items per inspection
      for (let i = 0; i < itemCount; i++) {
        checklistItems.push(generators.generateChecklistItem(inspection.id));
      }
    }
    
    const { data: insertedChecklistItems, error: checklistError } = await supabase
      .from('checklist_items')
      .insert(checklistItems.slice(0, config.dataSetSize.checklistItems))
      .select('id');
    
    if (checklistError) {
      console.error('Error inserting checklist items:', checklistError);
      throw checklistError;
    }
    
    console.log(`✅ Created ${insertedChecklistItems.length} checklist items`);
    
    // Generate and insert knowledge base entries
    console.log('📚 Generating knowledge base...');
    const knowledgeEntries = [];
    
    for (let i = 0; i < config.dataSetSize.knowledgeBase; i++) {
      knowledgeEntries.push(generators.generateKnowledgeEntry());
    }
    
    const { data: insertedKnowledge, error: knowledgeError } = await supabase
      .from('knowledge_base')
      .insert(knowledgeEntries)
      .select('id');
    
    if (knowledgeError) {
      console.error('Error inserting knowledge base:', knowledgeError);
      throw knowledgeError;
    }
    
    console.log(`✅ Created ${insertedKnowledge.length} knowledge base entries`);
    
    console.log('\n🎉 Test data generation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${insertedUsers.length}`);
    console.log(`   Properties: ${insertedProperties.length}`);
    console.log(`   Inspections: ${insertedInspections.length}`);
    console.log(`   Checklist Items: ${insertedChecklistItems.length}`);
    console.log(`   Knowledge Base: ${insertedKnowledge.length}`);
    
  } catch (error) {
    console.error('❌ Error generating test data:', error);
    process.exit(1);
  }
}

async function cleanupTestData() {
  try {
    // Delete in reverse order of dependencies
    await supabase.from('auditor_feedback').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('media_files').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('checklist_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('inspections').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('properties').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('knowledge_base').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Note: We don't delete users as they might be needed for auth testing
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.warn('⚠️  Cleanup warning (expected for fresh database):', error.message);
  }
}

// Main execution
if (require.main === module) {
  // Validate configuration
  if (!config.supabaseUrl || !config.supabaseKey) {
    console.error('❌ Missing Supabase configuration. Please set STAGING_SUPABASE_URL and STAGING_SUPABASE_ANON_KEY environment variables.');
    process.exit(1);
  }
  
  insertTestData()
    .then(() => {
      console.log('\n✨ All done! Your staging environment is ready for testing.');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = {
  insertTestData,
  cleanupTestData,
  generators
};