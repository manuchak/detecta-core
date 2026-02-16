import { StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS, PDF_FONT_SIZES, PDF_PAGE_CONFIG, PDF_SPACING } from './tokens';

/**
 * Shared stylesheet for the PDF design system.
 * Import individual styles or compose them in domain-specific components.
 */
export const pdfBaseStyles = StyleSheet.create({
  // ── Page ──
  page: {
    fontFamily: 'Inter',
    fontSize: PDF_FONT_SIZES.base,
    color: PDF_COLORS.black,
    paddingTop: PDF_PAGE_CONFIG.paddingTop,
    paddingBottom: PDF_PAGE_CONFIG.paddingBottom,
    paddingHorizontal: PDF_PAGE_CONFIG.paddingHorizontal,
  },

  // ── Report Header (fixed, top bar) ──
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: PDF_PAGE_CONFIG.headerHeight,
    backgroundColor: PDF_COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PDF_PAGE_CONFIG.paddingHorizontal,
  },
  headerLogo: {
    height: 28,
    maxWidth: 80,
    objectFit: 'contain',
    marginRight: 10,
  },
  headerTitle: {
    color: PDF_COLORS.black,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: PDF_COLORS.gray,
    fontSize: PDF_FONT_SIZES.sm,
    marginLeft: 'auto',
  },

  // ── Report Footer (fixed, bottom) ──
  footer: {
    position: 'absolute',
    bottom: 12,
    left: PDF_PAGE_CONFIG.paddingHorizontal,
    right: PDF_PAGE_CONFIG.paddingHorizontal,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: PDF_FONT_SIZES.xs,
    color: PDF_COLORS.gray,
  },

  // ── Section Header ──
  sectionHeader: {
    backgroundColor: PDF_COLORS.surface,
    paddingVertical: PDF_SPACING.sm,
    paddingHorizontal: 6,
    marginBottom: PDF_SPACING.md,
    marginTop: 6,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: PDF_FONT_SIZES.md,
    fontWeight: 700,
    color: PDF_COLORS.black,
  },

  // ── Field Row (label: value) ──
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingHorizontal: PDF_SPACING.sm,
  },
  fieldLabel: {
    width: 110,
    fontSize: PDF_FONT_SIZES.base,
    fontWeight: 600,
    color: PDF_COLORS.gray,
  },
  fieldValue: {
    flex: 1,
    fontSize: PDF_FONT_SIZES.base,
    color: PDF_COLORS.black,
  },

  // ── Paragraph ──
  paragraph: {
    fontSize: PDF_FONT_SIZES.base,
    color: PDF_COLORS.black,
    paddingHorizontal: PDF_SPACING.sm,
    marginBottom: 6,
    lineHeight: 1.5,
  },

  // ── KPI Card ──
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: PDF_SPACING.md,
    marginBottom: PDF_SPACING.lg,
  },
  kpiCard: {
    flex: 1,
    minWidth: 100,
    border: `1pt solid ${PDF_COLORS.border}`,
    borderRadius: 3,
    padding: PDF_SPACING.md,
  },
  kpiLabel: {
    fontSize: PDF_FONT_SIZES.xs,
    color: PDF_COLORS.gray,
    marginBottom: PDF_SPACING.xs,
  },
  kpiValue: {
    fontSize: PDF_FONT_SIZES.xl,
    fontWeight: 700,
    color: PDF_COLORS.black,
  },
  kpiTrend: {
    fontSize: PDF_FONT_SIZES.xs,
    marginTop: PDF_SPACING.xs,
  },

  // ── Data Table ──
  table: {
    marginBottom: PDF_SPACING.lg,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: PDF_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.border,
    paddingVertical: PDF_SPACING.sm,
    paddingHorizontal: PDF_SPACING.sm,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: PDF_COLORS.borderLight,
    paddingVertical: 3,
    paddingHorizontal: PDF_SPACING.sm,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: PDF_COLORS.borderLight,
    paddingVertical: 3,
    paddingHorizontal: PDF_SPACING.sm,
    backgroundColor: PDF_COLORS.backgroundSubtle,
  },
  tableCellHeader: {
    fontSize: PDF_FONT_SIZES.sm,
    fontWeight: 700,
    color: PDF_COLORS.black,
  },
  tableCell: {
    fontSize: PDF_FONT_SIZES.sm,
    color: PDF_COLORS.black,
  },
  tableCellMuted: {
    fontSize: PDF_FONT_SIZES.sm,
    color: PDF_COLORS.gray,
  },

  // ── Signature Block ──
  signatureBlock: {
    marginBottom: PDF_SPACING.md,
  },
  signatureTitle: {
    fontSize: PDF_FONT_SIZES.base,
    fontWeight: 700,
    marginBottom: PDF_SPACING.sm,
  },
  signatureImage: {
    width: 140,
    height: 56,
    marginBottom: PDF_SPACING.sm,
  },
  signatureMeta: {
    fontSize: PDF_FONT_SIZES.sm,
    color: PDF_COLORS.gray,
    marginBottom: 2,
  },

  // ── Status Badge ──
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: PDF_FONT_SIZES.xs,
    fontWeight: 600,
  },

  // ── Cover Page ──
  coverAccentTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: PDF_COLORS.red,
  },
  coverAccentBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: PDF_COLORS.red,
  },
  coverTitle: {
    fontSize: PDF_FONT_SIZES.display,
    color: PDF_COLORS.black,
    textAlign: 'center',
  },
  coverSubtitle: {
    fontSize: PDF_FONT_SIZES.hero,
    color: PDF_COLORS.black,
    textAlign: 'center',
  },
  coverPeriod: {
    fontSize: PDF_FONT_SIZES.xxl,
    color: PDF_COLORS.red,
    textAlign: 'center',
    marginTop: PDF_SPACING.xl,
  },
  coverMeta: {
    fontSize: PDF_FONT_SIZES.base,
    color: PDF_COLORS.gray,
  },
  coverBranding: {
    fontSize: PDF_FONT_SIZES.base,
    color: PDF_COLORS.grayMuted,
    textAlign: 'center',
  },
});
