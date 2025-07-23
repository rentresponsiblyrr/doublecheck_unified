// Robust URL Validation and Cleanup for VRBO URLs
// Takes full responsibility for making any VRBO URL work correctly

export interface URLValidationResult {
  isValid: boolean;
  cleanedUrl: string;
  originalUrl: string;
  warnings: string[];
  errors: string[];
  urlType: "vrbo" | "homeaway" | "vacationrentals" | "invalid";
  extractedId: string | null;
}

export interface URLCleanupOptions {
  removeTrailingSlashes: boolean;
  removeQueryParams: boolean;
  forceHttps: boolean;
  removeWww: boolean;
  extractPropertyId: boolean;
}

export class VRBOURLValidator {
  private static readonly VRBO_PATTERNS = [
    // Standard VRBO patterns
    /^https?:\/\/(www\.)?vrbo\.com\/(\d+)/,
    /^https?:\/\/(www\.)?vrbo\.com\/vacation-rental\/p(\d+)/,
    /^https?:\/\/(www\.)?vrbo\.com\/en-us\/vacation-rental\/p(\d+)/,

    // HomeAway patterns (VRBO subsidiary)
    /^https?:\/\/(www\.)?homeaway\.com\/vacation-rental\/p(\d+)/,
    /^https?:\/\/(www\.)?homeaway\.com\/(\d+)/,

    // VacationRentals.com patterns (VRBO subsidiary)
    /^https?:\/\/(www\.)?vacationrentals\.com\/(\d+)/,
    /^https?:\/\/(www\.)?vacationrentals\.com\/vacation-rental\/p(\d+)/,

    // Mobile URLs
    /^https?:\/\/m\.vrbo\.com\/(\d+)/,
    /^https?:\/\/mobile\.vrbo\.com\/(\d+)/,

    // International variations
    /^https?:\/\/(www\.)?vrbo\.ca\/(\d+)/,
    /^https?:\/\/(www\.)?vrbo\.co\.uk\/(\d+)/,
    /^https?:\/\/(www\.)?vrbo\.com\.au\/(\d+)/,

    // Legacy patterns
    /^https?:\/\/(www\.)?vrbo\.com\/rental\/(\d+)/,
    /^https?:\/\/(www\.)?vrbo\.com\/property\/(\d+)/,
  ];

  private static readonly DEFAULT_OPTIONS: URLCleanupOptions = {
    removeTrailingSlashes: true,
    removeQueryParams: true,
    forceHttps: true,
    removeWww: false,
    extractPropertyId: true,
  };

  /**
   * Comprehensive URL validation and cleanup
   * @param url - Raw URL from user input
   * @param options - Cleanup options
   * @returns URLValidationResult with cleaned URL and validation info
   */
  static validateAndCleanURL(
    url: string,
    options: Partial<URLCleanupOptions> = {},
  ): URLValidationResult {
    const opts = { ...VRBOURLValidator.DEFAULT_OPTIONS, ...options };
    const result: URLValidationResult = {
      isValid: false,
      cleanedUrl: "",
      originalUrl: url,
      warnings: [],
      errors: [],
      urlType: "invalid",
      extractedId: null,
    };

    try {
      // Step 1: Basic cleanup
      let cleanedUrl = VRBOURLValidator.performBasicCleanup(url, opts);

      // Step 2: Handle common user mistakes
      cleanedUrl = VRBOURLValidator.fixCommonMistakes(cleanedUrl, result);

      // Step 3: Validate against patterns
      const validationResult =
        VRBOURLValidator.validateAgainstPatterns(cleanedUrl);

      if (validationResult.isValid) {
        result.isValid = true;
        result.cleanedUrl = validationResult.cleanedUrl;
        result.urlType = validationResult.urlType;
        result.extractedId = validationResult.extractedId;

        // Step 4: Final optimization
        result.cleanedUrl = VRBOURLValidator.optimizeURL(
          result.cleanedUrl,
          opts,
        );

        // Add warnings for changes made
        if (result.cleanedUrl !== url) {
          result.warnings.push(`URL was automatically cleaned from: ${url}`);
        }
      } else {
        result.errors.push("URL does not match any valid VRBO pattern");

        // Try to provide helpful suggestions
        const suggestions = VRBOURLValidator.generateSuggestions(url);
        if (suggestions.length > 0) {
          result.errors.push(`Suggestions: ${suggestions.join(", ")}`);
        }
      }
    } catch (error) {
      result.errors.push(
        `URL parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    return result;
  }

  /**
   * Performs basic cleanup operations
   */
  private static performBasicCleanup(
    url: string,
    options: URLCleanupOptions,
  ): string {
    let cleaned = url.trim();

    // Remove extra whitespace and invisible characters
    cleaned = cleaned.replace(/\s+/g, "").replace(/[\u200B-\u200D\uFEFF]/g, "");

    // Fix missing protocol
    if (!cleaned.match(/^https?:\/\//)) {
      cleaned = "https://" + cleaned;
    }

    // Force HTTPS
    if (options.forceHttps) {
      cleaned = cleaned.replace(/^http:\/\//, "https://");
    }

    // Remove trailing slashes
    if (options.removeTrailingSlashes) {
      cleaned = cleaned.replace(/\/+$/, "");
    }

    // Remove query parameters and fragments
    if (options.removeQueryParams) {
      cleaned = cleaned.split("?")[0].split("#")[0];
    }

    return cleaned;
  }

  /**
   * Fixes common user mistakes in URLs
   */
  private static fixCommonMistakes(
    url: string,
    result: URLValidationResult,
  ): string {
    let fixed = url;

    // Fix double protocols
    if (
      fixed.includes("https://https://") ||
      fixed.includes("http://http://")
    ) {
      fixed = fixed.replace(/^https?:\/\/https?:\/\//, "https://");
      result.warnings.push("Removed duplicate protocol");
    }

    // Fix missing www where needed
    if (fixed.match(/^https?:\/\/vrbo\.com/) && !fixed.includes("www.")) {
      fixed = fixed.replace(/^https?:\/\/vrbo\.com/, "https://www.vrbo.com");
      result.warnings.push("Added missing www");
    }

    // Fix common misspellings - use more precise regex patterns to avoid false matches
    const misspellings = [
      // Use word boundaries and specific patterns to avoid replacing vrbo.com with vrbo.comm
      [/\bvrbo\.co(?=\/|$|\?|#)/, "vrbo.com"], // Only replace vrbo.co when followed by /, end of string, or query params
      [/\bverbo\.com\b/, "vrbo.com"],
      [/\bvbro\.com\b/, "vrbo.com"],
      [/\bvrbo\.om\b/, "vrbo.com"],
    ];

    for (const [wrongPattern, correct] of misspellings) {
      if (fixed.match(wrongPattern)) {
        const originalFixed = fixed;
        fixed = fixed.replace(wrongPattern, correct);
        // Extract the actual wrong text that was replaced for the warning
        const wrongText = originalFixed.match(wrongPattern)?.[0] || "unknown";
        result.warnings.push(`Fixed misspelling: ${wrongText} → ${correct}`);
      }
    }

    // Fix mobile URLs
    fixed = fixed.replace(/^https?:\/\/m\.vrbo\.com/, "https://www.vrbo.com");
    fixed = fixed.replace(
      /^https?:\/\/mobile\.vrbo\.com/,
      "https://www.vrbo.com",
    );

    // Fix extra slashes in path
    fixed = fixed.replace(/([^:])\/\/+/g, "$1/");

    return fixed;
  }

  /**
   * Validates URL against known VRBO patterns
   */
  private static validateAgainstPatterns(url: string): {
    isValid: boolean;
    cleanedUrl: string;
    urlType: URLValidationResult["urlType"];
    extractedId: string | null;
  } {
    for (const pattern of VRBOURLValidator.VRBO_PATTERNS) {
      const match = url.match(pattern);
      if (match) {
        const propertyId = match[2] || match[1]; // Different capture groups

        // Determine URL type
        let urlType: URLValidationResult["urlType"] = "vrbo";
        if (url.includes("homeaway.com")) urlType = "homeaway";
        else if (url.includes("vacationrentals.com"))
          urlType = "vacationrentals";

        // Generate clean canonical URL
        const cleanedUrl = `https://www.vrbo.com/${propertyId}`;

        return {
          isValid: true,
          cleanedUrl,
          urlType,
          extractedId: propertyId,
        };
      }
    }

    return {
      isValid: false,
      cleanedUrl: url,
      urlType: "invalid",
      extractedId: null,
    };
  }

  /**
   * Final URL optimization
   */
  private static optimizeURL(url: string, options: URLCleanupOptions): string {
    // Ensure clean format for scraping
    return url;
  }

  /**
   * Generate helpful suggestions for invalid URLs
   */
  private static generateSuggestions(url: string): string[] {
    const suggestions: string[] = [];

    if (url.includes("airbnb")) {
      suggestions.push(
        "Airbnb URLs are not supported yet - please use a VRBO listing",
      );
    }

    if (url.includes("booking.com") || url.includes("hotels.com")) {
      suggestions.push(
        "Only VRBO URLs are supported - please find the property on VRBO",
      );
    }

    if (
      !url.includes("vrbo") &&
      !url.includes("homeaway") &&
      !url.includes("vacationrentals")
    ) {
      suggestions.push(
        "Please provide a VRBO, HomeAway, or VacationRentals.com URL",
      );
    }

    if (url.length < 10) {
      suggestions.push(
        "URL appears incomplete - please provide the full VRBO listing URL",
      );
    }

    return suggestions;
  }

  /**
   * Quick validation check
   */
  static isValidVRBOURL(url: string): boolean {
    const result = VRBOURLValidator.validateAndCleanURL(url);
    return result.isValid;
  }

  /**
   * Get cleaned URL or throw error
   */
  static getCleanedURL(url: string): string {
    const result = VRBOURLValidator.validateAndCleanURL(url);
    if (!result.isValid) {
      throw new Error(`Invalid VRBO URL: ${result.errors.join(", ")}`);
    }
    return result.cleanedUrl;
  }

  /**
   * Extract property ID from any VRBO-related URL
   */
  static extractPropertyId(url: string): string | null {
    const result = VRBOURLValidator.validateAndCleanURL(url);
    return result.extractedId;
  }
}

// Convenience functions
export const validateVRBOURL = VRBOURLValidator.validateAndCleanURL;
export const isValidVRBOURL = VRBOURLValidator.isValidVRBOURL;
export const getCleanedVRBOURL = VRBOURLValidator.getCleanedURL;
export const extractVRBOPropertyId = VRBOURLValidator.extractPropertyId;
