
# Plan Maestro: Sistema de Preferencias, Sanciones y Visibilidad Operativa para Custodios y Armados

## Resumen Ejecutivo

Este plan aborda 5 casos de uso criticos para el equipo de Planeacion:

1. **Preferencias de Tipo de Servicio** - Permite indicar si un custodio/armado prefiere servicios locales, foraneos o le es indistinto
2. **Gestion de Estatus Activo/Inactivo** - Control de bajas temporales y permanentes
3. **Sistema de Sanciones Configurable** - Motor de reglas para incumplimientos con aplicacion automatica y manual
4. **Visibilidad Mejorada en Tarjeta de Asignacion** - Dias sin servicio + tipo de ultimo servicio
5. **Metricas de Actividad Reciente** - Servicios de los ultimos 15 dias (locales vs foraneos)

---

## Parte 1: Preferencias de Tipo de Servicio

### 1.1 Modelo de Datos

**Tabla: `custodios_operativos`** (modificacion)
```sql
ALTER TABLE custodios_operativos 
ADD COLUMN preferencia_tipo_servicio TEXT DEFAULT 'indistinto' 
CHECK (preferencia_tipo_servicio IN ('local', 'foraneo', 'indistinto'));

COMMENT ON COLUMN custodios_operativos.preferencia_tipo_servicio IS 
'Preferencia del custodio: local (< 100km), foraneo (> 100km), indistinto (cualquiera)';
```

**Tabla: `armados_operativos`** (modificacion)
```sql
ALTER TABLE armados_operativos 
ADD COLUMN preferencia_tipo_servicio TEXT DEFAULT 'indistinto' 
CHECK (preferencia_tipo_servicio IN ('local', 'foraneo', 'indistinto'));
```

### 1.2 Logica de Negocio para Asignacion

La preferencia afecta el algoritmo de scoring de proximidad operacional:

```text
Si preferencia = 'local' y servicio.tipo = 'foraneo':
  - Mostrar con badge de advertencia "Prefiere Local"
  - Score de compatibilidad -15 puntos
  - Requiere confirmacion explicita al asignar

Si preferencia = 'foraneo' y servicio.tipo = 'local':
  - Mostrar con badge informativo "Prefiere Foraneo"
  - Score de compatibilidad -10 puntos
  - No bloquea asignacion

Si preferencia = 'indistinto':
  - Sin ajuste de score
  - Sin badge adicional
```

### 1.3 Interfaz de Usuario

**Ubicacion:** Perfil Forense > Tab "Informacion" + Zonas Base (edicion masiva)

**Componente: PreferenciaServicioSelector**
```text
+------------------------------------------+
|  Preferencia de Servicio                 |
|  ----------------------------------------|
|  ( ) Solo Local (< 100 km)               |
|  ( ) Solo Foraneo (> 100 km)             |
|  (o) Indistinto (cualquier servicio)     |
+------------------------------------------+
```

**Badge visual en CustodianCard:**
```text
- Local preferido: Badge azul con icono Home
- Foraneo preferido: Badge verde con icono Plane
- Indistinto: Sin badge (comportamiento actual)
```

### 1.4 Archivos a Crear/Modificar

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/components/operatives/PreferenciaServicioSelector.tsx` | Crear | Componente reutilizable de seleccion |
| `src/hooks/useUpdateCustodioPreferencia.ts` | Crear | Hook para actualizar preferencia |
| `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/CustodianCard.tsx` | Modificar | Agregar badge de preferencia + logica de warning |
| `src/pages/Planeacion/components/configuration/CustodiosZonasTab.tsx` | Modificar | Agregar columna de preferencia editable |
| `src/hooks/useProximidadOperacional.ts` | Modificar | Incorporar preferencia en scoring |
| `src/utils/proximidadOperacional.ts` | Modificar | Penalizacion de score por mismatch |

---

## Parte 2: Gestion de Estatus Activo/Inactivo

### 2.1 Modelo de Datos

**Tabla: `operativo_estatus_historial`** (nueva)
```sql
CREATE TABLE operativo_estatus_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operativo_id UUID NOT NULL,
  operativo_tipo TEXT NOT NULL CHECK (operativo_tipo IN ('custodio', 'armado')),
  estatus_anterior TEXT NOT NULL,
  estatus_nuevo TEXT NOT NULL,
  tipo_cambio TEXT NOT NULL CHECK (tipo_cambio IN ('temporal', 'permanente')),
  motivo TEXT NOT NULL,
  fecha_reactivacion DATE, -- NULL si es permanente
  notas TEXT,
  creado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_operativo_estatus_operativo ON operativo_estatus_historial(operativo_id);
```

**Modificacion a tablas existentes:**
```sql
-- custodios_operativos
ALTER TABLE custodios_operativos 
ADD COLUMN fecha_inactivacion DATE,
ADD COLUMN motivo_inactivacion TEXT,
ADD COLUMN tipo_inactivacion TEXT CHECK (tipo_inactivacion IN ('temporal', 'permanente'));

-- armados_operativos (mismos campos)
ALTER TABLE armados_operativos 
ADD COLUMN fecha_inactivacion DATE,
ADD COLUMN motivo_inactivacion TEXT,
ADD COLUMN tipo_inactivacion TEXT CHECK (tipo_inactivacion IN ('temporal', 'permanente'));
```

### 2.2 Interfaz de Usuario

**Componente: CambioEstatusModal**

```text
+--------------------------------------------------+
|  Cambiar Estatus de: Juan Perez                  |
|  ------------------------------------------------|
|  Estatus actual: [Activo]                        |
|                                                  |
|  Nuevo estatus: [Inactivo v]                     |
|                                                  |
|  Tipo de baja:                                   |
|  ( ) Temporal - Reactivar en fecha especifica    |
|  ( ) Permanente - Baja definitiva                |
|                                                  |
|  [Si es temporal]                                |
|  Fecha de reactivacion: [____/____/____]         |
|                                                  |
|  Motivo de la baja: *                            |
|  +----------------------------------------------+|
|  | - Vacaciones                                 ||
|  | - Incapacidad medica                         ||
|  | - Sancion disciplinaria                      ||
|  | - Baja voluntaria                            ||
|  | - Terminacion de relacion                    ||
|  | - Otro (especificar)                         ||
|  +----------------------------------------------+|
|                                                  |
|  Notas adicionales:                              |
|  [                                             ] |
|                                                  |
|  [Cancelar]                [Confirmar Cambio]    |
+--------------------------------------------------+
```

### 2.3 Automatizacion de Reactivacion

**Edge Function: `auto-reactivar-operativos`**
- Ejecuta diariamente via cron
- Busca registros con `tipo_inactivacion = 'temporal'` y `fecha_reactivacion <= hoy`
- Cambia `estado` a 'activo' y limpia campos de inactivacion
- Registra en historial

### 2.4 Archivos a Crear/Modificar

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/components/operatives/CambioEstatusModal.tsx` | Crear | Modal para cambio de estatus |
| `src/hooks/useCambioEstatusOperativo.ts` | Crear | Logica de cambio con auditoria |
| `src/pages/PerfilesOperativos/components/tabs/InformacionPersonalTab.tsx` | Modificar | Boton de cambio de estatus |
| `src/pages/Planeacion/components/configuration/CustodiosZonasTab.tsx` | Modificar | Accion de estatus en tabla |
| `supabase/functions/auto-reactivar-operativos/index.ts` | Crear | Cron job de reactivacion |

---

## Parte 3: Sistema de Sanciones Configurable

### 3.1 Modelo de Datos

**Tabla: `catalogo_sanciones`** (nueva)
```sql
CREATE TABLE catalogo_sanciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT NOT NULL CHECK (categoria IN ('leve', 'moderada', 'grave', 'muy_grave')),
  dias_suspension_default INTEGER NOT NULL,
  afecta_score BOOLEAN DEFAULT true,
  puntos_score_perdidos INTEGER DEFAULT 0,
  requiere_evidencia BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Catalogo inicial de sanciones
INSERT INTO catalogo_sanciones (codigo, nombre, categoria, dias_suspension_default, puntos_score_perdidos, descripcion) VALUES
('ABANDONO_SERVICIO', 'Abandono de servicio', 'muy_grave', 30, 25, 'Dejar el servicio sin autorizacion'),
('CANCELACION_ULTIMA_HORA', 'Cancelacion a ultima hora', 'grave', 14, 15, 'Cancelar servicio con menos de 2 horas de anticipacion'),
('NO_SHOW', 'No presentarse', 'muy_grave', 21, 20, 'No presentarse al servicio sin avisar'),
('LLEGADA_TARDE', 'Llegada tarde recurrente', 'moderada', 7, 10, 'Llegar tarde a 3+ servicios en 30 dias'),
('INCUMPLIMIENTO_PROTOCOLO', 'Incumplimiento de protocolo', 'grave', 14, 15, 'No seguir protocolos de seguridad'),
('QUEJA_CLIENTE', 'Queja formal de cliente', 'moderada', 7, 10, 'Queja verificada por parte del cliente'),
('DOCUMENTACION_VENCIDA', 'Documentacion vencida', 'leve', 0, 5, 'Operar con documentos vencidos');
```

**Tabla: `sanciones_aplicadas`** (nueva)
```sql
CREATE TABLE sanciones_aplicadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operativo_id UUID NOT NULL,
  operativo_tipo TEXT NOT NULL CHECK (operativo_tipo IN ('custodio', 'armado')),
  sancion_id UUID REFERENCES catalogo_sanciones(id),
  servicio_relacionado_id UUID, -- Opcional: servicio que origino la sancion
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  dias_suspension INTEGER NOT NULL,
  puntos_perdidos INTEGER DEFAULT 0,
  estado TEXT DEFAULT 'activa' CHECK (estado IN ('activa', 'cumplida', 'apelada', 'revocada')),
  evidencia_urls TEXT[],
  notas TEXT,
  aplicada_por UUID REFERENCES auth.users(id),
  revisada_por UUID REFERENCES auth.users(id),
  fecha_revision TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sanciones_operativo ON sanciones_aplicadas(operativo_id, estado);
CREATE INDEX idx_sanciones_fechas ON sanciones_aplicadas(fecha_inicio, fecha_fin);
```

### 3.2 Reglas de Negocio

**Motor de Deteccion Automatica:**

```text
Regla 1: CANCELACION_ULTIMA_HORA
- Trigger: servicio.estado cambia a 'cancelado_custodio'
- Condicion: (fecha_hora_cita - now()) < 2 horas
- Accion: Crear sancion pendiente de revision

Regla 2: NO_SHOW
- Trigger: servicio no tiene check-in y hora_cita + 30min pasaron
- Condicion: No hay registro de indisponibilidad reportada
- Accion: Crear sancion automatica

Regla 3: LLEGADA_TARDE (acumulativo)
- Trigger: 3 o mas servicios con check-in > hora_cita + 15min en 30 dias
- Accion: Crear sancion moderada
```

**Flujo de Aplicacion Manual:**

```text
1. Planeador detecta incumplimiento
2. Abre modal de "Aplicar Sancion"
3. Selecciona tipo de sancion del catalogo
4. Sistema calcula fechas automaticamente
5. Opcionalmente adjunta evidencia
6. Confirma aplicacion
7. Sistema:
   - Crea registro en sanciones_aplicadas
   - Actualiza score del operativo
   - Si dias_suspension > 0, cambia estado a 'suspendido'
   - Notifica al operativo (futuro)
```

### 3.3 Interfaz de Usuario

**Tab de Configuracion: "Sistema de Sanciones"**

```text
+------------------------------------------------------------------+
|  Sistema de Sanciones                                             |
|  ----------------------------------------------------------------|
|  [+ Nueva Sancion]  [Configurar Catalogo]                        |
|                                                                   |
|  Filtros: [Todas v] [Este mes v] [Buscar operativo...]           |
|                                                                   |
|  +--------------------------------------------------------------+|
|  | Operativo    | Tipo        | Fecha    | Dias | Estado        ||
|  |--------------|-------------|----------|------|---------------||
|  | Juan Perez   | Abandono    | 15/01/26 | 30   | Activa        ||
|  | Maria Lopez  | Cancel. UH  | 10/01/26 | 14   | Cumplida      ||
|  | Carlos Ruiz  | No Show     | 05/01/26 | 21   | Apelada       ||
|  +--------------------------------------------------------------+|
+------------------------------------------------------------------+
```

**Modal: AplicarSancionModal**

```text
+--------------------------------------------------+
|  Aplicar Sancion                                  |
|  ------------------------------------------------|
|  Operativo: Juan Perez (Custodio)                |
|                                                  |
|  Tipo de sancion: *                              |
|  [Seleccionar...                            v]   |
|                                                  |
|  [Cuando se selecciona:]                         |
|  Categoria: [GRAVE]                              |
|  Dias de suspension: [14] (editable)             |
|  Puntos a descontar: [15]                        |
|                                                  |
|  Fechas calculadas:                              |
|  Inicio: 03/02/2026                              |
|  Fin: 17/02/2026                                 |
|                                                  |
|  Servicio relacionado (opcional):                |
|  [Buscar servicio...]                            |
|                                                  |
|  Evidencia (opcional):                           |
|  [+ Adjuntar archivo]                            |
|                                                  |
|  Notas:                                          |
|  [                                             ] |
|                                                  |
|  [Cancelar]                 [Aplicar Sancion]    |
+--------------------------------------------------+
```

### 3.4 Archivos a Crear/Modificar

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/pages/Planeacion/components/configuration/SancionesConfigTab.tsx` | Crear | Tab de configuracion de sanciones |
| `src/components/operatives/AplicarSancionModal.tsx` | Crear | Modal para aplicar sanciones |
| `src/components/operatives/CatalogoSancionesDialog.tsx` | Crear | Gestion del catalogo |
| `src/hooks/useSanciones.ts` | Crear | CRUD de sanciones |
| `src/hooks/useCatalogoSanciones.ts` | Crear | Lectura del catalogo |
| `src/pages/Planeacion/components/configuration/PlanningConfigurationTab.tsx` | Modificar | Agregar tab de sanciones |
| `supabase/functions/auto-detectar-incumplimientos/index.ts` | Crear | Deteccion automatica |

---

## Parte 4: Visibilidad Mejorada en Tarjeta de Asignacion

### 4.1 Datos Requeridos

Los datos ya existen en la base de datos:
- `fecha_ultimo_servicio` - Ya existe en `custodios_operativos` y `armados_operativos`
- `tipo_ultimo_servicio` - Ya existe en `custodios_operativos`

**Calculo de dias sin servicio:**
```typescript
const diasSinServicio = fecha_ultimo_servicio 
  ? differenceInDays(new Date(), new Date(fecha_ultimo_servicio))
  : null;
```

### 4.2 Diseno Visual en CustodianCard

**Estado Actual de la tarjeta (lineas 194-213):**
```text
Service History Row actual:
- Servicios hoy
- Ultimo: [fecha corta]
- Dias sin asignar (si > 3)
```

**Nuevo diseno propuesto:**

```text
+--------------------------------------------------+
|  Juan Perez                    [Priorizar] 85%   |
|  ------------------------------------------------|
|  555-1234-5678                 VW Jetta 2020     |
|                                                  |
|  NUEVA SECCION DE HISTORIAL:                     |
|  +----------------------------------------------+|
|  | [Calendar] 8 dias sin servicio               ||
|  | [MapPin] Ultimo: LOCAL (25 ene)              ||
|  | [BarChart] 15d: 3 loc / 2 for                ||
|  +----------------------------------------------+|
|                                                  |
|  [Preferencia: Foraneo] (si aplica)              |
|  ------------------------------------------------|
|  [WhatsApp] [Llamar]  [...] [Asignar ->]         |
+--------------------------------------------------+
```

### 4.3 Componente: ServiceHistoryBadges

```typescript
interface ServiceHistoryBadgesProps {
  diasSinServicio: number | null;
  tipoUltimoServicio: 'local' | 'foraneo' | null;
  fechaUltimoServicio: string | null;
  serviciosLocales15d: number;
  serviciosForaneos15d: number;
}
```

**Logica de colores para dias sin servicio:**
```text
- 0-3 dias: Verde (activo)
- 4-7 dias: Amarillo (alerta)
- 8-14 dias: Naranja (atencion)
- 15+ dias: Rojo (critico)
```

**Logica de iconos para tipo de servicio:**
```text
- Local: Icono Home + badge azul
- Foraneo: Icono Plane + badge verde
- Sin datos: Icono HelpCircle + badge gris
```

### 4.4 Archivos a Modificar

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/CustodianCard.tsx` | Modificar | Agregar nueva seccion de historial |
| `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/ServiceHistoryBadges.tsx` | Crear | Componente de badges de historial |
| `src/hooks/useProximidadOperacional.ts` | Modificar | Incluir datos de historial en respuesta |

---

## Parte 5: Metricas de Actividad Reciente (15 dias)

### 5.1 Origen de Datos

**Opcion A: Calculo en tiempo real (recomendada para precision)**

```sql
-- RPC function: get_servicios_15d_operativo
CREATE OR REPLACE FUNCTION get_servicios_15d_operativo(
  p_operativo_id UUID,
  p_operativo_tipo TEXT
) RETURNS TABLE (
  servicios_locales INT,
  servicios_foraneos INT,
  total_servicios INT
) AS $$
BEGIN
  IF p_operativo_tipo = 'custodio' THEN
    RETURN QUERY
    SELECT 
      COUNT(*) FILTER (WHERE tipo_servicio = 'local')::INT as servicios_locales,
      COUNT(*) FILTER (WHERE tipo_servicio = 'foraneo')::INT as servicios_foraneos,
      COUNT(*)::INT as total_servicios
    FROM servicios_planificados sp
    WHERE sp.custodio_id = p_operativo_id
      AND sp.fecha_programada >= CURRENT_DATE - INTERVAL '15 days'
      AND sp.estado_planeacion IN ('confirmado', 'en_curso', 'finalizado');
  ELSE
    -- Similar para armados usando servicios_custodia
    ...
  END IF;
END;
$$ LANGUAGE plpgsql;
```

**Opcion B: Campos calculados (recomendada para performance)**

Agregar a `custodios_operativos`:
```sql
ALTER TABLE custodios_operativos
ADD COLUMN servicios_locales_15d INT DEFAULT 0,
ADD COLUMN servicios_foraneos_15d INT DEFAULT 0,
ADD COLUMN fecha_calculo_15d TIMESTAMPTZ;
```

Trigger o cron job que actualiza estos campos diariamente.

### 5.2 Integracion con RPC Existente

Modificar `verificar_disponibilidad_equitativa_custodio` para incluir:

```sql
-- Agregar al SELECT del RPC existente:
(SELECT COUNT(*) FROM servicios_planificados 
 WHERE custodio_id = p_custodio_id 
 AND fecha_programada >= CURRENT_DATE - 15 
 AND tipo_servicio = 'local') as servicios_locales_15d,
 
(SELECT COUNT(*) FROM servicios_planificados 
 WHERE custodio_id = p_custodio_id 
 AND fecha_programada >= CURRENT_DATE - 15 
 AND tipo_servicio = 'foraneo') as servicios_foraneos_15d
```

### 5.3 Visualizacion en Tarjeta

**Badge compacto:**
```text
[BarChart] 15d: 3L / 2F
```

**Tooltip expandido:**
```text
Ultimos 15 dias:
- 3 servicios locales
- 2 servicios foraneos
- Total: 5 servicios
```

### 5.4 Archivos a Modificar

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/hooks/useProximidadOperacional.ts` | Modificar | Incluir servicios_15d en respuesta |
| `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/ServiceHistoryBadges.tsx` | Modificar | Mostrar metricas 15d |
| RPC `verificar_disponibilidad_equitativa_custodio` | Modificar | Agregar campos de 15d |

---

## Secuencia de Implementacion Recomendada

### Fase 1: Fundamentos (Semana 1-2)
1. Migraciones de base de datos (todas las tablas nuevas y columnas)
2. Tipos TypeScript actualizados
3. Hooks basicos de CRUD

### Fase 2: Visibilidad en Tarjeta (Semana 2-3)
1. Componente ServiceHistoryBadges
2. Modificacion de CustodianCard
3. Actualizacion de RPC para incluir datos de 15d

### Fase 3: Preferencias de Servicio (Semana 3-4)
1. PreferenciaServicioSelector
2. Integracion en Perfil Forense
3. Edicion masiva en Zonas Base
4. Logica de scoring actualizada

### Fase 4: Gestion de Estatus (Semana 4-5)
1. CambioEstatusModal
2. Historial de cambios
3. Edge function de reactivacion automatica

### Fase 5: Sistema de Sanciones (Semana 5-7)
1. Catalogo de sanciones (admin)
2. AplicarSancionModal
3. Tab de configuracion
4. Deteccion automatica (edge function)

---

## Consideraciones de UX (Vision del UX Manager)

### Principios de Diseno

1. **Visibilidad Progresiva**: La informacion mas critica (dias sin servicio, preferencia) debe ser visible inmediatamente. Detalles adicionales en tooltips o expansion.

2. **Codigo de Colores Consistente**:
   - Verde: Optimo/Activo
   - Amarillo: Alerta/Atencion
   - Naranja: Advertencia
   - Rojo: Critico/Bloqueante

3. **Feedback Inmediato**: Toda accion (aplicar sancion, cambiar estatus) debe mostrar confirmacion visual y notificacion.

4. **Prevencion de Errores**: Modales de confirmacion para acciones destructivas (sanciones graves, bajas permanentes).

5. **Auditabilidad**: Cada cambio queda registrado con quien, cuando y por que.

### Flujo de Planeador

```text
1. Planeador abre asignacion de servicio
2. Ve lista de custodios con:
   - Dias sin servicio (color-coded)
   - Tipo ultimo servicio (icono)
   - Preferencia (badge si no es indistinto)
   - Servicios 15d (compacto)
3. Si custodio tiene sancion activa: aparece en rojo con motivo
4. Puede filtrar por preferencia: "Solo que prefieran local"
5. Al seleccionar, si hay mismatch de preferencia: warning
6. Puede reportar incumplimiento desde la tarjeta (menu contextual)
```

---

## Resumen de Entregables

| Componente | Tipo | Prioridad |
|------------|------|-----------|
| ServiceHistoryBadges.tsx | Nuevo | Alta |
| PreferenciaServicioSelector.tsx | Nuevo | Alta |
| CambioEstatusModal.tsx | Nuevo | Alta |
| AplicarSancionModal.tsx | Nuevo | Media |
| SancionesConfigTab.tsx | Nuevo | Media |
| CatalogoSancionesDialog.tsx | Nuevo | Media |
| CustodianCard.tsx | Modificar | Alta |
| CustodiosZonasTab.tsx | Modificar | Media |
| useProximidadOperacional.ts | Modificar | Alta |
| useSanciones.ts | Nuevo | Media |
| useCambioEstatusOperativo.ts | Nuevo | Alta |
| Migraciones SQL (5 scripts) | Nuevo | Alta |
| Edge Functions (2) | Nuevo | Baja |

---

## Metricas de Exito

1. **Reduccion de asignaciones incompatibles**: Medir % de servicios donde preferencia != tipo_servicio
2. **Tiempo de respuesta a incumplimientos**: De dias a horas con sistema de sanciones
3. **Visibilidad de flota inactiva**: Dashboard muestra custodios sin servicio > 7 dias
4. **Equidad en asignaciones**: Reduccion de desviacion estandar en servicios/custodio
