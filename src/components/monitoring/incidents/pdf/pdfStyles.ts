import { StyleSheet } from '@react-pdf/renderer';

export const COLORS = {
  red: '#EB0000',
  black: '#191919',
  gray: '#646464',
  lightGray: '#F0F0F0',
  white: '#FFFFFF',
  border: '#DCDCDC',
  locationBlue: '#6464A0',
};

export const SEV_COLORS: Record<string, string> = {
  baja: '#22C55E',
  media: '#EAB308',
  alta: '#F97316',
  critica: '#EF4444',
};

export const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 9,
    color: '#191919',
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 40,
  },
  // ── Header (fixed) ──
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: '#EB0000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  headerLogo: {
    width: 26,
    height: 26,
    marginRight: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  headerId: {
    color: '#FFFFFF',
    fontSize: 8,
    marginLeft: 'auto',
    opacity: 0.9,
  },
  // ── Executive Summary ──
  summaryBox: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    border: '1pt solid #DCDCDC',
    borderRadius: 3,
    padding: 8,
    marginBottom: 14,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 7,
    color: '#646464',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: 700,
    color: '#191919',
  },
  sevDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 4,
  },
  sevRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // ── Sections ──
  sectionHeader: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 8,
    marginTop: 6,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#191919',
  },
  // ── Field rows ──
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingHorizontal: 4,
  },
  label: {
    width: 110,
    fontSize: 9,
    fontWeight: 600,
    color: '#646464',
  },
  value: {
    flex: 1,
    fontSize: 9,
    color: '#191919',
  },
  paragraph: {
    fontSize: 9,
    color: '#191919',
    paddingHorizontal: 4,
    marginBottom: 6,
    lineHeight: 1.5,
  },
  // ── Timeline ──
  timelineEntry: {
    marginBottom: 8,
    paddingLeft: 4,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  timelineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EB0000',
    marginRight: 6,
  },
  timelineTs: {
    fontSize: 8,
    fontWeight: 700,
    color: '#EB0000',
    marginRight: 8,
  },
  timelineType: {
    fontSize: 8,
    color: '#646464',
  },
  timelineDesc: {
    fontSize: 8,
    color: '#191919',
    paddingLeft: 13,
    lineHeight: 1.4,
    marginBottom: 2,
  },
  timelineLocation: {
    fontSize: 7,
    fontStyle: 'italic',
    color: '#6464A0',
    paddingLeft: 13,
    marginBottom: 2,
  },
  timelineImage: {
    width: 170,
    height: 128,
    marginLeft: 13,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#C8C8C8',
    borderRadius: 2,
  },
  // ── Signatures ──
  signatureBlock: {
    marginBottom: 10,
  },
  signatureTitle: {
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 4,
  },
  signatureImage: {
    width: 140,
    height: 56,
    marginBottom: 4,
  },
  signatureMeta: {
    fontSize: 8,
    color: '#646464',
    marginBottom: 2,
  },
  // ── Footer (fixed) ──
  footer: {
    position: 'absolute',
    bottom: 12,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#646464',
  },
});
