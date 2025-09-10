import { useState, useEffect } from 'react';

export interface SavedMapping {
  id: string;
  name: string;
  mapping: Record<string, string>;
  createdAt: string;
  lastUsed: string;
}

const MAPPING_STORAGE_KEY = 'custodian_services_mappings';
const LAST_MAPPING_KEY = 'custodian_services_last_mapping';

export const useSavedMappings = () => {
  const [savedMappings, setSavedMappings] = useState<SavedMapping[]>([]);
  const [currentMapping, setCurrentMapping] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = localStorage.getItem(MAPPING_STORAGE_KEY);
    if (stored) {
      try {
        setSavedMappings(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading saved mappings:', error);
      }
    }

    // Auto-load last used mapping
    const lastMapping = localStorage.getItem(LAST_MAPPING_KEY);
    if (lastMapping) {
      try {
        setCurrentMapping(JSON.parse(lastMapping));
      } catch (error) {
        console.error('Error loading last mapping:', error);
      }
    }
  }, []);

  const autoSaveMapping = (mapping: Record<string, string>) => {
    // Auto-save the current mapping
    localStorage.setItem(LAST_MAPPING_KEY, JSON.stringify(mapping));
    setCurrentMapping(mapping);
  };

  const saveMapping = (name: string, mapping: Record<string, string>) => {
    const newMapping: SavedMapping = {
      id: Date.now().toString(),
      name,
      mapping,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    };

    const updated = [...savedMappings, newMapping];
    setSavedMappings(updated);
    localStorage.setItem(MAPPING_STORAGE_KEY, JSON.stringify(updated));
    autoSaveMapping(mapping);
  };

  const deleteMapping = (id: string) => {
    const updated = savedMappings.filter(m => m.id !== id);
    setSavedMappings(updated);
    localStorage.setItem(MAPPING_STORAGE_KEY, JSON.stringify(updated));
  };

  const loadMapping = (id: string) => {
    const mapping = savedMappings.find(m => m.id === id);
    if (mapping) {
      // Update last used
      const updated = savedMappings.map(m => 
        m.id === id ? { ...m, lastUsed: new Date().toISOString() } : m
      );
      setSavedMappings(updated);
      localStorage.setItem(MAPPING_STORAGE_KEY, JSON.stringify(updated));
      autoSaveMapping(mapping.mapping);
      return mapping.mapping;
    }
    return {};
  };

  return {
    savedMappings,
    currentMapping,
    saveMapping,
    deleteMapping,
    loadMapping,
    autoSaveMapping,
  };
};