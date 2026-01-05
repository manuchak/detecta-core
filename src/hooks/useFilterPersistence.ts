import { useState, useEffect, useCallback } from 'react';
import { ApprovalAdvancedFiltersState } from '@/components/leads/approval/ApprovalAdvancedFilters';

export interface SavedView {
  id: string;
  name: string;
  filters: ApprovalAdvancedFiltersState;
  quickFilter: string | null;
  activeTab: string;
  createdAt: string;
}

interface FilterPersistenceState {
  lastFilters: ApprovalAdvancedFiltersState | null;
  lastQuickFilter: string | null;
  lastActiveTab: string;
  savedViews: SavedView[];
}

const STORAGE_KEY = 'lead-approvals-filters';

const defaultState: FilterPersistenceState = {
  lastFilters: null,
  lastQuickFilter: null,
  lastActiveTab: 'pending',
  savedViews: [],
};

export const useFilterPersistence = () => {
  const [state, setState] = useState<FilterPersistenceState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading saved filters:', e);
    }
    return defaultState;
  });

  // Persist to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving filters:', e);
    }
  }, [state]);

  const saveCurrentFilters = useCallback((
    filters: ApprovalAdvancedFiltersState | null,
    quickFilter: string | null,
    activeTab: string
  ) => {
    setState(prev => ({
      ...prev,
      lastFilters: filters,
      lastQuickFilter: quickFilter,
      lastActiveTab: activeTab,
    }));
  }, []);

  const saveView = useCallback((name: string, filters: ApprovalAdvancedFiltersState | null, quickFilter: string | null, activeTab: string) => {
    const newView: SavedView = {
      id: crypto.randomUUID(),
      name,
      filters: filters as ApprovalAdvancedFiltersState,
      quickFilter,
      activeTab,
      createdAt: new Date().toISOString(),
    };
    
    setState(prev => ({
      ...prev,
      savedViews: [...prev.savedViews, newView],
    }));
    
    return newView;
  }, []);

  const deleteView = useCallback((viewId: string) => {
    setState(prev => ({
      ...prev,
      savedViews: prev.savedViews.filter(v => v.id !== viewId),
    }));
  }, []);

  const getLastFilters = useCallback(() => {
    return {
      filters: state.lastFilters,
      quickFilter: state.lastQuickFilter,
      activeTab: state.lastActiveTab,
    };
  }, [state.lastFilters, state.lastQuickFilter, state.lastActiveTab]);

  return {
    savedViews: state.savedViews,
    saveCurrentFilters,
    saveView,
    deleteView,
    getLastFilters,
  };
};
