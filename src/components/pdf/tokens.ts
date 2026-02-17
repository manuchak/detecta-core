/**
 * PDF Design System - Shared tokens for @react-pdf/renderer components
 * Used across all PDF reports: incidents, historical, billing, SIERCP
 */

/** Corporate color palette */
export const PDF_COLORS = {
  // Brand
  red: '#EB0000',
  black: '#191919',
  white: '#FFFFFF',

  // Neutrals
  gray: '#646464',
  grayLight: '#999999',
  grayMuted: '#A0A0A0',
  background: '#FAFAFA',
  backgroundSubtle: '#F8FAFC',
  surface: '#F0F0F0',
  border: '#DCDCDC',
  borderLight: '#E5E5E5',

  // Semantic
  success: '#22C55E',
  warning: '#EAB308',
  orange: '#F97316',
  danger: '#EF4444',
  info: '#3B82F6',
  locationBlue: '#6464A0',
} as const;

/** Severity color map */
export const PDF_SEVERITY_COLORS: Record<string, string> = {
  baja: PDF_COLORS.success,
  media: PDF_COLORS.warning,
  alta: PDF_COLORS.orange,
  critica: PDF_COLORS.danger,
};

/** Spacing scale (in points, ~1pt ≈ 0.35mm) */
export const PDF_SPACING = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 14,
  xl: 20,
  xxl: 32,
} as const;

/** Font sizes */
export const PDF_FONT_SIZES = {
  xs: 7,
  sm: 8,
  base: 9,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 20,
  hero: 28,
  display: 36,
} as const;

/** Standard page config */
export const PDF_PAGE_CONFIG = {
  size: 'A4' as const,
  paddingTop: 60,
  paddingBottom: 40,
  paddingHorizontal: 40,
  headerHeight: 42,
  footerHeight: 20,
} as const;
