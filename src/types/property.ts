// Property Types for STR Certified

export interface PhotoData {
  id: string;
  url: string;
  roomType?: string;
  caption?: string;
  order: number;
  width?: number;
  height?: number;
  source: 'listing' | 'inspector' | 'ai_generated';
  metadata?: {
    takenDate?: Date;
    device?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
}