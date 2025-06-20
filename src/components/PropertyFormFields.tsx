
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
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Property Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onInputChange('name', e.target.value)}
          placeholder="e.g., Cozy Mountain Cabin"
          required
          className={formErrors.name ? "border-red-500" : ""}
        />
        {formErrors.name && (
          <p className="text-sm text-red-600">{formErrors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => onInputChange('address', e.target.value)}
          placeholder="e.g., 123 Main St, Mountain View, CA 94041"
          required
          className={formErrors.address ? "border-red-500" : ""}
        />
        {formErrors.address && (
          <p className="text-sm text-red-600">{formErrors.address}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="vrbo_url">Vrbo Listing URL</Label>
        <Input
          id="vrbo_url"
          type="url"
          value={formData.vrbo_url}
          onChange={(e) => onInputChange('vrbo_url', e.target.value)}
          placeholder="https://www.vrbo.com/..."
          className={formErrors.vrbo_url ? "border-red-500" : ""}
        />
        {formErrors.vrbo_url && (
          <p className="text-sm text-red-600">{formErrors.vrbo_url}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="airbnb_url">Airbnb Listing URL</Label>
        <Input
          id="airbnb_url"
          type="url"
          value={formData.airbnb_url}
          onChange={(e) => onInputChange('airbnb_url', e.target.value)}
          placeholder="https://www.airbnb.com/..."
          className={formErrors.airbnb_url ? "border-red-500" : ""}
        />
        {formErrors.airbnb_url && (
          <p className="text-sm text-red-600">{formErrors.airbnb_url}</p>
        )}
      </div>
    </div>
  );
};
