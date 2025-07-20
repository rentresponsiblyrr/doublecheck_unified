/**
 * PROFESSIONAL INSPECTION STORE TESTING - ZERO TOLERANCE STANDARDS
 * 
 * World-class unit tests for InspectionStore workflow management.
 * Tests complex state transitions, async operations, and error scenarios.
 * 
 * This is how professionals test complex state machines.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInspectionStore, useInspectionWorkflow, useInspectionActions } from '@/stores/inspectionStore';
import type { Property, ChecklistItem, MediaItem } from '@/stores/types';

// Mock dependencies
const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    upsert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
    })),
  },
};

const mockAppStore = {
  getState: vi.fn(() => ({
    user: { id: 'test-inspector-id' },
  })),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

vi.mock('@/stores/appStore', () => ({
  useAppStore: mockAppStore,
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('InspectionStore - Professional Workflow Testing', () => {
  // Test data factories
  const createMockProperty = (overrides: Partial<Property> = {}): Property => ({
    id: 'test-property-1',
    property_id: 123,
    property_name: 'Test Property',
    street_address: '123 Test St, Test City, TS 12345',
    type: 'single_family',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1500,
    created_at: '2024-01-01T00:00:00Z',
    created_by: 'test-creator',
    ...overrides,
  });

  const createMockChecklistItem = (overrides: Partial<ChecklistItem> = {}): ChecklistItem => ({
    id: 'test-item-1',
    static_safety_item_id: 'safety-item-1',
    title: 'Check Kitchen Faucet',
    description: 'Verify kitchen faucet is working properly',
    category: 'plumbing',
    required: true,
    evidence_type: 'photo',
    status: 'pending',
    media_items: [],
    ...overrides,
  });

  const createMockMediaItem = (overrides: Partial<MediaItem> = {}): MediaItem => ({
    id: 'test-media-1',
    type: 'photo',
    file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
    blob_url: 'blob:test-url',
    upload_status: 'pending',
    upload_progress: 0,
    created_at: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    // Reset store state
    useInspectionStore.getState().resetWorkflow();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initial State Validation', () => {
    it('should have correct initial workflow state', () => {
      const { result } = renderHook(() => useInspectionWorkflow());
      
      expect(result.current).toEqual({
        currentStep: 0,
        totalSteps: 5,
        isComplete: false,
        selectedProperty: null,
        progress: 0,
      });
    });

    it('should provide all required workflow actions', () => {
      const { result } = renderHook(() => useInspectionActions());
      
      const expectedActions = [
        'selectProperty',
        'setChecklist',
        'addMedia',
        'nextStep',
        'previousStep',
        'completeInspection',
        'syncToServer',
      ];
      
      expectedActions.forEach(action => {
        expect(result.current).toHaveProperty(action);
        expect(typeof result.current[action]).toBe('function');
      });
    });
  });

  describe('Professional Property Selection', () => {
    it('should select property and advance to next step', () => {
      const mockProperty = createMockProperty();
      const { result } = renderHook(() => useInspectionActions());
      
      act(() => {
        result.current.selectProperty(mockProperty);
      });

      const state = useInspectionStore.getState();
      
      expect(state.selectedProperty).toEqual(mockProperty);
      expect(state.currentStep).toBe(1);
      expect(state.error).toBeNull();
    });

    it('should calculate progress correctly after property selection', () => {
      const mockProperty = createMockProperty();
      const { result } = renderHook(() => useInspectionWorkflow());
      const { result: actions } = renderHook(() => useInspectionActions());
      
      act(() => {
        actions.current.selectProperty(mockProperty);
      });

      expect(result.current.progress).toBe(20); // 1/5 steps = 20%
    });
  });

  describe('Professional Checklist Management', () => {
    it('should set checklist and calculate metrics correctly', () => {
      const mockProperty = createMockProperty();
      const mockChecklist = [
        createMockChecklistItem({ evidence_type: 'photo' }),
        createMockChecklistItem({ 
          id: 'item-2',
          evidence_type: 'photo',
          title: 'Check Bathroom'
        }),
        createMockChecklistItem({ 
          id: 'item-3',
          evidence_type: 'none',
          title: 'Visual Inspection'
        }),
      ];

      const { result } = renderHook(() => useInspectionActions());
      
      act(() => {
        result.current.selectProperty(mockProperty);
        result.current.setChecklist(mockChecklist);
      });

      const state = useInspectionStore.getState();
      
      expect(state.checklist).toEqual(mockChecklist);
      expect(state.checklistGenerated).toBe(true);
      expect(state.photosRequired).toBe(2); // Only photo evidence items
      expect(state.estimatedTimeMinutes).toBe(9); // 3 items * 3 minutes
      expect(state.currentStep).toBe(2);
    });

    it('should update checklist item status and progress tracking', () => {
      const mockChecklist = [
        createMockChecklistItem({ evidence_type: 'photo' }),
        createMockChecklistItem({ 
          id: 'item-2',
          evidence_type: 'photo',
          title: 'Check Bathroom'
        }),
      ];

      const store = useInspectionStore.getState();
      
      act(() => {
        store.setChecklist(mockChecklist);
        store.updateChecklistItem('test-item-1', { status: 'completed' });
      });

      const state = useInspectionStore.getState();
      const updatedItem = state.checklist?.find(item => item.id === 'test-item-1');
      
      expect(updatedItem?.status).toBe('completed');
      expect(state.photosCompleted).toBe(1);
    });

    it('should complete checklist item with notes and timestamp', () => {
      const mockChecklist = [createMockChecklistItem()];
      const store = useInspectionStore.getState();
      
      act(() => {
        store.setChecklist(mockChecklist);
        store.completeChecklistItem('test-item-1', 'Everything looks good');
      });

      const state = useInspectionStore.getState();
      const completedItem = state.checklist?.find(item => item.id === 'test-item-1');
      
      expect(completedItem?.status).toBe('completed');
      expect(completedItem?.inspector_notes).toBe('Everything looks good');
      expect(completedItem?.completed_at).toBeInstanceOf(Date);
    });
  });

  describe('Professional Media Management', () => {
    it('should add media item and track correctly', () => {
      const mockMedia = createMockMediaItem();
      const { result } = renderHook(() => useInspectionActions());
      
      act(() => {
        result.current.addMedia(mockMedia);
      });

      const state = useInspectionStore.getState();
      
      expect(state.photosCaptured).toHaveLength(1);
      expect(state.photosCaptured[0]).toEqual(mockMedia);
    });

    it('should update media upload progress correctly', () => {
      const mockMedia = createMockMediaItem();
      const store = useInspectionStore.getState();
      
      act(() => {
        store.addMedia(mockMedia);
        store.updateMediaUpload('test-media-1', 50);
      });

      const state = useInspectionStore.getState();
      const updatedMedia = state.photosCaptured.find(item => item.id === 'test-media-1');
      
      expect(updatedMedia?.upload_progress).toBe(50);
      expect(updatedMedia?.upload_status).toBe('uploading');
    });

    it('should complete media upload with URL', () => {
      const mockMedia = createMockMediaItem();
      const store = useInspectionStore.getState();
      const testUrl = 'https://storage.example.com/photo.jpg';
      
      act(() => {
        store.addMedia(mockMedia);
        store.completeMediaUpload('test-media-1', testUrl);
      });

      const state = useInspectionStore.getState();
      const completedMedia = state.photosCaptured.find(item => item.id === 'test-media-1');
      
      expect(completedMedia?.upload_status).toBe('completed');
      expect(completedMedia?.upload_progress).toBe(100);
      expect(completedMedia?.public_url).toBe(testUrl);
    });

    it('should handle media upload failure', () => {
      const mockMedia = createMockMediaItem();
      const store = useInspectionStore.getState();
      const errorMessage = 'Upload failed due to network error';
      
      act(() => {
        store.addMedia(mockMedia);
        store.failMediaUpload('test-media-1', errorMessage);
      });

      const state = useInspectionStore.getState();
      const failedMedia = state.photosCaptured.find(item => item.id === 'test-media-1');
      
      expect(failedMedia?.upload_status).toBe('failed');
      expect(failedMedia?.upload_error).toBe(errorMessage);
    });
  });

  describe('Professional Inspection Session Management', () => {
    it('should start inspection session successfully', async () => {
      const mockProperty = createMockProperty();
      const mockInspection = { id: 'inspection-123' };
      
      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: mockInspection,
        error: null,
      });

      const { result } = renderHook(() => useInspectionActions());
      let inspectionId: string;
      
      await act(async () => {
        result.current.selectProperty(mockProperty);
        inspectionId = await useInspectionStore.getState().startInspection(mockProperty.id);
      });

      const state = useInspectionStore.getState();
      
      expect(inspectionId!).toBe('inspection-123');
      expect(state.inspectionId).toBe('inspection-123');
      expect(state.startTime).toBeInstanceOf(Date);
      expect(state.currentStep).toBe(1);
      expect(state.error).toBeNull();
      
      expect(mockSupabase.from).toHaveBeenCalledWith('inspections');
    });

    it('should handle inspection creation failure', async () => {
      const mockProperty = createMockProperty();
      
      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      });

      await act(async () => {
        try {
          await useInspectionStore.getState().startInspection(mockProperty.id);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      const state = useInspectionStore.getState();
      
      expect(state.error).toContain('Failed to create inspection');
      expect(state.inspectionId).toBeNull();
    });

    it('should complete inspection successfully', async () => {
      const store = useInspectionStore.getState();
      
      // Setup inspection session
      act(() => {
        store.setCurrentStep(4);
        store.setChecklist([createMockChecklistItem()]);
      });
      
      // Manually set inspection ID for testing
      act(() => {
        useInspectionStore.setState({ inspectionId: 'test-inspection' });
      });

      mockSupabase.from().update().eq.mockResolvedValueOnce({
        data: {},
        error: null,
      });

      await act(async () => {
        await store.completeInspection();
      });

      const state = useInspectionStore.getState();
      
      expect(state.isComplete).toBe(true);
      expect(state.isSyncing).toBe(false);
      expect(state.lastSyncTime).toBeInstanceOf(Date);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('inspections');
    });
  });

  describe('Professional Video Recording', () => {
    it('should start video recording', () => {
      const store = useInspectionStore.getState();
      
      act(() => {
        store.startRecording();
      });

      const state = useInspectionStore.getState();
      expect(state.isRecording).toBe(true);
    });

    it('should stop recording and create video media item', () => {
      const mockVideoFile = new File(['video-data'], 'test-video.mp4', { type: 'video/mp4' });
      const store = useInspectionStore.getState();
      
      act(() => {
        store.startRecording();
        store.stopRecording(mockVideoFile);
      });

      const state = useInspectionStore.getState();
      
      expect(state.isRecording).toBe(false);
      expect(state.videoRecorded).toBeDefined();
      expect(state.videoRecorded?.type).toBe('video');
      expect(state.videoRecorded?.file).toBe(mockVideoFile);
      expect(state.photosCaptured).toHaveLength(1);
      expect(state.currentStep).toBe(4);
    });
  });

  describe('Professional Sync Operations', () => {
    it('should sync checklist and media to server', async () => {
      const mockChecklist = [
        createMockChecklistItem({ status: 'completed' }),
        createMockChecklistItem({ 
          id: 'item-2',
          status: 'completed',
          inspector_notes: 'All good'
        }),
      ];
      
      const mockMedia = [
        createMockMediaItem({ upload_status: 'pending' }),
        createMockMediaItem({ 
          id: 'media-2',
          upload_status: 'failed'
        }),
      ];

      // Setup state
      act(() => {
        useInspectionStore.setState({
          inspectionId: 'test-inspection',
          checklist: mockChecklist,
          photosCaptured: mockMedia,
        });
      });

      // Mock successful database operations
      mockSupabase.from().upsert.mockResolvedValue({ error: null });
      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: 'test-path.jpg' },
        error: null,
      });
      mockSupabase.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.test.com/photo.jpg' },
      });

      const store = useInspectionStore.getState();
      
      await act(async () => {
        await store.syncToServer();
      });

      const state = useInspectionStore.getState();
      
      expect(state.isSyncing).toBe(false);
      expect(state.syncProgress).toBe(100);
      expect(state.lastSyncTime).toBeInstanceOf(Date);
      expect(state.error).toBeNull();
      
      // Verify database calls
      expect(mockSupabase.from).toHaveBeenCalledWith('logs');
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('inspection-media');
    });

    it('should handle sync failures gracefully', async () => {
      act(() => {
        useInspectionStore.setState({
          inspectionId: 'test-inspection',
          checklist: [createMockChecklistItem()],
        });
      });

      mockSupabase.from().upsert.mockResolvedValueOnce({
        error: { message: 'Sync failed' },
      });

      const store = useInspectionStore.getState();
      
      await act(async () => {
        try {
          await store.syncToServer();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      const state = useInspectionStore.getState();
      
      expect(state.error).toContain('Failed to sync checklist item');
      expect(state.isSyncing).toBe(false);
      expect(state.retryCount).toBe(1);
    });
  });

  describe('Professional Workflow Navigation', () => {
    it('should navigate steps correctly', () => {
      const store = useInspectionStore.getState();
      
      act(() => {
        store.nextStep();
      });
      expect(useInspectionStore.getState().currentStep).toBe(1);

      act(() => {
        store.nextStep();
        store.nextStep();
      });
      expect(useInspectionStore.getState().currentStep).toBe(3);

      act(() => {
        store.previousStep();
      });
      expect(useInspectionStore.getState().currentStep).toBe(2);
    });

    it('should not navigate beyond boundaries', () => {
      const store = useInspectionStore.getState();
      
      // Try to go below 0
      act(() => {
        store.previousStep();
      });
      expect(useInspectionStore.getState().currentStep).toBe(0);

      // Try to go above totalSteps - 1
      act(() => {
        store.setCurrentStep(4);
        store.nextStep();
      });
      expect(useInspectionStore.getState().currentStep).toBe(4);
    });

    it('should reset workflow completely', () => {
      const mockProperty = createMockProperty();
      const mockChecklist = [createMockChecklistItem()];
      
      act(() => {
        const store = useInspectionStore.getState();
        store.selectProperty(mockProperty);
        store.setChecklist(mockChecklist);
        store.addMedia(createMockMediaItem());
        store.setCurrentStep(3);
        store.setError('Test error');
      });

      // Verify state is populated
      expect(useInspectionStore.getState().selectedProperty).toBeDefined();
      expect(useInspectionStore.getState().checklist).toBeDefined();

      act(() => {
        useInspectionStore.getState().resetWorkflow();
      });

      const state = useInspectionStore.getState();
      
      expect(state.currentStep).toBe(0);
      expect(state.selectedProperty).toBeNull();
      expect(state.checklist).toBeNull();
      expect(state.photosCaptured).toHaveLength(0);
      expect(state.error).toBeNull();
      expect(state.isComplete).toBe(false);
    });
  });

  describe('Professional Performance & Edge Cases', () => {
    it('should handle rapid state updates without corruption', () => {
      const mockProperty = createMockProperty();
      const mockMedia = Array.from({ length: 10 }, (_, i) => 
        createMockMediaItem({ id: `media-${i}` })
      );

      act(() => {
        const store = useInspectionStore.getState();
        store.selectProperty(mockProperty);
        
        // Rapid media additions
        mockMedia.forEach(media => {
          store.addMedia(media);
        });
      });

      const state = useInspectionStore.getState();
      
      expect(state.photosCaptured).toHaveLength(10);
      expect(state.selectedProperty).toEqual(mockProperty);
    });

    it('should maintain state consistency during async operations', async () => {
      const store = useInspectionStore.getState();
      
      // Start multiple async operations
      const promises = [
        store.startInspection('prop-1').catch(() => {}),
        store.startInspection('prop-2').catch(() => {}),
        store.startInspection('prop-3').catch(() => {}),
      ];

      mockSupabase.from().insert().select().single
        .mockResolvedValueOnce({ data: { id: 'insp-1' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'insp-2' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'insp-3' }, error: null });

      await act(async () => {
        await Promise.allSettled(promises);
      });

      // Should have a consistent final state
      const state = useInspectionStore.getState();
      expect(state.inspectionId).toMatch(/^insp-\d$/);
    });
  });
});