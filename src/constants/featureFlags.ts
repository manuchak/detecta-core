/**
 * Feature Flags for Detecta Core
 * 
 * These flags control feature availability and enable safe rollbacks.
 * Set to false to revert to legacy behavior during emergencies.
 */

export const FEATURE_FLAGS = {
  /**
   * Service Creation System Migration
   * 
   * When TRUE: Uses the new full-page ServiceCreation workflow at /planeacion/nuevo-servicio
   * When FALSE: Uses the legacy modal-based RequestCreationWorkflow
   * 
   * @deprecated Legacy system - flag will be removed after 2026-02-01 once migration is confirmed stable
   * @see src/pages/Planeacion/DEPRECATED.md for migration details
   */
  USE_NEW_SERVICE_CREATION: true,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;
