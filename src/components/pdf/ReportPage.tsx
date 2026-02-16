import React from 'react';
import { Page } from '@react-pdf/renderer';
import { pdfBaseStyles } from './styles';
import { registerPDFFonts } from './fontSetup';
import { ReportHeader } from './ReportHeader';
import { ReportFooter } from './ReportFooter';

// Ensure fonts are registered
registerPDFFonts();

interface ReportPageProps {
  /** Header title */
  title: string;
  /** Header subtitle (right side) */
  subtitle?: string;
  /** Logo base64 */
  logoBase64?: string | null;
  /** Footer left text */
  footerText?: string;
  children: React.ReactNode;
}

/**
 * Pre-configured A4 page with header, footer, and Inter font.
 * Use this as the standard page wrapper for any report.
 */
export const ReportPage: React.FC<ReportPageProps> = ({
  title,
  subtitle,
  logoBase64,
  footerText,
  children,
}) => (
  <Page size="A4" style={pdfBaseStyles.page} wrap>
    <ReportHeader title={title} subtitle={subtitle} logoBase64={logoBase64} />
    <ReportFooter leftText={footerText} />
    {children}
  </Page>
);
