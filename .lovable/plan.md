
# Plan: Hardening Completo del Sistema de Checklist Pre-Producción

## Resumen Ejecutivo

Este plan cierra todas las brechas identificadas en el flujo de checklist y registro de custodios para garantizar un sistema robusto antes del lanzamiento a producción. Incluye sincronización de servicios, validación de existencia de documentos obligatorios, y un onboarding completo para nuevos custodios.

---

## Brechas Identificadas y Soluciones

| Brecha | Severidad | Solución |
|--------|-----------|----------|
| Custodio no ve servicios planificados | **CRÍTICA** | Modificar `useNextService` para consultar ambas tablas |
| Documentos faltantes permiten avanzar | **ALTA** | Validar existencia de 3 documentos obligatorios |
| Sin onboarding de documentos | **ALTA** | Crear flujo post-registro para subir documentos |
| Inconsistencia UUID vs Teléfono | **MEDIA** | Agregar campo `custodio_telefono` a `servicios_planificados` |

---

## Arquitectura de Sincronización de Servicios

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE VISIBILIDAD DE SERVICIOS (ACTUAL)                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  PLANEACIÓN                              CUSTODIO PORTAL                            │
│  ┌──────────────────────┐                ┌──────────────────────┐                   │
│  │ servicios_planificados│                │ useNextService.ts    │                   │
│  │ - custodio_id (UUID)  │      ❌        │ - query: servicios_  │                   │
│  │ - custodio_asignado   │────────────────│   custodia (phone)   │                   │
│  │ (NO HAY telefono)     │  NO CONECTA    │                      │                   │
│  └──────────────────────┘                └──────────────────────┘                   │
│                                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                    FLUJO DE VISIBILIDAD DE SERVICIOS (PROPUESTO)                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  PLANEACIÓN                              CUSTODIO PORTAL                            │
│  ┌──────────────────────┐                ┌──────────────────────┐                   │
│  │ servicios_planificados│                │ useNextService.ts    │                   │
│  │ - custodio_id (UUID)  │      ✅        │ - query UNION:       │                   │
│  │ - custodio_telefono   │────────────────│   1. servicios_plan  │                   │
│  │   (NUEVO CAMPO)       │   CONECTA VIA  │      (via telefono)  │                   │
│  │                       │   TELEFONO     │   2. servicios_cust  │                   │
│  └──────────────────────┘                │      (via telefono)  │                   │
│         │                                └──────────────────────┘                   │
│         │ TRIGGER                                                                   │
│         ▼                                                                           │
│  ┌──────────────────────┐                                                           │
│  │ sync_custodio_phone  │                                                           │
│  │ ON INSERT/UPDATE     │                                                           │
│  │ Copia telefono de    │                                                           │
│  │ custodios_operativos │                                                           │
│  └──────────────────────┘                                                           │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Flujo de Onboarding de Documentos

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE ONBOARDING (PROPUESTO)                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  [Registro exitoso]                                                                 │
│         │                                                                           │
│         ▼                                                                           │
│  ┌──────────────────────┐                                                           │
│  │ CustodianOnboarding  │  ← NUEVA PÁGINA                                           │
│  │ /custodian/onboarding│                                                           │
│  │                      │                                                           │
│  │ "¡Bienvenido! Para   │                                                           │
│  │  iniciar servicios,  │                                                           │
│  │  sube tus documentos"│                                                           │
│  └──────────┬───────────┘                                                           │
│             │                                                                       │
│             ▼                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐                   │
│  │                   WIZARD DE DOCUMENTOS                       │                   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐              │                   │
│  │  │  Licencia  │  │  Tarjeta   │  │  Póliza    │              │                   │
│  │  │  Conducir  │──│Circulación │──│  Seguro    │              │                   │
│  │  │  📷 + 📅   │  │  📷 + 📅   │  │  📷 + 📅   │              │                   │
│  │  └────────────┘  └────────────┘  └────────────┘              │                   │
│  │       FOTO         FOTO           FOTO                       │                   │
│  │     VIGENCIA      VIGENCIA       VIGENCIA                    │                   │
│  └──────────────────────────────────────────────────────────────┘                   │
│             │                                                                       │
│             ▼                                                                       │
│  ┌──────────────────────┐                                                           │
│  │ Onboarding Completo  │                                                           │
│  │ redirect → /custodian│                                                           │
│  │ flag: docs_complete  │                                                           │
│  └──────────────────────┘                                                           │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Componentes a Crear

### 1. Migración SQL: Sincronización de Teléfono

**Archivo:** `supabase/migrations/XXX_custodio_telefono_sync.sql`

```sql
-- Agregar campo telefono a servicios_planificados
ALTER TABLE servicios_planificados 
ADD COLUMN IF NOT EXISTS custodio_telefono TEXT;

-- Crear índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_servicios_planificados_custodio_telefono 
ON servicios_planificados(custodio_telefono);

-- Trigger para sincronizar teléfono automáticamente
CREATE OR REPLACE FUNCTION sync_custodio_telefono()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.custodio_id IS NOT NULL AND NEW.custodio_id != OLD.custodio_id THEN
    SELECT telefono INTO NEW.custodio_telefono
    FROM custodios_operativos
    WHERE id = NEW.custodio_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
CREATE TRIGGER trg_sync_custodio_telefono
BEFORE INSERT OR UPDATE ON servicios_planificados
FOR EACH ROW EXECUTE FUNCTION sync_custodio_telefono();

-- Backfill datos existentes
UPDATE servicios_planificados sp
SET custodio_telefono = co.telefono
FROM custodios_operativos co
WHERE sp.custodio_id = co.id
AND sp.custodio_telefono IS NULL;
```

### 2. Hook Modificado: `useNextService.ts`

**Cambios:**
- Query UNION entre `servicios_planificados` y `servicios_custodia`
- Normalizar campos para interface común
- Priorizar servicios planificados (más recientes)

**Lógica:**
```typescript
// Query servicios_planificados (sistema nuevo)
const planificados = await supabase
  .from('servicios_planificados')
  .select('id, id_servicio, nombre_cliente, origen, destino, fecha_hora_cita, estado_planeacion, tipo_servicio')
  .eq('custodio_telefono', phone)
  .gte('fecha_hora_cita', today)
  .in('estado_planeacion', ['asignado', 'confirmado', 'en_transito']);

// Query servicios_custodia (sistema legacy)
const custodia = await supabase
  .from('servicios_custodia')
  .select(...)
  .or(`telefono.eq.${phone},telefono_operador.eq.${phone}`);

// Combinar y ordenar por fecha, priorizar planificados
```

### 3. Página de Onboarding: `CustodianOnboarding.tsx`

**Archivo:** `src/pages/custodian/CustodianOnboarding.tsx`

**Características:**
- Wizard de 3 pasos (un documento por paso)
- Cada paso requiere foto + fecha vigencia
- Botón "Siguiente" bloqueado hasta completar
- Al finalizar, marcar `onboarding_completado` en profiles
- Redirección automática a dashboard

### 4. Validación de Documentos Obligatorios

**Modificar:** `src/components/custodian/checklist/StepDocuments.tsx`

**Cambios:**
```typescript
const REQUIRED_DOCUMENTS = ['licencia_conducir', 'tarjeta_circulacion', 'poliza_seguro'];

// ANTES: Solo verifica vencidos
const canProceed = expiredDocs.length === 0;

// DESPUÉS: Verifica existencia Y vigencia
const missingDocs = REQUIRED_DOCUMENTS.filter(
  tipo => !documents.find(d => d.tipo_documento === tipo)
);
const expiredDocs = getExpiredDocuments();
const canProceed = missingDocs.length === 0 && expiredDocs.length === 0;
```

### 5. Guard de Onboarding: `OnboardingGuard.tsx`

**Archivo:** `src/components/custodian/OnboardingGuard.tsx`

**Función:**
- Wrapper que verifica si custodio tiene documentos completos
- Si no tiene los 3 documentos → redirect a `/custodian/onboarding`
- Si tiene documentos completos → render children

### 6. Campo en Profiles: `onboarding_completado`

**Migración:**
```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completado BOOLEAN DEFAULT FALSE;
```

---

## Archivos a Crear

| Archivo | Descripción | Líneas Est. |
|---------|-------------|-------------|
| `supabase/migrations/XXX_custodio_telefono_sync.sql` | Sync de teléfono + trigger | ~50 |
| `src/pages/custodian/CustodianOnboarding.tsx` | Wizard de documentos | ~250 |
| `src/components/custodian/OnboardingGuard.tsx` | Guard de redirección | ~60 |
| `src/components/custodian/onboarding/DocumentUploadStep.tsx` | Paso individual del wizard | ~120 |

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/hooks/useNextService.ts` | Query UNION con servicios_planificados |
| `src/components/custodian/checklist/StepDocuments.tsx` | Validar existencia de documentos |
| `src/App.tsx` | Agregar ruta `/custodian/onboarding` |
| `src/pages/Auth/CustodianSignup.tsx` | Redirect a onboarding post-registro |
| `src/hooks/useCustodianDocuments.ts` | Agregar `getMissingDocuments()` |

---

## Orden de Implementación

### Fase 1: Infraestructura de Datos (Crítico)
1. Crear migración SQL para `custodio_telefono` en `servicios_planificados`
2. Crear trigger de sincronización
3. Ejecutar backfill de datos existentes

### Fase 2: Sincronización de Servicios (Crítico)
4. Modificar `useNextService.ts` para query UNION
5. Probar que custodio ve servicios planificados

### Fase 3: Validación de Documentos (Alta)
6. Modificar `StepDocuments.tsx` para validar existencia
7. Agregar mensajes diferenciados (faltante vs vencido)

### Fase 4: Onboarding de Nuevos Custodios (Alta)
8. Crear `CustodianOnboarding.tsx` con wizard de 3 pasos
9. Crear `OnboardingGuard.tsx`
10. Modificar `CustodianSignup.tsx` para redirect post-registro
11. Agregar ruta en `App.tsx`

### Fase 5: Testing End-to-End
12. Test: Nuevo custodio → registro → onboarding → documentos
13. Test: Custodio existente → servicio planificado visible
14. Test: Checklist bloquea si documento faltante
15. Test: Checklist bloquea si documento vencido

---

## Validaciones de Seguridad Post-Implementación

- [ ] Custodio solo ve SUS servicios (filtro por teléfono)
- [ ] Fotos requieren cámara trasera (capture="environment")
- [ ] Documentos se suben a bucket privado
- [ ] No se puede avanzar sin los 3 documentos
- [ ] No se puede avanzar con documentos vencidos
- [ ] Trigger sincroniza teléfono automáticamente
- [ ] RLS protege documentos (solo propios)

---

## Consideraciones Técnicas

### Performance
- Índice en `custodio_telefono` para queries rápidas
- Query UNION optimizada con LIMIT 1
- Cache de TanStack Query con staleTime apropiado

### Offline
- Onboarding requiere conexión (subida de fotos)
- Checklist mantiene capacidad offline existente

### Migración de Datos
- Backfill ejecuta una sola vez
- Trigger mantiene sincronía en tiempo real
- No rompe datos existentes en `servicios_custodia`

### UX Mobile
- Wizard de onboarding optimizado para móvil
- Botones grandes, texto claro
- Feedback visual de progreso
- Compresión de imágenes antes de subir
