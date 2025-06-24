
// Category mapping utility to handle conversion between static safety item categories
// and valid checklist item categories based on database constraints
export const createCategoryMapping = (): Record<string, string> => {
  return {
    'safety': 'safety',
    'Security': 'safety',
    'security': 'safety',
    'Fire Safety': 'safety',
    'fire_safety': 'safety',
    'Pool Safety': 'safety',
    'pool_safety': 'safety',
    'Emergency': 'safety',
    'emergency': 'safety',
    'accessibility': 'accessibility',
    'Accessibility': 'accessibility',
    'amenities': 'amenities',
    'Amenities': 'amenities',
    'cleanliness': 'cleanliness',
    'Cleanliness': 'cleanliness',
    'accuracy': 'accuracy',
    'Accuracy': 'accuracy',
    'listing_accuracy': 'accuracy',
    'Listing Accuracy': 'accuracy',
    'default': 'safety' // fallback category
  };
};

export const mapCategory = (originalCategory: string): string => {
  const categoryMapping = createCategoryMapping();
  const mappedCategory = categoryMapping[originalCategory] || categoryMapping['default'];
  console.log(`📝 Mapping category "${originalCategory}" to "${mappedCategory}"`);
  return mappedCategory;
};
