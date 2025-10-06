import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

interface UncontactedLead {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  estado: string;
  fuente_reclutamiento: string | null;
  fecha_creacion: string;
  asignado_a: string | null;
  asignado_nombre?: string;
  notas: string | null;
  fecha_contacto: string | null;
  call_count?: number;
}

export async function exportUncontactedLeads(): Promise<number> {
  try {
    // Query leads sin fecha_contacto
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select(`
        id,
        nombre,
        email,
        telefono,
        estado,
        fuente_reclutamiento,
        fecha_creacion,
        asignado_a,
        notas,
        fecha_contacto,
        profiles!leads_asignado_a_fkey(display_name)
      `)
      .is('fecha_contacto', null)
      .order('fecha_creacion', { ascending: false });

    if (leadsError) throw leadsError;
    if (!leadsData || leadsData.length === 0) {
      throw new Error('No hay leads sin contactar para exportar');
    }

    // Para cada lead, contar intentos de llamadas
    const leadsWithCallCount = await Promise.all(
      leadsData.map(async (lead) => {
        const { count, error: countError } = await supabase
          .from('manual_call_logs')
          .select('*', { count: 'exact', head: true })
          .eq('lead_id', lead.id);

        if (countError) {
          console.error('Error contando llamadas:', countError);
          return { ...lead, call_count: 0 };
        }

        return { ...lead, call_count: count || 0 };
      })
    );

    // Filtrar solo los que tienen 0 intentos de contacto
    const uncontactedLeads = leadsWithCallCount.filter(lead => lead.call_count === 0);

    if (uncontactedLeads.length === 0) {
      throw new Error('No hay leads completamente sin contactar (todos tienen al menos un intento)');
    }

    // Preparar datos para Excel
    const excelData = uncontactedLeads.map(lead => {
      const diasSinContacto = lead.fecha_creacion 
        ? Math.floor((new Date().getTime() - new Date(lead.fecha_creacion).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const assignedName = (lead as any).profiles?.display_name || 'Sin asignar';

      return {
        'ID': lead.id,
        'Nombre': lead.nombre || 'N/A',
        'Email': lead.email || 'N/A',
        'Teléfono': lead.telefono || 'N/A',
        'Estado': lead.estado || 'N/A',
        'Fuente': lead.fuente_reclutamiento || 'N/A',
        'Fecha Creación': lead.fecha_creacion 
          ? new Date(lead.fecha_creacion).toLocaleDateString('es-ES')
          : 'N/A',
        'Días sin contacto': diasSinContacto,
        'Asignado a': assignedName,
        'Notas': lead.notas || 'Sin notas'
      };
    });

    // Crear libro de Excel
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads No Contactados');

    // Ajustar anchos de columnas
    const columnWidths = [
      { wch: 36 }, // ID
      { wch: 25 }, // Nombre
      { wch: 30 }, // Email
      { wch: 15 }, // Teléfono
      { wch: 15 }, // Estado
      { wch: 20 }, // Fuente
      { wch: 15 }, // Fecha
      { wch: 18 }, // Días sin contacto
      { wch: 25 }, // Asignado a
      { wch: 40 }  // Notas
    ];
    worksheet['!cols'] = columnWidths;

    // Generar archivo
    const fileName = `leads_no_contactados_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    return uncontactedLeads.length;
  } catch (error) {
    console.error('Error exportando leads:', error);
    throw error;
  }
}
