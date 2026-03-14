import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ParsedMaestro {
  reglas: ParsedReglaFacturacion[];
  contactos: ParsedContacto[];
  estadias: ParsedEstadia[];
  portales: ParsedPortal[];
  serviciosMonitoring: ParsedMonitoring[];
}

export interface ParsedReglaFacturacion {
  clienteNombre: string;
  corte: string | null;
  inmediata: string | null;
  portal: string | null;
  descripcion: string | null;
  observaciones: string | null;
  prefactura: string | null;
  fechaEntrega: string | null;
  estadias: string | null;
  adicionales: string | null;
  evidencia: string | null;
  intercompania: string | null;
}

export interface ParsedContacto {
  clienteNombre: string;
  contacto: string | null;
  correos: string[];
}

export interface ParsedEstadia {
  clienteNombre: string;
  hrsCortesiaCustodio: string | null;
  hrsCortesiaCliente: string | null;
  cobroSinArma: number | null;
  cobroConArma: number | null;
  requiereTickets: boolean;
  diasCredito: number | null;
  gadgets: string | null;
  descuentos: string | null;
  observaciones: string | null;
}

export interface ParsedPortal {
  clienteNombre: string;
  portalUrl: string | null;
  usuarioCustodias: string | null;
  passwordCustodias: string | null;
  usuarioSeguridad: string | null;
  passwordSeguridad: string | null;
}

export interface ParsedMonitoring {
  fechaInicio: string | null;
  servicio: string | null;
  cliente: string | null;
  costoUnitario: string | null;
  unidades: string | null;
  mensualidades: string | null;
  plazo: string | null;
}

export interface MatchResult {
  clienteNombre: string;
  matchedId: string | null;
  matchedNombre: string | null;
  confidence: 'exact' | 'partial' | 'none';
  changes: ChangeDetail[];
}

export interface ChangeDetail {
  field: string;
  currentValue: any;
  newValue: any;
  tab: 'reglas' | 'contactos' | 'estadias' | 'portales';
}

export interface ImportSummary {
  total: number;
  matched: number;
  unmatched: number;
  changesCount: number;
  matchResults: MatchResult[];
}

export interface ImportExecutionResult {
  success: boolean;
  updated: number;
  contactosCreated: number;
  gadgetsCreated: number;
  errors: string[];
}

// ─── Parse Excel ─────────────────────────────────────────────────────────────

export function parseExcelMaestro(file: File): Promise<ParsedMaestro> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheets = workbook.SheetNames;

        const result: ParsedMaestro = {
          reglas: parseReglasSheet(workbook, sheets[0]),
          contactos: parseContactosSheet(workbook, sheets[1]),
          estadias: sheets.length >= 4 ? parseEstadiasSheet(workbook, sheets[3]) : [],
          portales: sheets.length >= 5 ? parsePortalesSheet(workbook, sheets[4]) : [],
          serviciosMonitoring: sheets.length >= 3 ? parseMonitoringSheet(workbook, sheets[2]) : [],
        };

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function getRows(workbook: XLSX.WorkBook, sheetName: string): any[] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

function parseReglasSheet(wb: XLSX.WorkBook, name: string): ParsedReglaFacturacion[] {
  const rows = getRows(wb, name);
  return rows
    .filter((r: any) => r.CLIENTE?.toString().trim())
    .map((r: any) => ({
      clienteNombre: r.CLIENTE?.toString().trim(),
      corte: r.CORTE?.toString().trim() || null,
      inmediata: r.INMEDIATA?.toString().trim() || null,
      portal: r.PORTAL?.toString().trim() || null,
      descripcion: r.DESCRIPCION?.toString().trim() || null,
      observaciones: r.OBSERVACIONES?.toString().trim() || null,
      prefactura: r.PREFACTURA?.toString().trim() || null,
      fechaEntrega: (r['FECHA DE ENTREGA'] || r['FECHA_DE_ENTREGA'])?.toString().trim() || null,
      estadias: r.ESTADIAS?.toString().trim() || null,
      adicionales: r.ADICIONALES?.toString().trim() || null,
      evidencia: r.EVIDENCIA?.toString().trim() || null,
      intercompania: (r['INTERCOMPAÑIA'] || r.INTERCOMPANIA)?.toString().trim() || null,
    }));
}

function parseContactosSheet(wb: XLSX.WorkBook, name: string): ParsedContacto[] {
  const sheet = wb.Sheets[name];
  if (!sheet) return [];
  const rawRows = XLSX.utils.sheet_to_json<any>(sheet, { header: 1, defval: '' });
  // Skip header rows
  const dataRows = rawRows.slice(2);
  
  return dataRows
    .filter((row: any[]) => row[0]?.toString().trim())
    .map((row: any[]) => {
      const correos: string[] = [];
      // Columns from index 2 onwards are emails
      for (let i = 2; i < row.length; i++) {
        const val = row[i]?.toString().trim();
        if (val && val.includes('@')) {
          // Extract emails, handling multiple in one cell
          const emails = val.match(/[\w.+-]+@[\w.-]+\.\w+/g);
          if (emails) correos.push(...emails);
        }
      }
      return {
        clienteNombre: row[0]?.toString().trim(),
        contacto: row[1]?.toString().trim() || null,
        correos: [...new Set(correos)], // deduplicate
      };
    });
}

function parseEstadiasSheet(wb: XLSX.WorkBook, name: string): ParsedEstadia[] {
  const rows = getRows(wb, name);
  return rows
    .filter((r: any) => r.CLIENTE?.toString().trim())
    .map((r: any) => ({
      clienteNombre: r.CLIENTE?.toString().trim(),
      hrsCortesiaCustodio: (r['HRS CORTESIA CUSTODIO'] || r['HRS_CORTESIA_CUSTODIO'])?.toString().trim() || null,
      hrsCortesiaCliente: (r['HRS CORTESIA CLIENTE'] || r['HRS_CORTESIA_CLIENTE'])?.toString().trim() || null,
      cobroSinArma: parseCurrency(r['COBRO A CLIENTE SIN ARMA'] || r['COBRO_A_CLIENTE_SIN_ARMA']),
      cobroConArma: parseCurrency(r['COBRO A CLIENTE CON ARMA'] || r['COBRO_A_CLIENTE_CON_ARMA']),
      requiereTickets: (r['REQUIERE TICKETS DE ESTADIAS'] || r['REQUIERE_TICKETS_DE_ESTADIAS'])?.toString().toUpperCase() === 'SI',
      diasCredito: parseNumeric(r['DIAS DE CREDITO'] || r['DIAS_DE_CREDITO']),
      gadgets: r.GADGETS?.toString().trim() || null,
      descuentos: (r['DESCUENTOS / BONIFICACION'] || r['DESCUENTOS___BONIFICACION'])?.toString().trim() || null,
      observaciones: r.OBSERVACIONES?.toString().trim() || null,
    }));
}

function parsePortalesSheet(wb: XLSX.WorkBook, name: string): ParsedPortal[] {
  const sheet = wb.Sheets[name];
  if (!sheet) return [];
  const rawRows = XLSX.utils.sheet_to_json<any>(sheet, { header: 1, defval: '' });
  // Skip header rows (first 2)
  const dataRows = rawRows.slice(2);
  
  return dataRows
    .filter((row: any[]) => row[0]?.toString().trim())
    .map((row: any[]) => ({
      clienteNombre: row[0]?.toString().trim(),
      portalUrl: row[1]?.toString().trim() || null,
      usuarioCustodias: row[2]?.toString().trim() || null,
      passwordCustodias: row[3]?.toString().trim() || null,
      usuarioSeguridad: row[4]?.toString().trim() || null,
      passwordSeguridad: row[5]?.toString().trim() || null,
    }));
}

function parseMonitoringSheet(wb: XLSX.WorkBook, name: string): ParsedMonitoring[] {
  const rows = getRows(wb, name);
  return rows
    .filter((r: any) => r.CLIENTE?.toString().trim())
    .map((r: any) => ({
      fechaInicio: (r['FECHA INICIO SERVICIO'] || r['FECHA_INICIO_SERVICIO'])?.toString().trim() || null,
      servicio: r.SERVICIO?.toString().trim() || null,
      cliente: r.CLIENTE?.toString().trim() || null,
      costoUnitario: (r['COSTO POR UNIDAD SIN IVA'] || r['COSTO_POR_UNIDAD_SIN_IVA'])?.toString().trim() || null,
      unidades: (r['UNIDADES INSTALADAS'] || r['UNIDADES_INSTALADAS'])?.toString().trim() || null,
      mensualidades: (r['MENSUALIDADES PENDIENTES'] || r['MENSUALIDADES_PENDIENTES'])?.toString().trim() || null,
      plazo: r.PLAZO?.toString().trim() || null,
    }));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseCurrency(val: any): number | null {
  if (!val) return null;
  const str = val.toString().replace(/[$,\s]/g, '').replace(/,/g, '.');
  // Handle "por minuto" cases
  if (str.includes('POR MINUTO') || str.includes('por minuto')) return null;
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

function parseNumeric(val: any): number | null {
  if (!val) return null;
  const str = val.toString().replace(/[^\d.]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

function parseHorasText(text: string | null): { local: number | null; foraneo: number | null } {
  if (!text) return { local: null, foraneo: null };
  const upper = text.toUpperCase().replace(/HRS?\.?\s*/g, '').replace(/HORAS?/g, '');
  
  // "4 LOCALES Y 3 FORANEAS"
  const localForaneoMatch = upper.match(/(\d+)\s*LOCAL(?:ES)?\s*Y?\s*(\d+)\s*FORAN/i);
  if (localForaneoMatch) {
    return { local: parseInt(localForaneoMatch[1]), foraneo: parseInt(localForaneoMatch[2]) };
  }
  
  // "3 FORANEAS Y 4 LOCALES"
  const foraneoLocalMatch = upper.match(/(\d+)\s*FORAN\w*\s*Y?\s*(\d+)\s*LOCAL/i);
  if (foraneoLocalMatch) {
    return { local: parseInt(foraneoLocalMatch[2]), foraneo: parseInt(foraneoLocalMatch[1]) };
  }
  
  // "3 FORANEAS" only
  const foraneoOnly = upper.match(/(\d+)\s*FORAN/i);
  if (foraneoOnly) {
    return { local: null, foraneo: parseInt(foraneoOnly[1]) };
  }

  // "4 locales y foraneas" (same value for both)
  const sameMatch = upper.match(/(\d+)\s*LOCAL\w*\s*Y\s*FORAN/i);
  if (sameMatch) {
    const v = parseInt(sameMatch[1]);
    return { local: v, foraneo: v };
  }

  // Just a number
  const justNum = upper.match(/^(\d+)/);
  if (justNum) {
    const v = parseInt(justNum[1]);
    return { local: v, foraneo: v };
  }

  return { local: null, foraneo: null };
}

function normalizeClientName(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Matching ────────────────────────────────────────────────────────────────

interface DbCliente {
  id: string;
  nombre: string;
}

export async function matchClientsWithDb(parsed: ParsedMaestro): Promise<ImportSummary> {
  // Get all clients from DB
  const { data: dbClientes, error } = await supabase
    .from('pc_clientes')
    .select('id, nombre')
    .order('nombre');
  
  if (error) throw error;
  const clientes = (dbClientes || []) as DbCliente[];

  // Build normalized index
  const normalizedMap = new Map<string, DbCliente>();
  const wordsMap = new Map<string, DbCliente[]>();
  
  clientes.forEach(c => {
    const norm = normalizeClientName(c.nombre);
    normalizedMap.set(norm, c);
    // Also index by first word for partial matching
    const firstWord = norm.split(' ')[0];
    if (firstWord.length >= 3) {
      const existing = wordsMap.get(firstWord) || [];
      existing.push(c);
      wordsMap.set(firstWord, existing);
    }
  });

  // Collect all unique client names across all sheets
  const allNames = new Set<string>();
  parsed.reglas.forEach(r => allNames.add(r.clienteNombre));
  parsed.contactos.forEach(c => allNames.add(c.clienteNombre));
  parsed.estadias.forEach(e => allNames.add(e.clienteNombre));
  parsed.portales.forEach(p => allNames.add(p.clienteNombre));

  const matchResults: MatchResult[] = [];

  for (const name of allNames) {
    const norm = normalizeClientName(name);
    
    // 1. Exact match
    let matched = normalizedMap.get(norm);
    let confidence: 'exact' | 'partial' | 'none' = 'none';
    
    if (matched) {
      confidence = 'exact';
    } else {
      // 2. Partial: check if normalized name contains or is contained by a DB entry
      for (const [dbNorm, dbClient] of normalizedMap) {
        if (dbNorm.includes(norm) || norm.includes(dbNorm)) {
          matched = dbClient;
          confidence = 'partial';
          break;
        }
      }
      
      // 3. First-word match
      if (!matched) {
        const firstWord = norm.split(' ')[0];
        if (firstWord.length >= 4) {
          const candidates = wordsMap.get(firstWord);
          if (candidates && candidates.length === 1) {
            matched = candidates[0];
            confidence = 'partial';
          }
        }
      }
    }

    const changes: ChangeDetail[] = [];
    
    // Gather changes from reglas
    const regla = parsed.reglas.find(r => r.clienteNombre === name);
    if (regla) {
      if (regla.portal) changes.push({ field: 'requiere_portal', currentValue: null, newValue: true, tab: 'reglas' });
      if (regla.descripcion) changes.push({ field: 'descripcion_factura_formato', currentValue: null, newValue: regla.descripcion, tab: 'reglas' });
      if (regla.fechaEntrega) changes.push({ field: 'dia_entrega_factura', currentValue: null, newValue: regla.fechaEntrega, tab: 'reglas' });
      if (regla.prefactura?.toUpperCase() === 'SI') changes.push({ field: 'requiere_prefactura', currentValue: null, newValue: true, tab: 'reglas' });
      if (regla.observaciones) changes.push({ field: 'observaciones_facturacion', currentValue: null, newValue: regla.observaciones, tab: 'reglas' });
      if (regla.evidencia) changes.push({ field: 'evidencia_requerida', currentValue: null, newValue: regla.evidencia, tab: 'reglas' });
      if (regla.intercompania) changes.push({ field: 'facturacion_intercompania', currentValue: null, newValue: true, tab: 'reglas' });
    }

    // Gather changes from contactos
    const contacto = parsed.contactos.find(c => c.clienteNombre === name);
    if (contacto && contacto.correos.length > 0) {
      changes.push({ field: 'contactos', currentValue: null, newValue: `${contacto.correos.length} correos`, tab: 'contactos' });
    }

    // Gather changes from estadias
    const estadia = parsed.estadias.find(e => e.clienteNombre === name);
    if (estadia) {
      if (estadia.cobroSinArma) changes.push({ field: 'tarifa_sin_arma', currentValue: null, newValue: estadia.cobroSinArma, tab: 'estadias' });
      if (estadia.cobroConArma) changes.push({ field: 'tarifa_con_arma', currentValue: null, newValue: estadia.cobroConArma, tab: 'estadias' });
      if (estadia.hrsCortesiaCliente) changes.push({ field: 'horas_cortesia_cliente', currentValue: null, newValue: estadia.hrsCortesiaCliente, tab: 'estadias' });
      if (estadia.diasCredito) changes.push({ field: 'dias_credito', currentValue: null, newValue: estadia.diasCredito, tab: 'estadias' });
    }

    matchResults.push({
      clienteNombre: name,
      matchedId: matched?.id || null,
      matchedNombre: matched?.nombre || null,
      confidence,
      changes,
    });
  }

  // Sort: matched first, then unmatched
  matchResults.sort((a, b) => {
    if (a.confidence === 'none' && b.confidence !== 'none') return 1;
    if (a.confidence !== 'none' && b.confidence === 'none') return -1;
    return a.clienteNombre.localeCompare(b.clienteNombre);
  });

  return {
    total: matchResults.length,
    matched: matchResults.filter(r => r.confidence !== 'none').length,
    unmatched: matchResults.filter(r => r.confidence === 'none').length,
    changesCount: matchResults.reduce((sum, r) => sum + r.changes.length, 0),
    matchResults,
  };
}

// ─── Execute Import ──────────────────────────────────────────────────────────

export async function executeMaestroImport(
  parsed: ParsedMaestro,
  matchResults: MatchResult[],
  onProgress?: (current: number, total: number, msg: string) => void
): Promise<ImportExecutionResult> {
  const result: ImportExecutionResult = {
    success: false,
    updated: 0,
    contactosCreated: 0,
    gadgetsCreated: 0,
    errors: [],
  };

  const matchedResults = matchResults.filter(m => m.matchedId && m.confidence !== 'none');
  const total = matchedResults.length;
  let current = 0;

  for (const match of matchedResults) {
    current++;
    onProgress?.(current, total, `Procesando: ${match.clienteNombre}`);

    const clienteId = match.matchedId!;

    try {
      // 1. Update pc_clientes with reglas data
      const regla = parsed.reglas.find(r => r.clienteNombre === match.clienteNombre);
      if (regla) {
        const updateData: Record<string, any> = {};
        
        if (regla.portal?.toUpperCase().includes('PORTAL')) updateData.requiere_portal = true;
        if (regla.descripcion) updateData.descripcion_factura_formato = regla.descripcion;
        if (regla.fechaEntrega) updateData.dia_entrega_factura = regla.fechaEntrega;
        if (regla.prefactura?.toUpperCase() === 'SI' || regla.prefactura?.toUpperCase().includes('SI')) updateData.requiere_prefactura = true;
        if (regla.observaciones) updateData.observaciones_facturacion = regla.observaciones;
        if (regla.intercompania?.toUpperCase().includes('SI')) updateData.facturacion_intercompania = true;
        
        // Determine tipo_facturacion from corte/inmediata columns
        if (regla.corte) {
          updateData.tipo_facturacion = 'corte';
          const dias = parseNumeric(regla.corte);
          if (dias) updateData.dia_corte = dias;
        }
        if (regla.inmediata?.toUpperCase() === 'SI') {
          updateData.tipo_facturacion = 'inmediata';
        }

        // Parse evidencia into array
        if (regla.evidencia) {
          const evidencias: string[] = [];
          const ev = regla.evidencia.toUpperCase();
          if (ev.includes('BITACORA')) evidencias.push('bitacora');
          if (ev.includes('TICKET')) evidencias.push('tickets_estadia');
          if (ev.includes('DRIVE')) evidencias.push('drive');
          if (ev.includes('OPINION') || ev.includes('CUMPLIMIENTO')) evidencias.push('opinion_cumplimiento');
          if (ev.includes('ESTADO DE CUENTA')) evidencias.push('estado_cuenta');
          if (evidencias.length > 0) updateData.evidencia_requerida = evidencias;
        }

        // Requiere tickets de estadia
        if (regla.estadias?.toUpperCase() === 'SI' || regla.estadias?.toUpperCase() === 'NO') {
          updateData.requiere_tickets_estadia = regla.estadias.toUpperCase() !== 'NO';
        }

        if (Object.keys(updateData).length > 0) {
          const { data: updated, error } = await supabase.from('pc_clientes').update(updateData).eq('id', clienteId).select('id');
          if (error) {
            result.errors.push(`${match.clienteNombre}: Error actualizando reglas - ${error.message}`);
          } else if (!updated || updated.length === 0) {
            result.errors.push(`${match.clienteNombre}: Reglas no guardadas — posible bloqueo de permisos`);
          } else {
            result.updated++;
          }
        }
      }

      // 2. Import estadias data to pc_clientes (direct fields)
      const estadia = parsed.estadias.find(e => e.clienteNombre === match.clienteNombre);
      if (estadia) {
        const estadiaUpdate: Record<string, any> = {};
        
        if (estadia.cobroSinArma !== null) estadiaUpdate.tarifa_sin_arma = estadia.cobroSinArma;
        if (estadia.cobroConArma !== null) estadiaUpdate.tarifa_con_arma = estadia.cobroConArma;
        if (estadia.requiereTickets) estadiaUpdate.requiere_tickets_estadia = true;
        if (estadia.diasCredito !== null) estadiaUpdate.dias_credito = estadia.diasCredito;
        
        // Parse hrs cortesia into local/foraneo
        const hrsCliente = parseHorasText(estadia.hrsCortesiaCliente);
        if (hrsCliente.local !== null) estadiaUpdate.horas_cortesia_local = hrsCliente.local;
        if (hrsCliente.foraneo !== null) estadiaUpdate.horas_cortesia_foraneo = hrsCliente.foraneo;
        // If single number, set base horas_cortesia
        if (hrsCliente.local !== null && hrsCliente.foraneo === null) {
          estadiaUpdate.horas_cortesia = hrsCliente.local;
        }

        if (Object.keys(estadiaUpdate).length > 0) {
          const { data: updated, error } = await supabase.from('pc_clientes').update(estadiaUpdate).eq('id', clienteId).select('id');
          if (error) {
            result.errors.push(`${match.clienteNombre}: Error actualizando estadías - ${error.message}`);
          } else if (!updated || updated.length === 0) {
            result.errors.push(`${match.clienteNombre}: Estadías no guardadas — posible bloqueo de permisos`);
          }
        }
      }

      // 3. Import contactos
      const contacto = parsed.contactos.find(c => c.clienteNombre === match.clienteNombre);
      if (contacto && contacto.correos.length > 0) {
        for (const email of contacto.correos) {
          const { error } = await supabase.from('pc_clientes_contactos').upsert(
            {
              cliente_id: clienteId,
              email,
              nombre: contacto.contacto || null,
              rol: 'facturacion',
              principal: contacto.correos.indexOf(email) === 0,
              activo: true,
            },
            { onConflict: 'cliente_id,email', ignoreDuplicates: true }
          );
          if (!error) result.contactosCreated++;
        }
      }

      // 4. Import gadgets from estadias or reglas
      const gadgetText = estadia?.gadgets || regla?.adicionales;
      if (gadgetText) {
        const upper = gadgetText.toUpperCase();
        
        if (upper.includes('GPS') && !upper.includes('INCLUIDO')) {
          const priceMatch = gadgetText.match(/\$?\s*(\d[\d,.]*)/);
          const precio = priceMatch ? parseCurrency(priceMatch[1]) : 800;
          await supabase.from('pc_clientes_gadgets').upsert({
            cliente_id: clienteId,
            tipo: 'gps',
            precio: precio || 800,
            incluido_en_tarifa: false,
            facturacion: upper.includes('MENSUAL') ? 'mensual' : 'por_servicio',
            activo: true,
          }, { onConflict: 'id', ignoreDuplicates: true });
          result.gadgetsCreated++;
        }

        if (upper.includes('RHINO')) {
          const priceMatch = gadgetText.match(/RHINO[^$]*\$?\s*(\d[\d,.]*)/i);
          const precio = priceMatch ? parseCurrency(priceMatch[1]) : 2500;
          await supabase.from('pc_clientes_gadgets').upsert({
            cliente_id: clienteId,
            tipo: 'candado_rhino',
            precio: precio || 2500,
            incluido_en_tarifa: false,
            facturacion: 'por_servicio',
            activo: true,
          }, { onConflict: 'id', ignoreDuplicates: true });
          result.gadgetsCreated++;
        }

        if (upper.includes('SINTEL')) {
          const priceMatch = gadgetText.match(/SINTEL[^$]*\$?\s*(\d[\d,.]*)/i);
          const precio = priceMatch ? parseCurrency(priceMatch[1]) : 2500;
          await supabase.from('pc_clientes_gadgets').upsert({
            cliente_id: clienteId,
            tipo: 'candado_sintel',
            precio: precio || 2500,
            incluido_en_tarifa: false,
            facturacion: 'por_servicio',
            activo: true,
          }, { onConflict: 'id', ignoreDuplicates: true });
          result.gadgetsCreated++;
        }

        if (upper.includes('KRAKEN')) {
          const priceMatch = gadgetText.match(/KRAKEN[^$]*\$?\s*(\d[\d,.]*)/i);
          const precio = priceMatch ? parseCurrency(priceMatch[1]) : 1000;
          await supabase.from('pc_clientes_gadgets').upsert({
            cliente_id: clienteId,
            tipo: 'candado_kraken',
            precio: precio || 1000,
            incluido_en_tarifa: false,
            facturacion: 'por_servicio',
            activo: true,
          }, { onConflict: 'id', ignoreDuplicates: true });
          result.gadgetsCreated++;
        }
      }

      // GPS included in cost
      if (regla?.adicionales?.toUpperCase().includes('GPS YA INCLUIDO')) {
        await supabase.from('pc_clientes_gadgets').upsert({
          cliente_id: clienteId,
          tipo: 'gps',
          precio: 0,
          incluido_en_tarifa: true,
          facturacion: 'por_servicio',
          activo: true,
        }, { onConflict: 'id', ignoreDuplicates: true });
      }

    } catch (err) {
      result.errors.push(`${match.clienteNombre}: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  }

  result.success = result.errors.length === 0;
  onProgress?.(total, total, 'Importación completada');
  return result;
}
