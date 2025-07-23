// Scraper Types for STR Certified Property Data Extraction

export interface ScrapedPropertyData {
  title: string;
  description: string;
  amenities: PropertyAmenity[];
  photos: string[];
  rooms: PropertyRoom[];
  specifications: PropertySpecifications;
  location: PropertyLocation;
  pricing?: PropertyPricing;
  host?: HostInformation;
  reviews?: ReviewSummary;
  lastUpdated: Date;
  sourceUrl: string;
}

export interface PropertyAmenity {
  name: string;
  verified: boolean;
  category: AmenityCategory;
  icon?: string;
  description?: string;
  priority: "essential" | "important" | "nice_to_have";
}

export type AmenityCategory =
  | "kitchen"
  | "bathroom"
  | "bedroom"
  | "entertainment"
  | "outdoor"
  | "safety"
  | "accessibility"
  | "connectivity"
  | "climate"
  | "parking"
  | "laundry"
  | "general";

export interface PropertyRoom {
  type: RoomType;
  count: number;
  photos: string[];
  amenities: string[];
  description?: string;
  specifications?: RoomSpecifications;
}

export type RoomType =
  | "bedroom"
  | "bathroom"
  | "kitchen"
  | "living_room"
  | "dining_room"
  | "office"
  | "game_room"
  | "balcony"
  | "patio"
  | "garage"
  | "basement"
  | "attic"
  | "other";

export interface RoomSpecifications {
  bedType?: "king" | "queen" | "full" | "twin" | "sofa_bed" | "bunk_bed";
  bathType?: "full" | "half" | "ensuite" | "shared";
  squareFootage?: number;
  features?: string[];
}

export interface PropertySpecifications {
  propertyType:
    | "house"
    | "apartment"
    | "condo"
    | "townhouse"
    | "cabin"
    | "villa"
    | "other";
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  squareFootage?: number;
  lotSize?: number;
  yearBuilt?: number;
  floors?: number;
  parkingSpaces?: number;
  checkInTime?: string;
  checkOutTime?: string;
  minimumStay?: number;
}

export interface PropertyLocation {
  address?: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  neighborhood?: string;
  landmarks?: string[];
}

export interface PropertyPricing {
  basePrice?: number;
  cleaningFee?: number;
  serviceFee?: number;
  currency: string;
  lastUpdated: Date;
}

export interface HostInformation {
  name?: string;
  profileUrl?: string;
  avatar?: string;
  joinedDate?: Date;
  responseRate?: number;
  responseTime?: string;
  languages?: string[];
}

export interface ReviewSummary {
  averageRating?: number;
  totalReviews?: number;
  ratingBreakdown?: {
    cleanliness: number;
    accuracy: number;
    checkIn: number;
    communication: number;
    location: number;
    value: number;
  };
  recentReviews?: Array<{
    rating: number;
    comment: string;
    date: Date;
    guestName: string;
  }>;
}

export interface ScrapingResult<T = ScrapedPropertyData> {
  success: boolean;
  data?: T;
  errors: ScrapingError[];
  metadata: ScrapingMetadata;
}

export interface ScrapingError {
  code: string;
  message: string;
  field?: string;
  severity: "low" | "medium" | "high" | "critical";
  recoverable: boolean;
}

export interface ScrapingMetadata {
  scrapedAt: Date;
  duration: number; // milliseconds
  sourceUrl: string;
  userAgent?: string;
  rateLimited: boolean;
  dataCompleteness: number; // 0-100 percentage
  fieldsScraped: string[];
  fieldsFailed: string[];
}

export interface ScraperConfig {
  timeout: number;
  retries: number;
  userAgent: string;
  respectRobotsTxt: boolean;
  rateLimit: number; // requests per minute
  enableScreenshots: boolean;
  screenshotPath?: string;
}

export interface PhotoData {
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  room?: RoomType;
  category: PhotoCategory;
  size?: {
    width: number;
    height: number;
  };
  order: number;
}

export type PhotoCategory =
  | "exterior"
  | "interior"
  | "bedroom"
  | "bathroom"
  | "kitchen"
  | "living_area"
  | "outdoor_space"
  | "amenity"
  | "view"
  | "other";

export interface PhotoDeduplicationResult {
  originalCount: number;
  uniquePhotos: PhotoData[];
  duplicatesRemoved: number;
  categorizedPhotos: Record<PhotoCategory, PhotoData[]>;
  roomPhotos: Record<RoomType, PhotoData[]>;
}

export type ScrapingStatus =
  | "idle"
  | "scraping"
  | "completed"
  | "error"
  | "retrying";

export interface ScrapingState {
  status: ScrapingStatus;
  progress: number; // 0-100
  currentStep?: string;
  result?: ScrapingResult;
  error?: ScrapingError;
}

// VRBO-specific types
export interface VRBOPropertyData extends ScrapedPropertyData {
  vrboId: string;
  instantBook: boolean;
  propertyManager?: string;
  cancellationPolicy: string;
  houseRules: string[];
  nearbyAttractions?: string[];
}
