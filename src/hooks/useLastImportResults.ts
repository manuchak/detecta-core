import { useState, useEffect } from 'react';
import { CustodianServiceImportResult } from '@/services/custodianServicesImportService';

const STORAGE_KEY = 'last_import_results';

export interface StoredImportResult extends CustodianServiceImportResult {
  timestamp: string;
  filename?: string;
}

export const useLastImportResults = () => {
  const [lastResults, setLastResults] = useState<StoredImportResult | null>(null);

  useEffect(() => {
    // Load from localStorage on mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setLastResults(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading last import results:', error);
    }
  }, []);

  const saveResults = (results: CustodianServiceImportResult, filename?: string) => {
    const storedResult: StoredImportResult = {
      ...results,
      timestamp: new Date().toISOString(),
      filename
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedResult));
      setLastResults(storedResult);
    } catch (error) {
      console.error('Error saving import results:', error);
    }
  };

  const clearResults = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setLastResults(null);
    } catch (error) {
      console.error('Error clearing import results:', error);
    }
  };

  return {
    lastResults,
    saveResults,
    clearResults
  };
};