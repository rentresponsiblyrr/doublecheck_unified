/**
 * PROFESSIONAL ZUSTAND STORE TYPE DEFINITIONS
 * 
 * World-class TypeScript types for centralized state management.
 * NO amateur any types, NO optional chaos, ONLY bulletproof interfaces.
 * 
 * Architecture principles:
 * - Single source of truth
 * - Immutable state patterns
 * - Professional error handling
 * - Type-safe throughout
 * - Performance optimized
 * 
 * @example
 * ```typescript
 * const useAppStore = create<AppStore>()((set, get) => ({
 *   // Professional store implementation
 * }));
 * ```
 */

import type { User } from '@supabase/supabase-js';

/**
 * Authentication State - Replaces amateur useState sprawl
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  sessionExpiresAt: Date | null;
  role: 'inspector' | 'auditor' | 'admin' | null;
}

/**
 * Property Data - Core business entity
 */
export interface Property {
  id: string;
  property_id: number;
  property_name: string;
  street_address: string;
  type: 'single_family' | 'apartment' | 'condo' | 'townhouse';
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  vrbo_url?: string;
  airbnb_url?: string;
  listing_images?: string[];
  created_at: string;
  created_by: string;
}

/**
 * Inspection Workflow State - Replaces 13+ useState chaos
 */
export interface InspectionWorkflowState {
  // Current workflow state
  currentStep: number;
  totalSteps: number;
  isComplete: boolean;
  
  // Selected property
  selectedProperty: Property | null;
  
  // Generated checklist
  checklist: ChecklistItem[] | null;
  checklistGenerated: boolean;
  estimatedTimeMinutes: number;
  
  // Current inspection session
  inspectionId: string | null;
  startTime: Date | null;
  
  // Photo capture progress
  photosRequired: number;
  photosCompleted: number;
  photosCaptured: MediaItem[];
  
  // Video recording state
  isRecording: boolean;
  videoRecorded: MediaItem | null;
  
  // Upload/sync progress
  syncProgress: number;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  
  // Error state
  error: string | null;
  retryCount: number;
}

/**
 * Checklist Item - Professional structure
 */
export interface ChecklistItem {
  id: string;
  static_safety_item_id: string;
  title: string;
  description: string;
  category: string;
  required: boolean;
  evidence_type: 'photo' | 'video' | 'none';
  gpt_prompt?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'not_applicable';
  inspector_notes?: string;
  ai_result?: string;
  confidence_score?: number;
  media_items: MediaItem[];
  completed_at?: Date;
}

/**
 * Media Item - File upload management
 */
export interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  file: File;
  blob_url: string;
  upload_status: 'pending' | 'uploading' | 'completed' | 'failed';
  upload_progress: number;
  upload_error?: string;
  supabase_path?: string;
  public_url?: string;
  ai_analysis?: {
    quality_score: number;
    issues: string[];
    suggestions: string[];
  };
  created_at: Date;
}

/**
 * Offline Sync State - Handles network interruptions
 */
export interface OfflineState {
  isOnline: boolean;
  syncQueue: SyncQueueItem[];
  lastSyncTime: Date | null;
  failedSyncAttempts: number;
  isSyncing: boolean;
}

export interface SyncQueueItem {
  id: string;
  type: 'inspection' | 'checklist_item' | 'media_upload';
  data: unknown;
  created_at: Date;
  retries: number;
  last_attempt?: Date;
  error?: string;
}

/**
 * Form State - Professional form management
 */
export interface FormState {
  activeForm: string | null;
  forms: Record<string, FormInstance>;
  isDirty: boolean;
  hasUnsavedChanges: boolean;
}

export interface FormInstance {
  id: string;
  type: 'bug_report' | 'property_form' | 'inspection_notes';
  data: Record<string, unknown>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
  lastModified: Date;
}

/**
 * UI State - Professional UI management
 */
export interface UIState {
  sidebarOpen: boolean;
  activeModal: string | null;
  notifications: Notification[];
  theme: 'light' | 'dark' | 'system';
  isMobile: boolean;
  currentRoute: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
  created_at: Date;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary';
}

/**
 * Store Action Types - Professional action patterns
 */
export interface AuthActions {
  setAuth: (auth: Partial<AuthState>) => void;
  login: (user: User) => void;
  logout: () => void;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

export interface InspectionActions {
  // Workflow control
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  resetWorkflow: () => void;
  
  // Property selection
  selectProperty: (property: Property) => void;
  
  // Checklist management
  setChecklist: (items: ChecklistItem[]) => void;
  updateChecklistItem: (id: string, updates: Partial<ChecklistItem>) => void;
  completeChecklistItem: (id: string, notes?: string) => void;
  
  // Media management
  addMedia: (media: MediaItem) => void;
  updateMediaUpload: (id: string, progress: number) => void;
  completeMediaUpload: (id: string, url: string) => void;
  failMediaUpload: (id: string, error: string) => void;
  
  // Inspection session
  startInspection: (propertyId: string) => Promise<string>;
  completeInspection: () => Promise<void>;
  
  // Video recording
  startRecording: () => void;
  stopRecording: (videoFile: File) => void;
  
  // Sync operations
  syncToServer: () => Promise<void>;
  setError: (error: string | null) => void;
}

export interface OfflineActions {
  setOnlineStatus: (isOnline: boolean) => void;
  addToSyncQueue: (item: Omit<SyncQueueItem, 'id' | 'created_at' | 'retries'>) => void;
  processSyncQueue: () => Promise<void>;
  clearSyncQueue: () => void;
  retryFailedSync: (itemId: string) => Promise<void>;
}

export interface UIActions {
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => void;
  removeNotification: (id: string) => void;
  setTheme: (theme: UIState['theme']) => void;
  setIsMobile: (isMobile: boolean) => void;
  setCurrentRoute: (route: string) => void;
}

/**
 * Complete Store Interfaces
 */
export interface AppStore extends AuthState, AuthActions {
  // Core application state
}

export interface InspectionStore extends InspectionWorkflowState, InspectionActions {
  // Inspection workflow state
}

export interface OfflineStore extends OfflineState, OfflineActions {
  // Offline sync state
}

export interface UIStore extends UIState, UIActions {
  // UI state management
}

/**
 * Store Persistence Configuration
 */
export interface StorePersistConfig {
  name: string;
  version: number;
  partialize?: (state: Record<string, unknown>) => Record<string, unknown>;
  migrate?: (persistedState: Record<string, unknown>, version: number) => Record<string, unknown>;
}

/**
 * Store Middleware Configuration
 */
export interface StoreMiddlewareConfig {
  enableLogging: boolean;
  enableDevtools: boolean;
  enablePersistence: boolean;
  persistConfig?: StorePersistConfig;
}