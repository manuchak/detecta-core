import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsConfig {
  onSelectItem?: (index: number) => void;
  onNewService?: () => void;
  onRefresh?: () => void;
  itemsCount?: number;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onSelectItem,
  onNewService,
  onRefresh,
  itemsCount = 5,
  enabled = true
}: KeyboardShortcutsConfig) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    // Ignorar si hay input/textarea activo
    if (
      e.target instanceof HTMLInputElement || 
      e.target instanceof HTMLTextAreaElement ||
      (e.target as HTMLElement).isContentEditable
    ) {
      return;
    }
    
    // Ignorar si hay modal abierto
    const hasDialogFlag = document.body.dataset.dialogOpen === "1" || 
                         document.body.dataset.dialogTransitioning === "1";
    const hasOpenDialog = !!document.querySelector(
      '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]'
    );
    
    if (hasDialogFlag || hasOpenDialog) return;

    const key = e.key.toLowerCase();
    
    // Números 1-5 para selección rápida
    if (/^[1-5]$/.test(key) && onSelectItem) {
      const index = parseInt(key) - 1;
      if (index < itemsCount) {
        e.preventDefault();
        onSelectItem(index);
      }
    }
    
    // 'n' para nuevo servicio
    if (key === 'n' && onNewService) {
      e.preventDefault();
      onNewService();
    }
    
    // 'r' para refrescar
    if (key === 'r' && onRefresh) {
      e.preventDefault();
      onRefresh();
    }
  }, [enabled, onSelectItem, onNewService, onRefresh, itemsCount]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
