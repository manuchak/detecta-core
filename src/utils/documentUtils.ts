// =====================================================
// Document Provider Detection and Embedding Utilities
// =====================================================

export type DocumentProvider = 
  | 'google_docs' 
  | 'google_slides' 
  | 'google_sheets'
  | 'office_online'
  | 'pdf_url'
  | 'storage'
  | 'other';

/**
 * Detecta el proveedor de un documento basándose en su URL
 */
export function detectDocumentProvider(url: string): DocumentProvider {
  if (!url) return 'other';
  
  const lowerUrl = url.toLowerCase();
  
  // Google Workspace
  if (lowerUrl.includes('docs.google.com/document')) return 'google_docs';
  if (lowerUrl.includes('docs.google.com/presentation')) return 'google_slides';
  if (lowerUrl.includes('docs.google.com/spreadsheets')) return 'google_sheets';
  
  // Microsoft Office Online
  if (lowerUrl.includes('onedrive.live.com') || lowerUrl.includes('sharepoint.com')) return 'office_online';
  
  // Supabase Storage
  if (lowerUrl.includes('supabase.co/storage')) return 'storage';
  
  // PDF files
  if (lowerUrl.endsWith('.pdf')) return 'pdf_url';
  
  return 'other';
}

/**
 * Determina el tipo de documento para almacenar en la base de datos
 */
export function getDocumentType(url: string): 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'google_docs' | 'google_slides' | 'google_sheets' | 'url' {
  const provider = detectDocumentProvider(url);
  const lowerUrl = url.toLowerCase();
  
  switch (provider) {
    case 'google_docs':
      return 'google_docs';
    case 'google_slides':
      return 'google_slides';
    case 'google_sheets':
      return 'google_sheets';
    case 'storage':
    case 'pdf_url':
      if (lowerUrl.endsWith('.pdf')) return 'pdf';
      if (lowerUrl.endsWith('.docx') || lowerUrl.endsWith('.doc')) return 'docx';
      if (lowerUrl.endsWith('.pptx') || lowerUrl.endsWith('.ppt')) return 'pptx';
      if (lowerUrl.endsWith('.xlsx') || lowerUrl.endsWith('.xls')) return 'xlsx';
      return 'pdf'; // Default for storage
    default:
      return 'url';
  }
}

/**
 * Convierte una URL de Google Docs/Slides/Sheets a formato embebible
 * Transforma URLs de /edit o /view a /preview para embedding
 */
export function getGoogleEmbedUrl(url: string): string {
  if (!url) return url;
  
  // Remover parámetros de query string
  let cleanUrl = url.split('?')[0];
  
  // Remover trailing slash
  cleanUrl = cleanUrl.replace(/\/$/, '');
  
  // Reemplazar /edit o /view con /preview
  if (cleanUrl.endsWith('/edit')) {
    cleanUrl = cleanUrl.replace(/\/edit$/, '/preview');
  } else if (cleanUrl.endsWith('/view')) {
    cleanUrl = cleanUrl.replace(/\/view$/, '/preview');
  } else if (!cleanUrl.endsWith('/preview')) {
    // Si no termina con ninguno, agregar /preview
    cleanUrl = cleanUrl + '/preview';
  }
  
  return cleanUrl;
}

/**
 * Verifica si una URL es de contenido de Google Workspace
 */
export function isGoogleWorkspaceUrl(url: string): boolean {
  const provider = detectDocumentProvider(url);
  return ['google_docs', 'google_slides', 'google_sheets'].includes(provider);
}

/**
 * Obtiene la URL apropiada para el visor según el tipo de documento
 */
export function getViewerUrl(url: string, tipo?: string): string | null {
  if (!url) return null;
  
  const provider = detectDocumentProvider(url);
  
  // Google Workspace - usar embed directo
  if (['google_docs', 'google_slides', 'google_sheets'].includes(provider) || 
      tipo === 'google_docs' || tipo === 'google_slides' || tipo === 'google_sheets') {
    return getGoogleEmbedUrl(url);
  }
  
  // PDFs - usar Google Docs Viewer como proxy
  if (provider === 'pdf_url' || provider === 'storage' || tipo === 'pdf') {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  }
  
  // Otros tipos no tienen visor embebido
  return null;
}
