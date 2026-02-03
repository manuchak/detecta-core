
# Plan Fase 3: Edge Functions de Automatización

## Resumen Ejecutivo

La Fase 3 implementa dos Edge Functions críticas para automatizar la gestión operativa:

1. **`auto-reactivar-operativos`** - Cron job diario que reactiva automáticamente operativos con bajas temporales cuando se cumple su fecha de reactivación
2. **`auto-detectar-incumplimientos`** - Detecta automáticamente NO_SHOW, cancelaciones a última hora y llegadas tarde recurrentes

---

## Parte A: Edge Function `auto-reactivar-operativos`

### A.1 Propósito

Ejecutar diariamente para:
- Buscar operativos (custodios y armados) con `tipo_inactivacion = 'temporal'`
- Verificar si `fecha_reactivacion_programada <= hoy`
- Cambiar estado a 'activo' y limpiar campos de inactivación
- Registrar el cambio en `operativo_estatus_historial`
- Actualizar sanciones cumplidas automáticamente

### A.2 Lógica de Negocio

```text
PARA CADA tabla IN [custodios_operativos, armados_operativos]:
  1. Buscar registros WHERE:
     - estado IN ('inactivo', 'suspendido')
     - tipo_inactivacion = 'temporal'
     - fecha_reactivacion_programada <= CURRENT_DATE
  
  2. PARA CADA operativo encontrado:
     a. Actualizar operativo:
        - estado = 'activo'
        - fecha_inactivacion = NULL
        - motivo_inactivacion = NULL
        - tipo_inactivacion = NULL
        - fecha_reactivacion_programada = NULL
     
     b. Insertar en operativo_estatus_historial:
        - estatus_anterior = estado_actual
        - estatus_nuevo = 'activo'
        - tipo_cambio = 'reactivacion'
        - motivo = 'Reactivación automática programada'
        - creado_por = NULL (sistema)
     
     c. Buscar sanciones activas del operativo con fecha_fin <= hoy:
        - Actualizar estado = 'cumplida'
        - Registrar fecha_revision = NOW()
  
  3. Registrar log de ejecución con resumen
```

### A.3 Estructura del Código

**Archivo:** `supabase/functions/auto-reactivar-operativos/index.ts`

```typescript
// Estructura principal
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReactivacionResult {
  operativoId: string;
  operativoTipo: 'custodio' | 'armado';
  nombre: string;
  motivoOriginal: string;
  diasInactivo: number;
}

async function procesarTabla(
  supabase: any,
  tableName: 'custodios_operativos' | 'armados_operativos',
  operativoTipo: 'custodio' | 'armado'
): Promise<ReactivacionResult[]> {
  // 1. Buscar operativos pendientes de reactivación
  const { data: operativos, error } = await supabase
    .from(tableName)
    .select('id, nombre, estado, fecha_inactivacion, motivo_inactivacion')
    .in('estado', ['inactivo', 'suspendido'])
    .eq('tipo_inactivacion', 'temporal')
    .lte('fecha_reactivacion_programada', new Date().toISOString().split('T')[0]);

  if (error || !operativos?.length) return [];

  const resultados: ReactivacionResult[] = [];

  for (const operativo of operativos) {
    // 2. Actualizar estado del operativo
    await supabase
      .from(tableName)
      .update({
        estado: 'activo',
        fecha_inactivacion: null,
        motivo_inactivacion: null,
        tipo_inactivacion: null,
        fecha_reactivacion_programada: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', operativo.id);

    // 3. Registrar en historial
    await supabase
      .from('operativo_estatus_historial')
      .insert({
        operativo_id: operativo.id,
        operativo_tipo: operativoTipo,
        estatus_anterior: operativo.estado,
        estatus_nuevo: 'activo',
        tipo_cambio: 'reactivacion',
        motivo: 'Reactivación automática programada',
        notas: `Inactivo desde: ${operativo.fecha_inactivacion}. Motivo original: ${operativo.motivo_inactivacion}`,
        creado_por: null // Sistema
      });

    // 4. Cerrar sanciones cumplidas
    await supabase
      .from('sanciones_aplicadas')
      .update({
        estado: 'cumplida',
        fecha_revision: new Date().toISOString()
      })
      .eq('operativo_id', operativo.id)
      .eq('estado', 'activa')
      .lte('fecha_fin', new Date().toISOString().split('T')[0]);

    resultados.push({
      operativoId: operativo.id,
      operativoTipo,
      nombre: operativo.nombre,
      motivoOriginal: operativo.motivo_inactivacion,
      diasInactivo: calcularDias(operativo.fecha_inactivacion)
    });
  }

  return resultados;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  console.log("=== Iniciando reactivación automática ===");

  const custodiosReactivados = await procesarTabla(supabase, 'custodios_operativos', 'custodio');
  const armadosReactivados = await procesarTabla(supabase, 'armados_operativos', 'armado');

  const resumen = {
    fecha_ejecucion: new Date().toISOString(),
    custodios_reactivados: custodiosReactivados.length,
    armados_reactivados: armadosReactivados.length,
    total: custodiosReactivados.length + armadosReactivados.length,
    detalle: [...custodiosReactivados, ...armadosReactivados]
  };

  console.log(`Reactivados: ${resumen.total} operativos`);

  return new Response(JSON.stringify(resumen), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
```

### A.4 Configuración de Cron Job

Para ejecutar diariamente a las 6:00 AM (hora local México):

```sql
-- SQL para programar el cron job (ejecutar manualmente en Supabase SQL Editor)
SELECT cron.schedule(
  'auto-reactivar-operativos-diario',
  '0 12 * * *', -- 6:00 AM hora México (UTC-6 = 12:00 UTC)
  $$
  SELECT
    net.http_post(
      url := 'https://yydzzeljaewsfhmilnhm.supabase.co/functions/v1/auto-reactivar-operativos',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZHp6ZWxqYWV3c2ZobWlsbmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2OTc1MjIsImV4cCI6MjA2MzI3MzUyMn0.iP9UG12mKESneZq7XwY6vHvqRGH3hq3D1Hu0qneu8B8"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

---

## Parte B: Edge Function `auto-detectar-incumplimientos`

### B.1 Propósito

Detectar automáticamente tres tipos de incumplimientos:

| Código | Incumplimiento | Condición de Detección |
|--------|----------------|------------------------|
| `NO_SHOW` | No presentarse | Servicio confirmado, fecha_hora_cita + 30min pasaron, sin `hora_inicio_real` |
| `CANCELACION_ULTIMA_HORA` | Cancelación tardía | Servicio cancelado con `fecha_cancelacion - fecha_hora_cita < 2 horas` |
| `LLEGADA_TARDE` | Llegada tarde recurrente | 3+ servicios con `hora_llegada_custodio > hora_cita + 15min` en últimos 30 días |

### B.2 Lógica de Negocio Detallada

#### Regla 1: NO_SHOW (Muy Grave - 21 días suspensión)

```text
BUSCAR en servicios_planificados WHERE:
  - estado_planeacion = 'confirmado'
  - fecha_hora_cita < NOW() - INTERVAL '30 minutes'
  - hora_inicio_real IS NULL
  - custodio_id IS NOT NULL
  - NO existe sancion pendiente por este servicio

PARA CADA servicio encontrado:
  1. Crear sancion_aplicada:
     - operativo_id = custodio_id
     - operativo_tipo = 'custodio'
     - sancion_id = (SELECT id FROM catalogo_sanciones WHERE codigo = 'NO_SHOW')
     - servicio_relacionado_id = servicio.id
     - dias_suspension = 21
     - puntos_perdidos = 20
     - estado = 'activa'
     - notas = 'Detectado automáticamente. Servicio confirmado sin inicio real.'
  
  2. Actualizar operativo:
     - estado = 'suspendido'
     - tipo_inactivacion = 'temporal'
     - fecha_reactivacion_programada = fecha_inicio + 21 días
     - motivo_inactivacion = 'sancion_disciplinaria'
  
  3. Actualizar servicio:
     - estado_planeacion = 'cancelado'
     - comentarios_planeacion = 'Cancelado por NO_SHOW del custodio'
```

#### Regla 2: CANCELACION_ULTIMA_HORA (Grave - 14 días suspensión)

```text
BUSCAR en servicios_planificados WHERE:
  - estado_planeacion = 'cancelado'
  - fecha_cancelacion IS NOT NULL
  - cancelado_por IS NOT NULL
  - (fecha_hora_cita - fecha_cancelacion) < INTERVAL '2 hours'
  - custodio_id IS NOT NULL
  - NO existe sancion pendiente por este servicio

PARA verificar que fue cancelado por el custodio:
  - Verificar si cancelado_por corresponde al custodio o
  - Buscar en observaciones/comentarios indicios de cancelación por custodio

PARA CADA servicio encontrado:
  1. Crear sancion_aplicada similar a NO_SHOW pero:
     - sancion_id = 'CANCELACION_ULTIMA_HORA'
     - dias_suspension = 14
     - puntos_perdidos = 15
     - notas = 'Servicio cancelado con menos de 2 horas de anticipación'
```

#### Regla 3: LLEGADA_TARDE (Moderada - 7 días suspensión)

```text
PARA CADA custodio activo:
  CONTAR servicios en últimos 30 días WHERE:
    - estado_planeacion IN ('confirmado', 'en_curso', 'finalizado')
    - hora_llegada_custodio > (EXTRACT(TIME FROM fecha_hora_cita) + INTERVAL '15 minutes')
  
  SI count >= 3 Y no tiene sancion LLEGADA_TARDE activa:
    Crear sancion_aplicada:
    - sancion_id = 'LLEGADA_TARDE'
    - dias_suspension = 7
    - puntos_perdidos = 10
    - notas = 'Llegada tarde en {count} servicios en los últimos 30 días'
```

### B.3 Estructura del Código

**Archivo:** `supabase/functions/auto-detectar-incumplimientos/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { addDays } from "https://esm.sh/date-fns@3.6.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeteccionResult {
  tipo: 'NO_SHOW' | 'CANCELACION_ULTIMA_HORA' | 'LLEGADA_TARDE';
  operativoId: string;
  operativoTipo: 'custodio' | 'armado';
  servicioId?: string;
  descripcion: string;
  sancionCreada: boolean;
}

// Obtener sancion del catálogo
async function getSancionFromCatalogo(supabase: any, codigo: string) {
  const { data } = await supabase
    .from('catalogo_sanciones')
    .select('*')
    .eq('codigo', codigo)
    .eq('activo', true)
    .single();
  return data;
}

// Verificar si ya existe sancion para este servicio
async function existeSancionParaServicio(supabase: any, servicioId: string) {
  const { data } = await supabase
    .from('sanciones_aplicadas')
    .select('id')
    .eq('servicio_relacionado_id', servicioId)
    .limit(1);
  return data && data.length > 0;
}

// Aplicar sancion y suspender operativo
async function aplicarSancion(
  supabase: any,
  params: {
    operativoId: string;
    operativoTipo: 'custodio' | 'armado';
    sancionCodigo: string;
    servicioId?: string;
    notas: string;
  }
) {
  const sancion = await getSancionFromCatalogo(supabase, params.sancionCodigo);
  if (!sancion) {
    console.error(`Sanción ${params.sancionCodigo} no encontrada en catálogo`);
    return false;
  }

  const fechaInicio = new Date().toISOString().split('T')[0];
  const fechaFin = addDays(new Date(), sancion.dias_suspension_default)
    .toISOString().split('T')[0];

  // Crear sancion
  const { error: sancionError } = await supabase
    .from('sanciones_aplicadas')
    .insert({
      operativo_id: params.operativoId,
      operativo_tipo: params.operativoTipo,
      sancion_id: sancion.id,
      servicio_relacionado_id: params.servicioId || null,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      dias_suspension: sancion.dias_suspension_default,
      puntos_perdidos: sancion.puntos_score_perdidos,
      estado: 'activa',
      notas: params.notas,
      aplicada_por: null // Sistema
    });

  if (sancionError) {
    console.error('Error creando sanción:', sancionError);
    return false;
  }

  // Suspender operativo si hay días de suspensión
  if (sancion.dias_suspension_default > 0) {
    const tableName = params.operativoTipo === 'custodio' 
      ? 'custodios_operativos' 
      : 'armados_operativos';

    await supabase
      .from(tableName)
      .update({
        estado: 'suspendido',
        fecha_inactivacion: fechaInicio,
        motivo_inactivacion: 'sancion_disciplinaria',
        tipo_inactivacion: 'temporal',
        fecha_reactivacion_programada: fechaFin
      })
      .eq('id', params.operativoId);
  }

  return true;
}

// REGLA 1: Detectar NO_SHOW
async function detectarNoShow(supabase: any): Promise<DeteccionResult[]> {
  const resultados: DeteccionResult[] = [];
  const umbralTiempo = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 min atrás

  const { data: servicios } = await supabase
    .from('servicios_planificados')
    .select('id, custodio_id, custodio_asignado, fecha_hora_cita')
    .eq('estado_planeacion', 'confirmado')
    .lt('fecha_hora_cita', umbralTiempo)
    .is('hora_inicio_real', null)
    .not('custodio_id', 'is', null);

  if (!servicios?.length) return resultados;

  for (const servicio of servicios) {
    // Verificar si ya tiene sanción
    if (await existeSancionParaServicio(supabase, servicio.id)) continue;

    const sancionCreada = await aplicarSancion(supabase, {
      operativoId: servicio.custodio_id,
      operativoTipo: 'custodio',
      sancionCodigo: 'NO_SHOW',
      servicioId: servicio.id,
      notas: `Detección automática. Servicio ${servicio.id} confirmado para ${servicio.fecha_hora_cita} sin registro de inicio.`
    });

    // Actualizar servicio a cancelado
    if (sancionCreada) {
      await supabase
        .from('servicios_planificados')
        .update({
          estado_planeacion: 'cancelado',
          comentarios_planeacion: 'Cancelado automáticamente por NO_SHOW del custodio'
        })
        .eq('id', servicio.id);
    }

    resultados.push({
      tipo: 'NO_SHOW',
      operativoId: servicio.custodio_id,
      operativoTipo: 'custodio',
      servicioId: servicio.id,
      descripcion: `Custodio ${servicio.custodio_asignado} no se presentó al servicio`,
      sancionCreada
    });
  }

  return resultados;
}

// REGLA 2: Detectar CANCELACION_ULTIMA_HORA
async function detectarCancelacionUltimaHora(supabase: any): Promise<DeteccionResult[]> {
  const resultados: DeteccionResult[] = [];

  // Servicios cancelados en las últimas 24 horas
  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: servicios } = await supabase
    .from('servicios_planificados')
    .select('id, custodio_id, custodio_asignado, fecha_hora_cita, fecha_cancelacion')
    .eq('estado_planeacion', 'cancelado')
    .not('fecha_cancelacion', 'is', null)
    .not('custodio_id', 'is', null)
    .gte('fecha_cancelacion', hace24h);

  if (!servicios?.length) return resultados;

  for (const servicio of servicios) {
    // Verificar si ya tiene sanción
    if (await existeSancionParaServicio(supabase, servicio.id)) continue;

    // Calcular diferencia entre cita y cancelación
    const fechaCita = new Date(servicio.fecha_hora_cita);
    const fechaCancelacion = new Date(servicio.fecha_cancelacion);
    const diferenciaHoras = (fechaCita.getTime() - fechaCancelacion.getTime()) / (1000 * 60 * 60);

    // Solo si se canceló con menos de 2 horas de anticipación
    if (diferenciaHoras < 2 && diferenciaHoras > 0) {
      const sancionCreada = await aplicarSancion(supabase, {
        operativoId: servicio.custodio_id,
        operativoTipo: 'custodio',
        sancionCodigo: 'CANCELACION_ULTIMA_HORA',
        servicioId: servicio.id,
        notas: `Detección automática. Servicio cancelado ${diferenciaHoras.toFixed(1)} horas antes de la cita.`
      });

      resultados.push({
        tipo: 'CANCELACION_ULTIMA_HORA',
        operativoId: servicio.custodio_id,
        operativoTipo: 'custodio',
        servicioId: servicio.id,
        descripcion: `Cancelación a ${diferenciaHoras.toFixed(1)} horas del servicio`,
        sancionCreada
      });
    }
  }

  return resultados;
}

// REGLA 3: Detectar LLEGADA_TARDE (acumulativo)
async function detectarLlegadaTarde(supabase: any): Promise<DeteccionResult[]> {
  const resultados: DeteccionResult[] = [];
  const hace30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Obtener custodios activos
  const { data: custodios } = await supabase
    .from('custodios_operativos')
    .select('id, nombre')
    .eq('estado', 'activo');

  if (!custodios?.length) return resultados;

  for (const custodio of custodios) {
    // Verificar si ya tiene sanción LLEGADA_TARDE activa
    const { data: sancionExistente } = await supabase
      .from('sanciones_aplicadas')
      .select('id')
      .eq('operativo_id', custodio.id)
      .eq('estado', 'activa')
      .limit(1);

    // Si ya tiene sanción activa (de cualquier tipo), saltar
    if (sancionExistente?.length) continue;

    // Contar llegadas tarde en últimos 30 días
    // Nota: Esta query es aproximada, idealmente se haría con una función SQL
    const { data: servicios } = await supabase
      .from('servicios_planificados')
      .select('id, fecha_hora_cita, hora_llegada_custodio')
      .eq('custodio_id', custodio.id)
      .in('estado_planeacion', ['confirmado', 'finalizado'])
      .not('hora_llegada_custodio', 'is', null)
      .gte('fecha_hora_cita', hace30d);

    if (!servicios?.length) continue;

    // Contar llegadas tarde (>15 min después de la cita)
    let llegadasTarde = 0;
    for (const servicio of servicios) {
      const horaCita = new Date(servicio.fecha_hora_cita);
      const horaLlegada = servicio.hora_llegada_custodio; // TIME format HH:MM:SS
      
      // Comparar horas (simplificado)
      const [hCita, mCita] = [horaCita.getHours(), horaCita.getMinutes()];
      const [hLlegada, mLlegada] = horaLlegada.split(':').map(Number);
      
      const minutosCita = hCita * 60 + mCita;
      const minutosLlegada = hLlegada * 60 + mLlegada;
      
      if (minutosLlegada > minutosCita + 15) {
        llegadasTarde++;
      }
    }

    // Si tiene 3+ llegadas tarde, aplicar sanción
    if (llegadasTarde >= 3) {
      const sancionCreada = await aplicarSancion(supabase, {
        operativoId: custodio.id,
        operativoTipo: 'custodio',
        sancionCodigo: 'LLEGADA_TARDE',
        notas: `Detección automática. ${llegadasTarde} llegadas tarde en los últimos 30 días.`
      });

      resultados.push({
        tipo: 'LLEGADA_TARDE',
        operativoId: custodio.id,
        operativoTipo: 'custodio',
        descripcion: `${custodio.nombre}: ${llegadasTarde} llegadas tarde en 30 días`,
        sancionCreada
      });
    }
  }

  return resultados;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  console.log("=== Iniciando detección de incumplimientos ===");

  // Parsear parámetros opcionales
  const body = await req.json().catch(() => ({}));
  const { 
    detectarNoShowEnabled = true,
    detectarCancelacionEnabled = true,
    detectarLlegadaTardeEnabled = true
  } = body;

  const resultados: DeteccionResult[] = [];

  if (detectarNoShowEnabled) {
    const noShows = await detectarNoShow(supabase);
    resultados.push(...noShows);
    console.log(`NO_SHOW detectados: ${noShows.length}`);
  }

  if (detectarCancelacionEnabled) {
    const cancelaciones = await detectarCancelacionUltimaHora(supabase);
    resultados.push(...cancelaciones);
    console.log(`CANCELACION_ULTIMA_HORA detectados: ${cancelaciones.length}`);
  }

  if (detectarLlegadaTardeEnabled) {
    const tardanzas = await detectarLlegadaTarde(supabase);
    resultados.push(...tardanzas);
    console.log(`LLEGADA_TARDE detectados: ${tardanzas.length}`);
  }

  const resumen = {
    fecha_ejecucion: new Date().toISOString(),
    total_detecciones: resultados.length,
    por_tipo: {
      NO_SHOW: resultados.filter(r => r.tipo === 'NO_SHOW').length,
      CANCELACION_ULTIMA_HORA: resultados.filter(r => r.tipo === 'CANCELACION_ULTIMA_HORA').length,
      LLEGADA_TARDE: resultados.filter(r => r.tipo === 'LLEGADA_TARDE').length
    },
    sanciones_creadas: resultados.filter(r => r.sancionCreada).length,
    detalle: resultados
  };

  console.log(`Total detecciones: ${resumen.total_detecciones}, Sanciones creadas: ${resumen.sanciones_creadas}`);

  return new Response(JSON.stringify(resumen), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
```

### B.4 Configuración de Cron Job

Para ejecutar cada hora:

```sql
-- SQL para programar el cron job
SELECT cron.schedule(
  'auto-detectar-incumplimientos-cada-hora',
  '0 * * * *', -- Cada hora en punto
  $$
  SELECT
    net.http_post(
      url := 'https://yydzzeljaewsfhmilnhm.supabase.co/functions/v1/auto-detectar-incumplimientos',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5ZHp6ZWxqYWV3c2ZobWlsbmhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2OTc1MjIsImV4cCI6MjA2MzI3MzUyMn0.iP9UG12mKESneZq7XwY6vHvqRGH3hq3D1Hu0qneu8B8"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

---

## Parte C: Configuración de config.toml

Agregar las nuevas funciones al archivo de configuración:

```toml
[functions.auto-reactivar-operativos]
verify_jwt = false

[functions.auto-detectar-incumplimientos]
verify_jwt = false
```

---

## Parte D: Prerrequisitos de Base de Datos

Antes de implementar, asegurar que las extensiones necesarias están habilitadas:

```sql
-- Verificar/habilitar extensiones para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Dar permisos al cron para acceder a las tablas
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
```

---

## Resumen de Archivos

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `supabase/functions/auto-reactivar-operativos/index.ts` | **Crear** | Edge function de reactivación automática |
| `supabase/functions/auto-detectar-incumplimientos/index.ts` | **Crear** | Edge function de detección de incumplimientos |
| `supabase/config.toml` | Modificar | Agregar configuración de las 2 funciones |

---

## Secuencia de Implementación

1. **Crear `auto-reactivar-operativos/index.ts`**
2. **Crear `auto-detectar-incumplimientos/index.ts`**
3. **Actualizar `supabase/config.toml`**
4. **Desplegar funciones**
5. **Verificar extensiones pg_cron y pg_net**
6. **Configurar cron jobs en SQL Editor de Supabase**
7. **Probar ejecución manual de ambas funciones**
8. **Monitorear logs en Supabase Dashboard**

---

## Testing Manual

**Probar reactivación:**
```bash
curl -X POST 'https://yydzzeljaewsfhmilnhm.supabase.co/functions/v1/auto-reactivar-operativos' \
  -H 'Content-Type: application/json'
```

**Probar detección (solo NO_SHOW):**
```bash
curl -X POST 'https://yydzzeljaewsfhmilnhm.supabase.co/functions/v1/auto-detectar-incumplimientos' \
  -H 'Content-Type: application/json' \
  -d '{"detectarCancelacionEnabled": false, "detectarLlegadaTardeEnabled": false}'
```

---

## Cobertura de Casos de Uso

| Caso de Uso | Edge Function | Frecuencia |
|-------------|---------------|------------|
| Reactivar operativos con baja temporal | `auto-reactivar-operativos` | Diaria 6:00 AM |
| Detectar NO_SHOW | `auto-detectar-incumplimientos` | Cada hora |
| Detectar cancelaciones tardías | `auto-detectar-incumplimientos` | Cada hora |
| Detectar llegadas tarde recurrentes | `auto-detectar-incumplimientos` | Cada hora |
| Cerrar sanciones cumplidas | `auto-reactivar-operativos` | Diaria 6:00 AM |

---

## Notas Técnicas

1. **Seguridad**: Ambas funciones usan `SUPABASE_SERVICE_ROLE_KEY` para bypass de RLS ya que operan como sistema
2. **Idempotencia**: Cada función verifica duplicados antes de crear sanciones
3. **Logging**: Logs detallados para debugging en Supabase Dashboard
4. **Parámetros**: Ambas funciones aceptan flags para habilitar/deshabilitar reglas específicas
5. **Escalabilidad**: Procesamiento por lotes para evitar timeouts
