import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Create OJTLE TRANSPORTE client if not exists
    const { data: existingOjtle } = await supabase
      .from('pc_clientes')
      .select('id')
      .ilike('nombre', '%OJTLE%')
      .maybeSingle()

    let ojtleId = existingOjtle?.id
    if (!ojtleId) {
      const { data: newClient, error: clientErr } = await supabase
        .from('pc_clientes')
        .insert({
          nombre: 'OJTLE TRANSPORTE',
          razon_social: 'OJTLE TRANSPORTE',
          activo: true,
          contacto_nombre: 'Por asignar',
          contacto_tel: 'Por asignar',
        })
        .select('id')
        .single()
      if (clientErr) throw new Error(`Error creating OJTLE: ${clientErr.message}`)
      ojtleId = newClient.id
    }

    // 2. Client ID map
    const clienteIds: Record<string, string> = {
      'FERRER': 'ecf1e8c5-593c-42ad-8942-d7be5a81387a',
      'MULTI ADUANAS': 'ad69cd6f-6bc5-485a-9e07-3866d0d6dd1d',
      'CALZADO ANDREA': 'e182ef1e-9e61-4bbb-a5cd-1721f64cf610',
      'CARGO INTERAMERICANA': '94b95c55-4fb7-4759-867d-9ada4a59f383',
      'OJTLE TRANSPORTE': ojtleId,
      'CASA TRADICION': 'f4fcbc8f-380d-4269-9f86-fe431bfd48d5',
    }

    // 3. Define the 5 remaining quejas (1 already inserted for CALZADO ANDREA)
    const quejas = [
      {
        cliente_id: clienteIds['FERRER'],
        tipo: 'calidad_servicio',
        severidad: 'alta',
        estado: 'en_investigacion',
        canal_entrada: 'email',
        descripcion: 'Fecha del servicio: 07/Ene/2025. Se reportaron 7 hallazgos operativos graves durante servicio de custodia: 1) Custodio no portaba credencial visible, 2) No realizó ronda de inspección al inicio, 3) Vehículo sin kit de emergencia, 4) No reportó checkpoint en tiempo, 5) Radio sin batería de respaldo, 6) Bitácora incompleta, 7) No siguió protocolo de cambio de turno. Atendió: Coordinación Operativa.',
        accion_correctiva: 'Se programó recapacitación obligatoria del custodio involucrado. Se reforzó checklist de salida. Se implementó verificación doble antes de cada servicio.',
        sla_respuesta_horas: 24,
        sla_resolucion_horas: 72,
        created_at: '2025-01-10T09:00:00-06:00',
      },
      {
        cliente_id: clienteIds['MULTI ADUANAS'],
        tipo: 'calidad_servicio',
        severidad: 'media',
        estado: 'seguimiento',
        canal_entrada: 'email',
        descripcion: 'Fecha del servicio: 15/Ene/2025. Custodio llegó con 2 horas de retraso al punto de encuentro para servicio de custodia de mercancía en tránsito aduanal. El cliente tuvo que esperar con la carga detenida. Atendió: Jefe de Operaciones.',
        accion_correctiva: 'Se ajustaron tiempos de salida del custodio con margen de 1 hora adicional. Se activó alerta automática si no confirma salida 3 horas antes del servicio.',
        sla_respuesta_horas: 24,
        sla_resolucion_horas: 48,
        created_at: '2025-01-20T10:00:00-06:00',
      },
      {
        cliente_id: clienteIds['CARGO INTERAMERICANA'],
        tipo: 'calidad_servicio',
        severidad: 'media',
        estado: 'accion_correctiva',
        canal_entrada: 'email',
        descripcion: 'Fecha del servicio: 02/Feb/2025. El cliente reportó actitudes inadecuadas del equipo de custodia: falta de comunicación con el operador, uso de celular personal durante el servicio, y trato poco profesional al entregar la unidad. Atendió: Recursos Humanos y Coordinación Operativa.',
        accion_correctiva: 'Se aplicó amonestación al personal involucrado. Se reforzó capacitación en servicio al cliente y protocolo de conducta profesional. Se programó evaluación de desempeño trimestral.',
        sla_respuesta_horas: 24,
        sla_resolucion_horas: 72,
        created_at: '2025-02-05T11:00:00-06:00',
      },
      {
        cliente_id: clienteIds['OJTLE TRANSPORTE'],
        tipo: 'seguridad',
        severidad: 'media',
        estado: 'seguimiento',
        canal_entrada: 'email',
        descripcion: 'Fecha del servicio: 10/Feb/2025. Se detectó falla en el sistema GPS del vehículo de custodia durante ruta Puebla-Veracruz. El monitoreo perdió señal por 45 minutos. El cliente solicitó reporte de incidente y plan de acción. Atendió: Soporte Técnico y Coordinación.',
        accion_correctiva: 'Se realizó diagnóstico y reparación del equipo GPS. Se implementó verificación pre-ruta del sistema de rastreo. Se adquirieron dispositivos de respaldo para rutas críticas.',
        sla_respuesta_horas: 12,
        sla_resolucion_horas: 48,
        created_at: '2025-02-12T14:00:00-06:00',
      },
      {
        cliente_id: clienteIds['CASA TRADICION'],
        tipo: 'consignas',
        severidad: 'alta',
        estado: 'accion_correctiva',
        canal_entrada: 'email',
        descripcion: 'Fecha del servicio: 18/Feb/2025. Se identificaron 3 hallazgos en incumplimiento de consignas: 1) Custodio no verificó sellos de seguridad al recibir la carga, 2) No se realizó conteo de bultos conforme al manifiesto, 3) No se tomaron fotografías de evidencia al inicio del servicio como indica el protocolo. Atendió: Supervisión de Calidad.',
        accion_correctiva: 'Se actualizó el manual de consignas con checklist obligatorio fotográfico. Se implementó validación digital de sellos mediante app. Se programó auditoría mensual de cumplimiento de consignas.',
        sla_respuesta_horas: 24,
        sla_resolucion_horas: 72,
        created_at: '2025-02-20T09:30:00-06:00',
      },
    ]

    // 4. Insert quejas (numero_queja will be auto-generated by trigger)
    const results = []
    for (const queja of quejas) {
      const { data, error } = await supabase
        .from('cs_quejas')
        .insert({ ...queja, numero_queja: '' })
        .select('id, numero_queja, created_at')
        .single()

      if (error) {
        results.push({ error: error.message, queja: queja.descripcion.substring(0, 50) })
      } else {
        results.push({ id: data.id, folio: data.numero_queja, created_at: data.created_at })
      }
    }

    return new Response(JSON.stringify({
      success: true,
      ojtle_id: ojtleId,
      quejas_insertadas: results,
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
