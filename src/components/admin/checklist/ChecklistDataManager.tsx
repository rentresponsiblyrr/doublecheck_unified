import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger/production-logger";
import {
  ChecklistItem,
  ChecklistFilters,
  SystemHealth,
  ChecklistStats,
} from "./types";

interface ChecklistDataManagerProps {
  children: (props: {
    items: ChecklistItem[];
    filteredItems: ChecklistItem[];
    stats: ChecklistStats;
    systemHealth: SystemHealth;
    isLoading: boolean;
    error: string | null;
    onRefresh: () => void;
    onItemCreate: (item: ChecklistFormData) => Promise<void>;
    onItemUpdate: (id: string, item: ChecklistFormData) => Promise<void>;
    onItemDelete: (id: string) => Promise<void>;
    onFiltersChange: (filters: ChecklistFilters) => void;
  }) => React.ReactNode;
}

interface ChecklistFormData {
  label: string;
  category: string;
  required: boolean;
  evidence_type: string;
  gpt_prompt?: string;
}

export const ChecklistDataManager: React.FC<ChecklistDataManagerProps> = ({
  children,
}) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ChecklistItem[]>([]);
  const [filters, setFilters] = useState<ChecklistFilters>({
    search: "",
    category: "",
    evidenceType: "",
    status: "",
  });
  const [stats, setStats] = useState<ChecklistStats>({
    total: 0,
    active: 0,
    deleted: 0,
    required: 0,
    byCategory: {},
    byEvidenceType: {},
  });
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    tableExists: false,
    hasData: false,
    hasPermissions: false,
    canConnect: false,
    lastChecked: new Date(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSystemHealth = useCallback(async (): Promise<SystemHealth> => {
    try {
      const { data, error: healthError } = await supabase
        .from("static_safety_items")
        .select("id")
        .limit(1);

      const health: SystemHealth = {
        tableExists: !healthError,
        hasData: Boolean(data && data.length > 0),
        hasPermissions: !healthError,
        canConnect: !healthError,
        lastChecked: new Date(),
      };

      return health;
    } catch (error) {
      logger.error("System health check failed", {
        component: "ChecklistDataManager",
        error: (error as Error).message,
        action: "health_check",
      });

      return {
        tableExists: false,
        hasData: false,
        hasPermissions: false,
        canConnect: false,
        lastChecked: new Date(),
      };
    }
  }, []);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: loadError } = await supabase
        .from("static_safety_items")
        .select("*")
        .order("label");

      if (loadError) throw loadError;

      setItems(data || []);

      logger.info("Checklist items loaded successfully", {
        component: "ChecklistDataManager",
        count: data?.length || 0,
        action: "data_load",
      });
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);

      logger.error("Failed to load checklist items", {
        component: "ChecklistDataManager",
        error: errorMessage,
        action: "data_load",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const calculateStats = useCallback(
    (checklistItems: ChecklistItem[]): ChecklistStats => {
      return checklistItems.reduce(
        (acc, item) => {
          acc.total++;

          if (item.deleted) {
            acc.deleted++;
          } else {
            acc.active++;
          }

          if (item.required) {
            acc.required++;
          }

          acc.byCategory[item.category] =
            (acc.byCategory[item.category] || 0) + 1;
          acc.byEvidenceType[item.evidence_type] =
            (acc.byEvidenceType[item.evidence_type] || 0) + 1;

          return acc;
        },
        {
          total: 0,
          active: 0,
          deleted: 0,
          required: 0,
          byCategory: {} as Record<string, number>,
          byEvidenceType: {} as Record<string, number>,
        },
      );
    },
    [],
  );

  const applyFilters = useCallback(
    (checklistItems: ChecklistItem[], filterOptions: ChecklistFilters) => {
      return checklistItems.filter((item) => {
        if (
          filterOptions.search &&
          !item.label.toLowerCase().includes(filterOptions.search.toLowerCase())
        ) {
          return false;
        }
        if (
          filterOptions.category &&
          item.category !== filterOptions.category
        ) {
          return false;
        }
        if (
          filterOptions.evidenceType &&
          item.evidence_type !== filterOptions.evidenceType
        ) {
          return false;
        }
        if (filterOptions.status === "active" && item.deleted) {
          return false;
        }
        if (filterOptions.status === "deleted" && !item.deleted) {
          return false;
        }
        return true;
      });
    },
    [],
  );

  useEffect(() => {
    const initializeData = async () => {
      const health = await checkSystemHealth();
      setSystemHealth(health);

      if (health.canConnect) {
        await loadItems();
      }
    };

    initializeData();
  }, [checkSystemHealth, loadItems]);

  useEffect(() => {
    const filtered = applyFilters(items, filters);
    setFilteredItems(filtered);
    setStats(calculateStats(items));
  }, [items, filters, applyFilters, calculateStats]);

  const handleItemCreate = useCallback(
    async (formData: ChecklistFormData) => {
      try {
        const { data, error: createError } = await supabase
          .from("static_safety_items")
          .insert([formData])
          .select();

        if (createError) throw createError;

        await loadItems();

        logger.info("Checklist item created", {
          component: "ChecklistDataManager",
          itemId: data?.[0]?.id,
          action: "item_create",
        });
      } catch (err) {
        const errorMessage = (err as Error).message;
        setError(errorMessage);

        logger.error("Failed to create checklist item", {
          component: "ChecklistDataManager",
          error: errorMessage,
          action: "item_create",
        });
        throw err;
      }
    },
    [loadItems],
  );

  const handleItemUpdate = useCallback(
    async (id: string, formData: ChecklistFormData) => {
      try {
        const { error: updateError } = await supabase
          .from("static_safety_items")
          .update(formData)
          .eq("id", id);

        if (updateError) throw updateError;

        await loadItems();

        logger.info("Checklist item updated", {
          component: "ChecklistDataManager",
          itemId: id,
          action: "item_update",
        });
      } catch (err) {
        const errorMessage = (err as Error).message;
        setError(errorMessage);

        logger.error("Failed to update checklist item", {
          component: "ChecklistDataManager",
          error: errorMessage,
          itemId: id,
          action: "item_update",
        });
        throw err;
      }
    },
    [loadItems],
  );

  const handleItemDelete = useCallback(
    async (id: string) => {
      try {
        const { error: deleteError } = await supabase
          .from("static_safety_items")
          .update({ deleted: true })
          .eq("id", id);

        if (deleteError) throw deleteError;

        await loadItems();

        logger.info("Checklist item deleted", {
          component: "ChecklistDataManager",
          itemId: id,
          action: "item_delete",
        });
      } catch (err) {
        const errorMessage = (err as Error).message;
        setError(errorMessage);

        logger.error("Failed to delete checklist item", {
          component: "ChecklistDataManager",
          error: errorMessage,
          itemId: id,
          action: "item_delete",
        });
        throw err;
      }
    },
    [loadItems],
  );

  const handleRefresh = useCallback(async () => {
    const health = await checkSystemHealth();
    setSystemHealth(health);
    if (health.canConnect) {
      await loadItems();
    }
  }, [checkSystemHealth, loadItems]);

  return (
    <>
      {children({
        items,
        filteredItems,
        stats,
        systemHealth,
        isLoading,
        error,
        onRefresh: handleRefresh,
        onItemCreate: handleItemCreate,
        onItemUpdate: handleItemUpdate,
        onItemDelete: handleItemDelete,
        onFiltersChange: setFilters,
      })}
    </>
  );
};
