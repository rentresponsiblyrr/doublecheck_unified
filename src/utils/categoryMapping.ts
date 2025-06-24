
// Category mapping utility to handle conversion between static safety item categories
// and valid checklist item categories based on database constraints

// This will be populated dynamically from the database
let VALID_CATEGORIES: string[] = ['safety', 'accessibility', 'amenities', 'cleanliness', 'accuracy'];

// Function to update valid categories from database
export const updateValidCategories = (categories: string[]) => {
  VALID_CATEGORIES = categories;
};

// Get current valid categories
export const getValidCategories = (): readonly string[] => {
  return VALID_CATEGORIES;
};

// Create a comprehensive mapping that covers all known category variations
export const createCategoryMapping = (): Record<string, string> => {
  return {
    // Safety variations
    'safety': 'safety',
    'Safety': 'safety',
    'SAFETY': 'safety',
    'Security': 'safety',
    'security': 'safety',
    'SECURITY': 'safety',
    'Fire Safety': 'safety',
    'fire_safety': 'safety',
    'fire-safety': 'safety',
    'Pool Safety': 'safety',
    'pool_safety': 'safety',
    'pool-safety': 'safety',
    'Emergency': 'safety',
    'emergency': 'safety',
    'EMERGENCY': 'safety',
    'General & Safety Information': 'safety',
    'general_safety': 'safety',
    
    // Accessibility variations
    'accessibility': 'accessibility',
    'Accessibility': 'accessibility',
    'ACCESSIBILITY': 'accessibility',
    'ADA': 'accessibility',
    'ada': 'accessibility',
    'access': 'accessibility',
    'Access': 'accessibility',
    
    // Amenities variations
    'amenities': 'amenities',
    'Amenities': 'amenities',
    'AMENITIES': 'amenities',
    'amenity': 'amenities',
    'Amenity': 'amenities',
    'AMENITY': 'amenities',
    'Property Details': 'amenities',
    'property_details': 'amenities',
    'property-details': 'amenities',
    'features': 'amenities',
    'Features': 'amenities',
    
    // Cleanliness variations
    'cleanliness': 'cleanliness',
    'Cleanliness': 'cleanliness',
    'CLEANLINESS': 'cleanliness',
    'cleaning': 'cleanliness',
    'Cleaning': 'cleanliness',
    'CLEANING': 'cleanliness',
    'hygiene': 'cleanliness',
    'Hygiene': 'cleanliness',
    
    // Accuracy variations
    'accuracy': 'accuracy',
    'Accuracy': 'accuracy',
    'ACCURACY': 'accuracy',
    'listing_accuracy': 'accuracy',
    'Listing Accuracy': 'accuracy',
    'listing-accuracy': 'accuracy',
    'verification': 'accuracy',
    'Verification': 'accuracy',
    'VERIFICATION': 'accuracy',
    
    // Maintenance (map to safety as fallback)
    'maintenance': 'safety',
    'Maintenance': 'safety',
    'MAINTENANCE': 'safety',
    
    // Default fallback
    'default': 'safety'
  };
};

export const mapCategory = (originalCategory: string | null | undefined): string => {
  console.log(`🔄 mapCategory called with: "${originalCategory}"`);
  
  // Handle null, undefined, or empty values
  if (!originalCategory || originalCategory.trim() === '') {
    console.warn(`⚠️ Empty or null category found, using default: safety`);
    return 'safety';
  }

  const categoryMapping = createCategoryMapping();
  const trimmedCategory = originalCategory.trim();
  
  // Try exact match first
  if (categoryMapping[trimmedCategory]) {
    const mappedCategory = categoryMapping[trimmedCategory];
    console.log(`📝 Exact mapping: "${trimmedCategory}" -> "${mappedCategory}"`);
    return mappedCategory;
  }
  
  // Try case-insensitive match
  const lowerCategory = trimmedCategory.toLowerCase();
  for (const [key, value] of Object.entries(categoryMapping)) {
    if (key.toLowerCase() === lowerCategory) {
      console.log(`📝 Case-insensitive mapping: "${trimmedCategory}" -> "${value}"`);
      return value;
    }
  }
  
  // Try partial matching for complex category names
  const partialMatches = Object.entries(categoryMapping).filter(([key]) => 
    key.toLowerCase().includes(lowerCategory) || lowerCategory.includes(key.toLowerCase())
  );
  
  if (partialMatches.length > 0) {
    const [, mappedCategory] = partialMatches[0];
    console.log(`📝 Partial mapping: "${trimmedCategory}" -> "${mappedCategory}"`);
    return mappedCategory;
  }
  
  // Check if it's already a valid category from database
  if (VALID_CATEGORIES.includes(trimmedCategory)) {
    console.log(`📝 Direct valid category: "${trimmedCategory}"`);
    return trimmedCategory;
  }
  
  // Final fallback
  console.warn(`⚠️ Unknown category "${trimmedCategory}", using default: safety`);
  return 'safety';
};

// Enhanced validation function
export const validateCategory = (category: string): boolean => {
  const isValid = VALID_CATEGORIES.includes(category);
  console.log(`🔍 validateCategory("${category}") = ${isValid}`);
  return isValid;
};

// Function to ensure a category is valid, with auto-correction
export const ensureValidCategory = (category: string | null | undefined): string => {
  const mappedCategory = mapCategory(category);
  const isValid = validateCategory(mappedCategory);
  
  if (!isValid) {
    console.error(`❌ Category "${mappedCategory}" is not valid after mapping. Using safety fallback.`);
    return 'safety';
  }
  
  return mappedCategory;
};
