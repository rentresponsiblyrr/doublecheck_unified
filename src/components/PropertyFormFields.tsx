
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface FormData {
  name: string;
  address: string;
  vrbo_url: string;
  airbnb_url: string;
}

interface PropertyFormFieldsProps {
  formData: FormData;
  formErrors: Record<string, string>;
  onInputChange: (field: string, value: string) => void;
}

export const PropertyFormFields = ({ formData, formErrors, onInputChange }: PropertyFormFieldsProps) => {
  // Ensure formData has all required fields with defaults
  const safeFormData = {
    name: formData?.name || "",
    address: formData?.address || "",
    vrbo_url: formData?.vrbo_url || "",
    airbnb_url: formData?.airbnb_url || ""
  };

  const safeFormErrors = formErrors || {};

  // Check if at least one URL is provided
  const hasVrbo = safeFormData.vrbo_url.trim();
  const hasAirbnb = safeFormData.airbnb_url.trim();
  const hasAtLeastOneUrl = hasVrbo || hasAirbnb;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Property Name *</Label>
        <Input
          id="name"
          value={safeFormData.name}
          onChange={(e) => onInputChange('name', e.target.value)}
          placeholder="e.g., Cozy Mountain Cabin"
          required
          className={safeFormErrors.name ? "border-red-500" : ""}
        />
        {safeFormErrors.name && (
          <p className="text-sm text-red-600">{safeFormErrors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          value={safeFormData.address}
          onChange={(e) => onInputChange('address', e.target.value)}
          placeholder="e.g., 123 Main St, Mountain View, CA 94041"
          required
          className={safeFormErrors.address ? "border-red-500" : ""}
        />
        {safeFormErrors.address && (
          <p className="text-sm text-red-600">{safeFormErrors.address}</p>
        )}
      </div>

      {/* URL Section with Helper Text */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-gray-900">
            Listing URLs * 
            <span className="text-xs font-normal text-gray-500 ml-1">
              (at least one required)
            </span>
          </h3>
          <p className="text-xs text-gray-600">
            Provide at least one listing URL from Vrbo or Airbnb
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vrbo_url">Vrbo Listing URL</Label>
          <Input
            id="vrbo_url"
            type="url"
            value={safeFormData.vrbo_url}
            onChange={(e) => onInputChange('vrbo_url', e.target.value)}
            placeholder="https://www.vrbo.com/..."
            className={safeFormErrors.vrbo_url ? "border-red-500" : ""}
          />
          {safeFormErrors.vrbo_url && (
            <p className="text-sm text-red-600">{safeFormErrors.vrbo_url}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="airbnb_url">Airbnb Listing URL</Label>
          <Input
            id="airbnb_url"
            type="url"
            value={safeFormData.airbnb_url}
            onChange={(e) => onInputChange('airbnb_url', e.target.value)}
            placeholder="https://www.airbnb.com/..."
            className={safeFormErrors.airbnb_url ? "border-red-500" : ""}
          />
          {safeFormErrors.airbnb_url && (
            <p className="text-sm text-red-600">{safeFormErrors.airbnb_url}</p>
          )}
        </div>

        {/* Show general URL requirement error */}
        {safeFormErrors.listing_urls && (
          <p className="text-sm text-red-600">{safeFormErrors.listing_urls}</p>
        )}

        {/* Status indicator */}
        {!hasAtLeastOneUrl && (safeFormData.vrbo_url || safeFormData.airbnb_url) && (
          <p className="text-xs text-orange-600">
            ⚠️ At least one valid listing URL is required
          </p>
        )}
        {hasAtLeastOneUrl && (
          <p className="text-xs text-green-600">
            ✓ Listing URL requirement satisfied
          </p>
        )}
      </div>
    </div>
  );
};
