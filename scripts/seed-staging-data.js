#!/usr/bin/env node

/**
 * Seed Staging Data for STR Certified
 * 
 * This script seeds the staging database with essential data needed for testing,
 * including categories, static checklist items, and initial configurations.
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Configuration
const config = {
  supabaseUrl: process.env.STAGING_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  supabaseKey: process.env.STAGING_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
};

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseKey);

// Seed data definitions
const seedData = {
  // Categories for checklist items
  categories: [
    {
      id: crypto.randomUUID(),
      name: 'Safety',
      description: 'Safety-related inspection items',
      color_class: 'bg-red-100 text-red-800',
      icon_name: 'shield',
      sort_order: 1,
      is_active: true
    },
    {
      id: crypto.randomUUID(),
      name: 'Kitchen',
      description: 'Kitchen and dining area inspection',
      color_class: 'bg-orange-100 text-orange-800',
      icon_name: 'utensils',
      sort_order: 2,
      is_active: true
    },
    {
      id: crypto.randomUUID(),
      name: 'Bathrooms',
      description: 'Bathroom facilities inspection',
      color_class: 'bg-blue-100 text-blue-800',
      icon_name: 'shower',
      sort_order: 3,
      is_active: true
    },
    {
      id: crypto.randomUUID(),
      name: 'Bedrooms',
      description: 'Bedroom and sleeping area inspection',
      color_class: 'bg-purple-100 text-purple-800',
      icon_name: 'bed',
      sort_order: 4,
      is_active: true
    },
    {
      id: crypto.randomUUID(),
      name: 'Living Areas',
      description: 'Living room and common areas',
      color_class: 'bg-green-100 text-green-800',
      icon_name: 'sofa',
      sort_order: 5,
      is_active: true
    },
    {
      id: crypto.randomUUID(),
      name: 'Outdoor',
      description: 'Outdoor spaces and amenities',
      color_class: 'bg-teal-100 text-teal-800',
      icon_name: 'tree',
      sort_order: 6,
      is_active: true
    },
    {
      id: crypto.randomUUID(),
      name: 'General',
      description: 'General property inspection items',
      color_class: 'bg-gray-100 text-gray-800',
      icon_name: 'home',
      sort_order: 7,
      is_active: true
    }
  ],

  // Static safety items that should be on every inspection
  staticSafetyItems: [
    {
      id: crypto.randomUUID(),
      label: 'Smoke Detector Functionality',
      description: 'Verify smoke detectors are installed and functioning in all required areas',
      category: 'Safety',
      priority: 'critical',
      required: true,
      estimated_time_minutes: 5,
      gpt_prompt: 'Analyze this photo to verify smoke detector is present, properly mounted, and appears to be in working condition. Look for indicator lights, proper placement, and any visible damage.',
      reference_photo: null,
      compliance_notes: 'Required by law in all sleeping areas and hallways',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      label: 'Carbon Monoxide Detector Check',
      description: 'Verify CO detectors are installed near sleeping areas and fuel-burning appliances',
      category: 'Safety',
      priority: 'critical',
      required: true,
      estimated_time_minutes: 3,
      gpt_prompt: 'Check if carbon monoxide detector is present and properly placed. Look for digital display or indicator lights showing the unit is operational.',
      reference_photo: null,
      compliance_notes: 'Required within 15 feet of sleeping areas in properties with fuel-burning appliances',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      label: 'Fire Extinguisher Availability',
      description: 'Check that fire extinguisher is accessible and properly maintained',
      category: 'Safety',
      priority: 'high',
      required: true,
      estimated_time_minutes: 2,
      gpt_prompt: 'Verify fire extinguisher is present, properly mounted, and check the pressure gauge is in the green zone. Look for any damage or obstruction.',
      reference_photo: null,
      compliance_notes: 'Recommended in kitchen area and easily accessible location',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      label: 'Emergency Exit Accessibility',
      description: 'Ensure all emergency exits are clearly marked and unobstructed',
      category: 'Safety',
      priority: 'high',
      required: true,
      estimated_time_minutes: 5,
      gpt_prompt: 'Check that exit routes are clear of obstructions, doors open easily, and emergency lighting is functional if present.',
      reference_photo: null,
      compliance_notes: 'All exits must be clearly marked and unobstructed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      label: 'First Aid Kit Availability',
      description: 'Verify first aid kit is accessible and properly stocked',
      category: 'Safety',
      priority: 'medium',
      required: false,
      estimated_time_minutes: 2,
      gpt_prompt: 'Check if first aid kit is present and appears to be properly stocked with basic medical supplies.',
      reference_photo: null,
      compliance_notes: 'Recommended for all short-term rental properties',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],

  // AI model versions for tracking
  aiModelVersions: [
    {
      id: crypto.randomUUID(),
      version: 'gpt-4-vision-preview',
      model_type: 'photo_analysis',
      description: 'OpenAI GPT-4 Vision for photo analysis',
      deployment_date: new Date().toISOString(),
      configuration: {
        max_tokens: 1000,
        temperature: 0.3,
        model_name: 'gpt-4-vision-preview'
      },
      performance_baseline: {
        accuracy: 0.85,
        confidence_threshold: 0.7,
        processing_time_ms: 2000
      },
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      version: 'text-embedding-3-small',
      model_type: 'embedding',
      description: 'OpenAI text embedding model for semantic search',
      deployment_date: new Date().toISOString(),
      configuration: {
        dimensions: 1536,
        model_name: 'text-embedding-3-small'
      },
      performance_baseline: {
        accuracy: 0.92,
        processing_time_ms: 500
      },
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],

  // Context patterns for CAG
  cagContextPatterns: [
    {
      id: crypto.randomUUID(),
      pattern_name: 'luxury_property_focus',
      description: 'Emphasize high-end finishes and premium amenities for luxury properties',
      conditions: {
        property: {
          type: ['luxury', 'villa', 'penthouse'],
          value_range: { min: 500000 }
        }
      },
      context_modifications: {
        emphasis: ['high_end_finishes', 'premium_amenities', 'concierge_services'],
        additional_checks: ['artwork_security', 'luxury_appliances', 'premium_linens']
      },
      weight: 1.5,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      pattern_name: 'seasonal_heating_focus',
      description: 'Emphasize heating systems during winter months',
      conditions: {
        temporal: {
          months: [11, 12, 1, 2, 3]
        }
      },
      context_modifications: {
        emphasis: ['heating_systems', 'insulation', 'weatherproofing'],
        priority_adjustments: {
          heating: 1.8,
          insulation: 1.5
        }
      },
      weight: 1.3,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      pattern_name: 'pet_friendly_considerations',
      description: 'Additional checks for pet-friendly properties',
      conditions: {
        property: {
          amenities: {
            includes: ['pet_friendly', 'dog_park', 'pet_amenities']
          }
        }
      },
      context_modifications: {
        emphasis: ['pet_safety', 'yard_security', 'pet_amenities'],
        additional_checks: ['fence_integrity', 'pet_waste_stations', 'pet_cleaning_supplies']
      },
      weight: 1.2,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],

  // Sample knowledge base entries
  knowledgeBaseEntries: [
    {
      id: crypto.randomUUID(),
      title: 'Smoke Detector Placement Requirements',
      content: 'Smoke detectors must be installed in each sleeping room, outside each sleeping area in the immediate vicinity of the bedrooms, and on each level of the dwelling. They should be mounted on the ceiling at least 4 inches from the nearest wall, or on the wall between 4 and 12 inches from the ceiling.',
      category: 'safety_regulation',
      source: 'NFPA 72 National Fire Alarm Code',
      version: '2024',
      effective_date: '2024-01-01',
      tags: ['smoke_detector', 'fire_safety', 'placement', 'regulation'],
      query_count: 0,
      relevance_score: 1.0,
      citation_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      title: 'Kitchen Safety Standards for Short-Term Rentals',
      content: 'Kitchen areas must be equipped with proper ventilation, fire suppression capabilities, and safe electrical systems. All appliances should be in working order with clear operating instructions provided to guests. GFCI outlets are required near water sources.',
      category: 'safety_regulation',
      source: 'STR Safety Guidelines 2024',
      version: '2024',
      effective_date: '2024-01-01',
      tags: ['kitchen', 'safety', 'appliances', 'electrical'],
      query_count: 0,
      relevance_score: 1.0,
      citation_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      title: 'Bathroom Safety and Accessibility Guidelines',
      content: 'Bathrooms must have proper ventilation, slip-resistant surfaces, and GFCI protection for all electrical outlets. Grab bars are recommended near tubs and showers. Water temperature should be regulated to prevent scalding.',
      category: 'best_practice',
      source: 'STR Best Practices Manual',
      version: '2024',
      effective_date: '2024-01-01',
      tags: ['bathroom', 'safety', 'accessibility', 'ventilation'],
      query_count: 0,
      relevance_score: 1.0,
      citation_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
};

// Insert seed data
async function seedStagingData() {
  console.log('🌱 Seeding staging database with essential data...\n');
  
  try {
    // Insert categories
    console.log('📂 Inserting categories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .upsert(seedData.categories, { onConflict: 'name' })
      .select('id, name');
    
    if (categoriesError) {
      console.error('Error inserting categories:', categoriesError);
      throw categoriesError;
    }
    
    console.log(`✅ Created ${categories.length} categories`);
    
    // Insert static safety items
    console.log('🛡️  Inserting static safety items...');
    const { data: safetyItems, error: safetyError } = await supabase
      .from('static_safety_items')
      .upsert(seedData.staticSafetyItems, { onConflict: 'label' })
      .select('id, label');
    
    if (safetyError) {
      console.error('Error inserting safety items:', safetyError);
      throw safetyError;
    }
    
    console.log(`✅ Created ${safetyItems.length} static safety items`);
    
    // Insert AI model versions
    console.log('🤖 Inserting AI model versions...');
    const { data: modelVersions, error: modelError } = await supabase
      .from('ai_model_versions')
      .upsert(seedData.aiModelVersions, { onConflict: 'version,model_type' })
      .select('id, version, model_type');
    
    if (modelError) {
      console.error('Error inserting AI model versions:', modelError);
      throw modelError;
    }
    
    console.log(`✅ Created ${modelVersions.length} AI model versions`);
    
    // Insert CAG context patterns
    console.log('🎯 Inserting CAG context patterns...');
    const { data: patterns, error: patternsError } = await supabase
      .from('cag_context_patterns')
      .upsert(seedData.cagContextPatterns, { onConflict: 'pattern_name' })
      .select('id, pattern_name');
    
    if (patternsError) {
      console.error('Error inserting CAG patterns:', patternsError);
      throw patternsError;
    }
    
    console.log(`✅ Created ${patterns.length} CAG context patterns`);
    
    // Insert knowledge base entries
    console.log('📚 Inserting knowledge base entries...');
    const { data: knowledge, error: knowledgeError } = await supabase
      .from('knowledge_base')
      .upsert(seedData.knowledgeBaseEntries, { onConflict: 'title' })
      .select('id, title');
    
    if (knowledgeError) {
      console.error('Error inserting knowledge base:', knowledgeError);
      throw knowledgeError;
    }
    
    console.log(`✅ Created ${knowledge.length} knowledge base entries`);
    
    // Create test users for authentication
    console.log('👥 Creating test users...');
    await createTestUsers();
    
    console.log('\n🎉 Staging database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Safety Items: ${safetyItems.length}`);
    console.log(`   AI Models: ${modelVersions.length}`);
    console.log(`   CAG Patterns: ${patterns.length}`);
    console.log(`   Knowledge Base: ${knowledge.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding staging data:', error);
    process.exit(1);
  }
}

async function createTestUsers() {
  const testUsers = [
    {
      email: 'inspector@staging.test',
      password: 'staging123!',
      role: 'inspector',
      name: 'Test Inspector'
    },
    {
      email: 'auditor@staging.test',
      password: 'staging123!',
      role: 'auditor',
      name: 'Test Auditor'
    },
    {
      email: 'admin@staging.test',
      password: 'staging123!',
      role: 'admin',
      name: 'Test Admin'
    }
  ];
  
  for (const user of testUsers) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      });
      
      if (authError) {
        console.warn(`⚠️  Warning creating auth user ${user.email}:`, authError.message);
        continue;
      }
      
      // Create user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: user.email,
          full_name: user.name,
          role: user.role,
          is_active: true
        }, { onConflict: 'id' });
      
      if (profileError) {
        console.warn(`⚠️  Warning creating user profile ${user.email}:`, profileError.message);
      } else {
        console.log(`✅ Created test user: ${user.email} (${user.role})`);
      }
      
    } catch (error) {
      console.warn(`⚠️  Warning creating user ${user.email}:`, error.message);
    }
  }
}

// Main execution
if (require.main === module) {
  // Validate configuration
  if (!config.supabaseUrl || !config.supabaseKey) {
    console.error('❌ Missing Supabase configuration. Please set STAGING_SUPABASE_URL and STAGING_SUPABASE_ANON_KEY environment variables.');
    process.exit(1);
  }
  
  seedStagingData()
    .then(() => {
      console.log('\n✨ Staging database is ready!');
      console.log('\n🔐 Test Users Created:');
      console.log('   Inspector: inspector@staging.test (password: staging123!)');
      console.log('   Auditor: auditor@staging.test (password: staging123!)');
      console.log('   Admin: admin@staging.test (password: staging123!)');
      console.log('\n🚀 You can now run "npm run generate:test-data" to add sample data for testing.');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = {
  seedStagingData,
  seedData
};