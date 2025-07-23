// Category mapping utility to handle conversion between static safety item categories
// and valid checklist item categories based on database constraints

// This will be populated dynamically from the database
let VALID_CATEGORIES: string[] = [
  "safety",
  "accessibility",
  "amenities",
  "cleanliness",
  "accuracy",
];

// Function to update valid categories from database
export const updateValidCategories = (categories: string[]) => {
  VALID_CATEGORIES = categories;
};

// Get current valid categories
export const getValidCategories = (): readonly string[] => {
  return VALID_CATEGORIES;
};

// Enhanced validation function
export const validateCategory = (category: string): boolean => {
  const isValid = VALID_CATEGORIES.includes(category);
  return isValid;
};

// Function to ensure a category is valid, with auto-correction
export const ensureValidCategory = (
  category: string | null | undefined,
): string => {
  // Handle null, undefined, or empty values
  if (!category || category.trim() === "") {
    return "safety";
  }

  const trimmedCategory = category.trim();

  // Check if already valid
  if (validateCategory(trimmedCategory)) {
    return trimmedCategory;
  }

  // Try case-insensitive match
  const lowerCategory = trimmedCategory.toLowerCase();
  const matchedCategory = VALID_CATEGORIES.find(
    (validCat) => validCat.toLowerCase() === lowerCategory,
  );

  if (matchedCategory) {
    return matchedCategory;
  }

  // Try partial matching for complex category names
  const partialMatch = VALID_CATEGORIES.find(
    (validCat) =>
      lowerCategory.includes(validCat.toLowerCase()) ||
      validCat.toLowerCase().includes(lowerCategory),
  );

  if (partialMatch) {
    return partialMatch;
  }

  // Enhanced mapping for common variations
  const categoryMap: Record<string, string> = {
    "fire safety": "safety",
    "pool safety": "safety",
    "general safety": "safety",
    security: "safety",
    emergency: "safety",
    "property details": "amenities",
    features: "amenities",
    "listing accuracy": "accuracy",
    verification: "accuracy",
    maintenance: "safety",
    ada: "accessibility",
    access: "accessibility",
    cleaning: "cleanliness",
    hygiene: "cleanliness",
  };

  const mappedCategory = categoryMap[lowerCategory];
  if (mappedCategory) {
    return mappedCategory;
  }

  // Final fallback
  return "safety";
};

// Legacy function for backward compatibility
export const mapCategory = ensureValidCategory;
