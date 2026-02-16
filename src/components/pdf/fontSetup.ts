import { Font } from '@react-pdf/renderer';

let registered = false;

/**
 * Register Inter font for all PDF documents.
 * Safe to call multiple times — only registers once.
 */
export function registerPDFFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: 'Inter',
    fonts: [
      {
        src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf',
        fontWeight: 400,
      },
      {
        src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hjQ.ttf',
        fontWeight: 600,
      },
      {
        src: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hjQ.ttf',
        fontWeight: 700,
      },
    ],
  });

  Font.registerHyphenationCallback((word) => [word]);
}
