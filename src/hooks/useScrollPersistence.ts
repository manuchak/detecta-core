import { useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';

interface UseScrollPersistenceOptions {
  key: string;
  enabled?: boolean;
  debounceMs?: number;
}

/**
 * Hook para persistir y restaurar la posición de scroll.
 * Usa sessionStorage para que se limpie al cerrar la pestaña.
 */
export function useScrollPersistence({
  key,
  enabled = true,
  debounceMs = 200
}: UseScrollPersistenceOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Guardar posición de scroll con debounce
  const saveScrollPosition = useCallback(() => {
    if (!enabled || !containerRef.current) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      const scrollTop = containerRef.current?.scrollTop || 0;
      sessionStorage.setItem(`scroll_${key}`, scrollTop.toString());
    }, debounceMs);
  }, [key, enabled, debounceMs]);

  // Restaurar posición de scroll
  const restoreScrollPosition = useCallback(() => {
    if (!enabled || !containerRef.current) return;
    
    const savedScroll = sessionStorage.getItem(`scroll_${key}`);
    if (savedScroll) {
      const scrollTop = parseInt(savedScroll, 10);
      if (!isNaN(scrollTop)) {
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = scrollTop;
          }
        });
      }
    }
  }, [key, enabled]);

  // Limpiar posición guardada (útil al cambiar de fecha/contexto)
  const clearScrollPosition = useCallback(() => {
    sessionStorage.removeItem(`scroll_${key}`);
  }, [key]);

  // Configurar listener de scroll
  useEffect(() => {
    if (!enabled) return;
    
    const container = containerRef.current;
    if (!container) return;

    // Restaurar al montar
    restoreScrollPosition();

    // Guardar en cada scroll
    const handleScroll = () => saveScrollPosition();
    container.addEventListener('scroll', handleScroll, { passive: true });

    // Guardar antes de salir de la página
    const handleBeforeUnload = () => {
      if (container) {
        sessionStorage.setItem(`scroll_${key}`, container.scrollTop.toString());
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [key, enabled, saveScrollPosition, restoreScrollPosition]);

  return {
    containerRef,
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition
  };
}

/**
 * Helper para generar key de scroll basado en la fecha seleccionada
 */
export function getScrollKeyForDate(date: Date): string {
  return `planeacion_${format(date, 'yyyy-MM-dd')}`;
}
