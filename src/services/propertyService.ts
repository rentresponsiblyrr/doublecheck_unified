import { supabase } from "@/integrations/supabase/client";
import type { ScrapedPropertyData } from "@/lib/scrapers/types";
import { log } from "@/lib/logging/enterprise-logger";
import type { Property } from "@/stores/types";

export interface PropertyData {
  name: string;
  address: string;
  vrbo_url?: string;
  airbnb_url?: string;
}

interface PropertyServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class PropertyService {
  /**
   * Add a new property with automatic data enhancement
   * This replaces the need for separate import + add steps
   */
  async addProperty(
    propertyData: PropertyData,
    userId?: string,
  ): Promise<PropertyServiceResult<Property>> {
    try {
      log.info(
        "Adding property",
        {
          component: "PropertyService",
          action: "addProperty",
          hasName: !!propertyData.name,
          hasAddress: !!propertyData.address,
          hasVrboUrl: !!propertyData.vrbo_url,
          hasAirbnbUrl: !!propertyData.airbnb_url,
          userId,
        },
        "PROPERTY_ADD_STARTED",
      );

      // Get current user if not provided
      if (!userId) {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError || !userData.user) {
          return { success: false, error: "User authentication required" };
        }
        userId = userData.user.id;
      }

      // Validate required fields
      if (!propertyData.name?.trim()) {
        return { success: false, error: "Property name is required" };
      }

      if (!propertyData.address?.trim()) {
        return { success: false, error: "Property address is required" };
      }

      // Validate that at least one URL is provided
      const hasVrbo = propertyData.vrbo_url?.trim();
      const hasAirbnb = propertyData.airbnb_url?.trim();

      if (!hasVrbo && !hasAirbnb) {
        return {
          success: false,
          error: "At least one property URL (VRBO or Airbnb) is required",
        };
      }

      // Validate VRBO URL format if provided
      if (hasVrbo && !this.isValidVRBOUrl(propertyData.vrbo_url!)) {
        return { success: false, error: "Please enter a valid VRBO URL" };
      }

      // Prepare property data for database (matching the schema)
      const propertyToInsert = {
        name: propertyData.name.trim(),
        address: propertyData.address.trim(),
        vrbo_url: propertyData.vrbo_url?.trim() || null,
        airbnb_url: propertyData.airbnb_url?.trim() || null,
        added_by: userId,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      log.debug(
        "Inserting property with data",
        {
          component: "PropertyService",
          action: "addProperty",
          propertyName: propertyToInsert.name,
          hasVrboUrl: !!propertyToInsert.vrbo_url,
          hasAirbnbUrl: !!propertyToInsert.airbnb_url,
          addedBy: propertyToInsert.added_by,
        },
        "PROPERTY_INSERT_ATTEMPT",
      );

      // Insert property into database (direct table access)
      // TODO: Create proper RPC function for property creation once RLS is configured
      const { data: insertedProperty, error: insertError } = await supabase
        .from("properties")
        .insert({
          name: propertyToInsert.name,
          address: propertyToInsert.address,
          vrbo_url: propertyToInsert.vrbo_url,
          airbnb_url: propertyToInsert.airbnb_url,
          added_by: propertyToInsert.added_by,
        })
        .select("id, name, address, vrbo_url, airbnb_url, created_at")
        .single();

      if (insertError) {
        log.error(
          "Database insertion failed for property",
          insertError,
          {
            component: "PropertyService",
            action: "addProperty",
            propertyName: propertyToInsert.name,
            userId: propertyToInsert.added_by,
            errorCode: insertError.code,
          },
          "PROPERTY_INSERT_ERROR",
        );
        return {
          success: false,
          error: `Failed to save property: ${insertError.message}`,
        };
      }

      log.info(
        "Property added successfully",
        {
          component: "PropertyService",
          action: "addProperty",
          propertyId: insertedProperty.id,
          propertyName: insertedProperty.name,
          hasVrboUrl: !!insertedProperty.vrbo_url,
          hasAirbnbUrl: !!insertedProperty.airbnb_url,
        },
        "PROPERTY_ADDED_SUCCESS",
      );

      // Attempt to get enhanced data if VRBO URL is provided (non-blocking)
      let scrapedData: ScrapedPropertyData | null = null;
      if (hasVrbo) {
        try {
          const enhancedData = await this.enhancePropertyData(
            propertyData.vrbo_url!,
          );
          if (enhancedData.success) {
            scrapedData = enhancedData.data;
            log.info(
              "Enhanced property data available",
              {
                component: "PropertyService",
                action: "addProperty",
                propertyId: insertedProperty.id,
                hasScrapedData: !!scrapedData,
                listingId: scrapedData?.listingId,
              },
              "PROPERTY_DATA_ENHANCED",
            );
          }
        } catch (error) {
          log.warn(
            "Could not enhance property data, continuing with basic info",
            {
              component: "PropertyService",
              action: "addProperty",
              propertyId: insertedProperty.id,
              vrboUrl: propertyData.vrbo_url,
              error: error instanceof Error ? error.message : String(error),
            },
            "PROPERTY_ENHANCEMENT_FAILED",
          );
          // Continue without enhanced data - not a critical failure
        }
      }

      return {
        success: true,
        data: {
          property: insertedProperty,
          scrapedData,
          enhanced: !!scrapedData,
        },
      };
    } catch (error) {
      log.error(
        "Property service error",
        error as Error,
        {
          component: "PropertyService",
          action: "addProperty",
          userId,
          hasPropertyData: !!propertyData,
        },
        "PROPERTY_SERVICE_ERROR",
      );
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unexpected error occurred",
      };
    }
  }

  /**
   * Enhance property data using available information
   * This is a simplified version that doesn't rely on browser scraping
   */
  private async enhancePropertyData(
    vrboUrl: string,
  ): Promise<PropertyServiceResult<ScrapedPropertyData>> {
    try {
      // For now, extract basic info from URL structure
      const urlInfo = this.extractVRBOInfo(vrboUrl);

      // Create basic scraped data structure
      const basicData: ScrapedPropertyData = {
        title: `Property from VRBO listing`,
        description: "Property imported from VRBO",
        location: {
          city: "Location to be verified",
          state: "",
          country: "US",
        },
        pricing: {
          basePrice: 0,
          currency: "USD",
        },
        amenities: [],
        images: [],
        propertyType: "vacation rental",
        bedrooms: 0,
        bathrooms: 0,
        maxGuests: 0,
        url: vrboUrl,
        listingId: urlInfo.listingId,
      };

      return {
        success: true,
        data: basicData,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to enhance property data: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Extract basic info from VRBO URL
   */
  private extractVRBOInfo(url: string): { listingId: string | null } {
    try {
      const match = url.match(/vrbo\.com\/(\d+)/);
      return {
        listingId: match ? match[1] : null,
      };
    } catch {
      return { listingId: null };
    }
  }

  /**
   * Validate VRBO URL format
   */
  private isValidVRBOUrl(url: string): boolean {
    if (!url.trim()) return false;
    const vrboPatterns = [
      /^https?:\/\/(www\.)?vrbo\.com\/\d+/,
      /^https?:\/\/(www\.)?homeaway\.com\/\d+/,
      /^https?:\/\/(www\.)?vacationrentals\.com\/\d+/,
    ];
    return vrboPatterns.some((pattern) => pattern.test(url));
  }

  /**
   * Update existing property
   */
  async updateProperty(
    id: string,
    propertyData: Partial<PropertyData>,
  ): Promise<PropertyServiceResult<Property>> {
    try {
      // Map app fields to database fields
      const updateData: {
        name?: string;
        address?: string;
        vrbo_url?: string;
        airbnb_url?: string;
      } = {};
      if (propertyData.name) updateData.name = propertyData.name;
      if (propertyData.address) updateData.address = propertyData.address;
      if (propertyData.vrbo_url) updateData.vrbo_url = propertyData.vrbo_url;
      if (propertyData.airbnb_url)
        updateData.airbnb_url = propertyData.airbnb_url;

      const { data, error } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", id)
        .select("id, name, address, vrbo_url, airbnb_url, created_at")
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Update failed",
      };
    }
  }

  /**
   * Get property by ID
   */
  async getProperty(id: string): Promise<PropertyServiceResult<Property>> {
    try {
      // Use RPC function to get property data since direct access is restricted by RLS
      const { data: allProperties, error } = await supabase.rpc(
        "get_properties_with_inspections",
      );

      if (error) {
        return { success: false, error: error.message };
      }

      const data = allProperties?.find(
        (prop: { id: string }) => prop.id === id,
      );
      if (!data) {
        return { success: false, error: "Property not found" };
      }

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get property",
      };
    }
  }
}

export const propertyService = new PropertyService();
