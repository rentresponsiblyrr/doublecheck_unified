/**
 * Data Service - Consolidated Database Operations
 * Handles all data operations for properties, inspections, checklists, users
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { dataValidation } from '../dataValidationService';
import { errorRecovery, withErrorRecovery } from '../errorRecoveryService';

export interface Property {
  id: string;
  name: string;
  address: string;
  vrbo_url?: string;
  airbnb_url?: string;
  status: string;
  added_by: string;
  created_at: string;
  updated_at: string;
}

// Legacy ProductionProperty type for compatibility
export interface ProductionProperty {
  property_id: string;
  name: string;
  property_address: string;
  property_vrbo_url?: string;
  property_airbnb_url?: string;
  property_status: string;
  property_created_at: string;
  inspection_count: number;
}

export interface Inspection {
  id: string;
  property_id: string;
  inspector_id?: string;
  status: string;
  start_time?: string;
  end_time?: string;
  completed: boolean;
  certification_status?: string;
  auditor_feedback?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  inspection_id: string;
  label: string;
  category?: string;
  status?: string;
  notes?: string;
  ai_status?: string;
  static_item_id?: string;
  created_at: string;
}

// Legacy ProductionUser type for compatibility
export interface ProductionUser {
  id: string;
  name: string;
  role: string;
  email: string;
  created_at: string;
  updated_at: string;
  status: string;
  last_login_at?: string;
  phone?: string;
}

// Legacy ProductionSafetyItem type for compatibility
export interface ProductionSafetyItem {
  id: string;
  checklist_id?: number;
  label?: string;
  category: string;
  evidence_type?: string;
  gpt_prompt?: string;
  notes?: string;
  required: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export class DataService {
  private static instance: DataService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  async initialize(): Promise<void> {
    logger.info('DataService initialized');
  }

  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await supabase.from('properties').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  // ============================================
  // PROPERTY OPERATIONS
  // ============================================

  async getProperties(filters?: {
    status?: string;
    added_by?: string;
    search?: string;
  }): Promise<Property[]> {
    const cacheKey = `properties_${JSON.stringify(filters)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    return withErrorRecovery(async () => {
      let query = supabase.from('properties').select('*');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.added_by) {
        query = query.eq('added_by', filters.added_by);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      this.setCache(cacheKey, data);
      return data || [];
    }, {
      operation: 'get_properties',
      data: filters,
      timestamp: new Date()
    });
  }

  async getProperty(id: string): Promise<Property | null> {
    const cacheKey = `property_${id}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    return withErrorRecovery(async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      this.setCache(cacheKey, data);
      return data;
    }, {
      operation: 'get_property',
      data: { id },
      timestamp: new Date()
    });
  }

  async createProperty(property: Partial<Property>): Promise<Property> {
    const validation = dataValidation.validateProperty(property, 'create');
    if (!validation.success) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
    }

    return withErrorRecovery(async () => {
      const { data, error } = await supabase
        .from('properties')
        .insert(validation.data)
        .select()
        .single();

      if (error) throw error;

      this.invalidateCache('properties');
      return data;
    }, {
      operation: 'create_property',
      data: property,
      timestamp: new Date()
    });
  }

  async updateProperty(id: string, updates: Partial<Property>): Promise<Property> {
    const validation = dataValidation.validateProperty({ ...updates, id }, 'update');
    if (!validation.success) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
    }

    return withErrorRecovery(async () => {
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      this.invalidateCache('properties');
      this.invalidateCache(`property_${id}`);
      return data;
    }, {
      operation: 'update_property',
      data: { id, updates },
      timestamp: new Date()
    });
  }

  // ============================================
  // INSPECTION OPERATIONS
  // ============================================

  async getInspections(filters?: {
    property_id?: string;
    inspector_id?: string;
    status?: string;
    include_items?: boolean;
  }): Promise<Inspection[]> {
    const cacheKey = `inspections_${JSON.stringify(filters)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    return withErrorRecovery(async () => {
      let query = supabase.from('inspections').select(
        filters?.include_items ? `
          *,
          properties!inner (*),
          checklist_items (
            *,
            media (*)
          )
        ` : '*'
      );

      if (filters?.property_id) {
        query = query.eq('property_id', filters.property_id);
      }
      if (filters?.inspector_id) {
        query = query.eq('inspector_id', filters.inspector_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      this.setCache(cacheKey, data);
      return data || [];
    }, {
      operation: 'get_inspections',
      data: filters,
      timestamp: new Date()
    });
  }

  async getInspection(id: string, includeDetails: boolean = false): Promise<Inspection | null> {
    const cacheKey = `inspection_${id}_${includeDetails}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    return withErrorRecovery(async () => {
      const { data, error } = await supabase
        .from('inspections')
        .select(includeDetails ? `
          *,
          properties!inner (*),
          checklist_items (
            *,
            static_safety_items (*),
            media (*)
          ),
          users!inspector_id (*)
        ` : '*')
        .eq('id', id)
        .single();

      if (error) throw error;

      this.setCache(cacheKey, data);
      return data;
    }, {
      operation: 'get_inspection',
      data: { id, includeDetails },
      timestamp: new Date()
    });
  }

  async createInspection(inspection: Partial<Inspection>): Promise<Inspection> {
    const validation = dataValidation.validateInspection(inspection, 'create');
    if (!validation.success) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
    }

    return withErrorRecovery(async () => {
      const { data, error } = await supabase
        .from('inspections')
        .insert(validation.data)
        .select()
        .single();

      if (error) throw error;

      this.invalidateCache('inspections');
      return data;
    }, {
      operation: 'create_inspection',
      data: inspection,
      timestamp: new Date()
    });
  }

  async updateInspection(id: string, updates: Partial<Inspection>): Promise<Inspection> {
    const validation = dataValidation.validateInspection({ ...updates, id }, 'update');
    if (!validation.success) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
    }

    return withErrorRecovery(async () => {
      const { data, error } = await supabase
        .from('inspections')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      this.invalidateCache('inspections');
      this.invalidateCache(`inspection_${id}`);
      return data;
    }, {
      operation: 'update_inspection',
      data: { id, updates },
      timestamp: new Date()
    });
  }

  // ============================================
  // CHECKLIST OPERATIONS
  // ============================================

  async getChecklistItems(inspectionId: string): Promise<ChecklistItem[]> {
    const cacheKey = `checklist_${inspectionId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    return withErrorRecovery(async () => {
      const { data, error } = await supabase
        .from('checklist_items')
        .select(`
          *,
          static_safety_items (*),
          media (*)
        `)
        .eq('inspection_id', inspectionId)
        .order('category', { ascending: true });

      if (error) throw error;

      this.setCache(cacheKey, data);
      return data || [];
    }, {
      operation: 'get_checklist_items',
      data: { inspectionId },
      timestamp: new Date()
    });
  }

  async updateChecklistItem(id: string, updates: any): Promise<ChecklistItem> {
    const validation = dataValidation.validateChecklistItemUpdate({
      ...updates,
      last_modified_by: (await supabase.auth.getUser()).data.user?.id,
      last_modified_at: new Date().toISOString()
    });

    if (!validation.success) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
    }

    return withErrorRecovery(async () => {
      const { data, error } = await supabase
        .from('checklist_items')
        .update(validation.data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Invalidate related caches
      if (data) {
        this.invalidateCache(`checklist_${data.inspection_id}`);
      }

      return data;
    }, {
      operation: 'update_checklist_item',
      data: { id, updates },
      timestamp: new Date()
    });
  }

  async createChecklistItems(items: Partial<ChecklistItem>[]): Promise<ChecklistItem[]> {
    return withErrorRecovery(async () => {
      const { data, error } = await supabase
        .from('checklist_items')
        .insert(items)
        .select();

      if (error) throw error;

      // Invalidate cache for affected inspections
      const inspectionIds = new Set(items.map(item => item.inspection_id));
      inspectionIds.forEach(id => {
        if (id) this.invalidateCache(`checklist_${id}`);
      });

      return data || [];
    }, {
      operation: 'create_checklist_items',
      data: { count: items.length },
      timestamp: new Date()
    });
  }

  // ============================================
  // USER OPERATIONS
  // ============================================

  async getUsers(filters?: {
    role?: string;
    status?: string;
  }): Promise<User[]> {
    const cacheKey = `users_${JSON.stringify(filters)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    return withErrorRecovery(async () => {
      let query = supabase.from('users').select('*');

      if (filters?.role) {
        query = query.eq('role', filters.role);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      this.setCache(cacheKey, data);
      return data || [];
    }, {
      operation: 'get_users',
      data: filters,
      timestamp: new Date()
    });
  }

  async getUser(id: string): Promise<User | null> {
    const cacheKey = `user_${id}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    return withErrorRecovery(async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      this.setCache(cacheKey, data);
      return data;
    }, {
      operation: 'get_user',
      data: { id },
      timestamp: new Date()
    });
  }

  // ============================================
  // CACHE MANAGEMENT
  // ============================================

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      logger.debug('Cache hit', { key });
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  getMetrics() {
    return {
      cacheSize: this.cache.size,
      cacheKeys: Array.from(this.cache.keys())
    };
  }

  async cleanup(): Promise<void> {
    this.cache.clear();
  }
}

export const dataService = DataService.getInstance();