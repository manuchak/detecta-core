import { Font } from '@react-pdf/renderer';

let registered = false;

/**
 * Register Poppins font for all PDF documents.
 * Safe to call multiple times — only registers once.
 */
export function registerPDFFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: 'Poppins',
    fonts: [
      {
        src: 'https://fonts.gstatic.com/s/poppins/v22/pxiEyp8kv8JHgFVrFJA.ttf',
        fontWeight: 400,
      },
      {
        src: 'https://fonts.gstatic.com/s/poppins/v22/pxiByp8kv8JHgFVrLEj6V1s.ttf',
        fontWeight: 600,
      },
      {
        src: 'https://fonts.gstatic.com/s/poppins/v22/pxiByp8kv8JHgFVrLCz7V1s.ttf',
        fontWeight: 700,
      },
    ],
  });

  Font.registerHyphenationCallback((word) => [word]);
}

/** Font family constant for use in chart SVGs and inline styles */
export const PDF_FONT_FAMILY = 'Poppins';
