import * as XLSX from 'xlsx';

export interface ParsedRow {
  rowIndex: number;
  raw: Record<string, any>;
}

export interface ParsedFile {
  headers: string[];
  rows: ParsedRow[];
  filename: string;
}

/**
 * Parses an Excel/CSV file and returns headers + rows
 */
export async function parseProviderFile(file: File): Promise<ParsedFile> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('El archivo no tiene hojas');

  const sheet = wb.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

  if (jsonData.length === 0) throw new Error('El archivo está vacío');

  const headers = Object.keys(jsonData[0]);
  const rows: ParsedRow[] = jsonData.map((raw, i) => ({ rowIndex: i + 2, raw }));

  return { headers, rows, filename: file.name };
}

/**
 * Column mapping: which provider column maps to which internal field
 */
export interface ColumnMapping {
  fecha: string;
  nombre_armado: string;
  ruta_destino: string;
  monto: string;
}

export const REQUIRED_MAPPINGS: { key: keyof ColumnMapping; label: string; description: string }[] = [
  { key: 'fecha', label: 'Fecha del servicio', description: 'Columna con la fecha' },
  { key: 'nombre_armado', label: 'Nombre del custodio', description: 'Columna con el nombre del armado/custodio' },
  { key: 'ruta_destino', label: 'Ruta / Destino', description: 'Columna con la ruta o destino' },
  { key: 'monto', label: 'Monto', description: 'Columna con el monto a pagar' },
];

/**
 * Normalize a string for fuzzy comparison
 */
function normalize(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Simple similarity score between two strings (Dice coefficient on bigrams)
 */
function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (!na || !nb) return 0;
  
  const bigramsA = new Set<string>();
  for (let i = 0; i < na.length - 1; i++) bigramsA.add(na.substring(i, i + 2));
  
  const bigramsB = new Set<string>();
  for (let i = 0; i < nb.length - 1; i++) bigramsB.add(nb.substring(i, i + 2));
  
  let intersection = 0;
  bigramsA.forEach(b => { if (bigramsB.has(b)) intersection++; });
  
  return (2 * intersection) / (bigramsA.size + bigramsB.size);
}

/**
 * Parse a date value from Excel (could be Date object or string)
 */
function parseDate(val: any): string | null {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().split('T')[0];
  const str = String(val).trim();
  // Try common formats
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[0];
  const dmyMatch = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
  if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
  const mdyMatch = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (mdyMatch) {
    const year = mdyMatch[3].length === 2 ? `20${mdyMatch[3]}` : mdyMatch[3];
    return `${year}-${mdyMatch[1].padStart(2, '0')}-${mdyMatch[2].padStart(2, '0')}`;
  }
  return null;
}

function parseMonto(val: any): number {
  if (typeof val === 'number') return val;
  const str = String(val).replace(/[$,\s]/g, '');
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

export interface DetectaRecord {
  asignacion_id: string;
  fecha: string;
  nombre_armado: string;
  ruta: string;
  monto: number;
}

export interface ProviderRecord {
  rowIndex: number;
  fecha: string | null;
  nombre_armado: string;
  ruta: string;
  monto: number;
  raw: Record<string, any>;
}

export type MatchResult = 'coincide' | 'discrepancia_monto' | 'solo_proveedor' | 'solo_detecta';

export interface ConciliacionLine {
  asignacion_id: string | null;
  fila_proveedor: Record<string, any> | null;
  resultado: MatchResult;
  monto_detecta: number | null;
  monto_proveedor: number | null;
  diferencia: number | null;
  // For display
  fecha: string | null;
  nombre: string;
  ruta: string;
  confidence?: number;
}

const MATCH_THRESHOLD = 0.5;
const AMOUNT_TOLERANCE = 0.01;

/**
 * Run the reconciliation engine
 */
export function runConciliacion(
  detectaRecords: DetectaRecord[],
  providerRows: ParsedRow[],
  mapping: ColumnMapping,
): ConciliacionLine[] {
  // Parse provider rows using mapping
  const provRecords: ProviderRecord[] = providerRows.map(r => ({
    rowIndex: r.rowIndex,
    fecha: parseDate(r.raw[mapping.fecha]),
    nombre_armado: String(r.raw[mapping.nombre_armado] || ''),
    ruta: String(r.raw[mapping.ruta_destino] || ''),
    monto: parseMonto(r.raw[mapping.monto]),
    raw: r.raw,
  }));

  const results: ConciliacionLine[] = [];
  const matchedDetecta = new Set<number>();
  const matchedProvider = new Set<number>();

  // Try to match each provider record to a detecta record
  for (let pi = 0; pi < provRecords.length; pi++) {
    const prov = provRecords[pi];
    let bestMatch = -1;
    let bestScore = 0;

    for (let di = 0; di < detectaRecords.length; di++) {
      if (matchedDetecta.has(di)) continue;
      const det = detectaRecords[di];

      // Date match (exact or ±1 day)
      let dateScore = 0;
      if (prov.fecha && det.fecha) {
        if (prov.fecha === det.fecha) {
          dateScore = 1;
        } else {
          const pd = new Date(prov.fecha).getTime();
          const dd = new Date(det.fecha).getTime();
          const diffDays = Math.abs(pd - dd) / (86400000);
          if (diffDays <= 1) dateScore = 0.7;
        }
      }

      // Name match
      const nameScore = similarity(prov.nombre_armado, det.nombre_armado);

      // Route match
      const routeScore = similarity(prov.ruta, det.ruta);

      // Weighted score: date 40%, name 40%, route 20%
      const score = dateScore * 0.4 + nameScore * 0.4 + routeScore * 0.2;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = di;
      }
    }

    if (bestMatch >= 0 && bestScore >= MATCH_THRESHOLD) {
      const det = detectaRecords[bestMatch];
      const diff = prov.monto - det.monto;
      const isExactMatch = Math.abs(diff) <= AMOUNT_TOLERANCE;

      results.push({
        asignacion_id: det.asignacion_id,
        fila_proveedor: prov.raw,
        resultado: isExactMatch ? 'coincide' : 'discrepancia_monto',
        monto_detecta: det.monto,
        monto_proveedor: prov.monto,
        diferencia: Math.round(diff * 100) / 100,
        fecha: prov.fecha || det.fecha,
        nombre: det.nombre_armado || prov.nombre_armado,
        ruta: det.ruta || prov.ruta,
        confidence: bestScore,
      });

      matchedDetecta.add(bestMatch);
      matchedProvider.add(pi);
    }
  }

  // Unmatched provider records → solo_proveedor
  for (let pi = 0; pi < provRecords.length; pi++) {
    if (matchedProvider.has(pi)) continue;
    const prov = provRecords[pi];
    results.push({
      asignacion_id: null,
      fila_proveedor: prov.raw,
      resultado: 'solo_proveedor',
      monto_detecta: null,
      monto_proveedor: prov.monto,
      diferencia: null,
      fecha: prov.fecha,
      nombre: prov.nombre_armado,
      ruta: prov.ruta,
    });
  }

  // Unmatched detecta records → solo_detecta
  for (let di = 0; di < detectaRecords.length; di++) {
    if (matchedDetecta.has(di)) continue;
    const det = detectaRecords[di];
    results.push({
      asignacion_id: det.asignacion_id,
      fila_proveedor: null,
      resultado: 'solo_detecta',
      monto_detecta: det.monto,
      monto_proveedor: null,
      diferencia: null,
      fecha: det.fecha,
      nombre: det.nombre_armado,
      ruta: det.ruta,
    });
  }

  return results;
}
