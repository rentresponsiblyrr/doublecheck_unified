
// Category mapping utility to handle conversion between static safety item categories
// and valid checklist item categories based on database constraints

// This will be populated dynamically from the database
let VALID_CATEGORIES: string[] = ['safety', 'accessibility', 'amenities', 'cleanliness', 'accuracy'];

// Function to update valid categories from database
export const updateValidCategories = (categories: string[]) => {
  VALID_CATEGORIES = categories;
  // REMOVED: console.log('🔄 Updated valid categories:', categories);
};

// Get current valid categories
export const getValidCategories = (): readonly string[] => {
  return VALID_CATEGORIES;
};

// Enhanced validation function
export const validateCategory = (category: string): boolean => {
  const isValid = VALID_CATEGORIES.includes(category);
  // REMOVED: console.log(`🔍 validateCategory("${category}") = ${isValid}`);
  return isValid;
};

// Function to ensure a category is valid, with auto-correction
export const ensureValidCategory = (category: string | null | undefined): string => {
  // REMOVED: console.log(`🔄 ensureValidCategory called with: "${category}"`);
  
  // Handle null, undefined, or empty values
  if (!category || category.trim() === '') {
    console.warn(`⚠️ Empty or null category found, using default: safety`);
    return 'safety';
  }

  const trimmedCategory = category.trim();
  
  // Check if already valid
  if (validateCategory(trimmedCategory)) {
    // REMOVED: console.log(`✅ Category "${trimmedCategory}" is already valid`);
    return trimmedCategory;
  }
  
  // Try case-insensitive match
  const lowerCategory = trimmedCategory.toLowerCase();
  const matchedCategory = VALID_CATEGORIES.find(validCat => 
    validCat.toLowerCase() === lowerCategory
  );
  
  if (matchedCategory) {
    // REMOVED: console.log(`📝 Case-insensitive mapping: "${trimmedCategory}" -> "${matchedCategory}"`);
    return matchedCategory;
  }
  
  // Try partial matching for complex category names
  const partialMatch = VALID_CATEGORIES.find(validCat => 
    lowerCategory.includes(validCat.toLowerCase()) || 
    validCat.toLowerCase().includes(lowerCategory)
  );
  
  if (partialMatch) {
    // REMOVED: console.log(`📝 Partial mapping: "${trimmedCategory}" -> "${partialMatch}"`);
    return partialMatch;
  }
  
  // Enhanced mapping for common variations
  const categoryMap: Record<string, string> = {
    'fire safety': 'safety',
    'pool safety': 'safety',
    'general safety': 'safety',
    'security': 'safety',
    'emergency': 'safety',
    'property details': 'amenities',
    'features': 'amenities',
    'listing accuracy': 'accuracy',
    'verification': 'accuracy',
    'maintenance': 'safety',
    'ada': 'accessibility',
    'access': 'accessibility',
    'cleaning': 'cleanliness',
    'hygiene': 'cleanliness'
  };
  
  const mappedCategory = categoryMap[lowerCategory];
  if (mappedCategory) {
    // REMOVED: console.log(`📝 Enhanced mapping: "${trimmedCategory}" -> "${mappedCategory}"`);
    return mappedCategory;
  }
  
  // Final fallback
  console.warn(`⚠️ Unknown category "${trimmedCategory}", using default: safety`);
  return 'safety';
};

// Legacy function for backward compatibility
export const mapCategory = ensureValidCategory;
