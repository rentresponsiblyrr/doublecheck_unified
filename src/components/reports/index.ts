// Reports module exports
export { ReportGenerator } from './ReportGenerator';
export { PhotoComparisonReport } from './PhotoComparisonReport';
export { AuditTrailReport } from './AuditTrailReport';
export { PropertyManagerDelivery } from './PropertyManagerDelivery';
export { ListingOptimizationSuggestions } from './ListingOptimizationSuggestions';
export { reportService } from '@/services/reportService';
export { reportDeliveryService } from '@/services/reportDeliveryService';
export { amenityDiscoveryService } from '@/services/amenityDiscoveryService';
export { missingAmenityDetector } from '@/services/missingAmenityDetector';
export { amenityComparisonEngine } from '@/services/amenityComparisonEngine';
export type { 
  ReportData, 
  ReportOptions, 
  ReportTemplate, 
  PhotoComparisonData,
  PropertyManagerContact,
  ReportDelivery,
  EmailTemplate
} from '@/services/reportService';
export type { 
  PropertyManagerContact as DeliveryPropertyManagerContact,
  ReportDelivery as DeliveryReportDelivery,
  EmailTemplate as DeliveryEmailTemplate
} from '@/services/reportDeliveryService';