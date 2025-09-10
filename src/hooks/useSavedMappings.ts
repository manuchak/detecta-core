import { useState, useEffect } from 'react';

export interface SavedMapping {
  id: string;
  name: string;
  mapping: Record<string, string>;
  createdAt: string;
}

const MAPPING_STORAGE_KEY = 'custodian_services_mappings';

export const useSavedMappings = () => {
  const [savedMappings, setSavedMappings] = useState<SavedMapping[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(MAPPING_STORAGE_KEY);
    if (stored) {
      try {
        setSavedMappings(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading saved mappings:', error);
      }
    }
  }, []);

  const saveMapping = (name: string, mapping: Record<string, string>) => {
    const newMapping: SavedMapping = {
      id: Date.now().toString(),
      name,
      mapping,
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedMappings, newMapping];
    setSavedMappings(updated);
    localStorage.setItem(MAPPING_STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteMapping = (id: string) => {
    const updated = savedMappings.filter(m => m.id !== id);
    setSavedMappings(updated);
    localStorage.setItem(MAPPING_STORAGE_KEY, JSON.stringify(updated));
  };

  const loadMapping = (id: string) => {
    return savedMappings.find(m => m.id === id)?.mapping || {};
  };

  return {
    savedMappings,
    saveMapping,
    deleteMapping,
    loadMapping,
  };
};