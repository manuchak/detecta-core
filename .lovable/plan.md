
# Plan Completo: Sistema de Checklist de Servicios para Custodios

## Resumen Ejecutivo

Este documento detalla la implementacion completa de un sistema de checklist pre-servicio para custodios, diseñado para funcionar offline-first con sincronizacion automatica, validacion de geolocalizacion no bloqueante, y auditoria completa para el equipo de monitoreo.

---

## Contexto y Requisitos del Negocio

### Problema a Resolver
Los custodios necesitan completar un checklist antes de cada servicio para garantizar que:
1. El vehiculo esta en condiciones operativas
2. La documentacion esta vigente
3. Hay evidencia fotografica desde 4 angulos del vehiculo
4. El equipo de monitoreo tiene visibilidad del estado pre-servicio

### Requisitos Tecnicos Criticos
1. **Offline-First**: Funcionar sin señal celular (zonas rurales/industriales)
2. **Solo Camara**: Bloquear galeria para evitar fotos antiguas/reutilizadas
3. **Validacion GPS No Bloqueante**: Registrar advertencias para auditoria, no bloquear al custodio
4. **Documentos con Vigencia**: Solo pedir actualizacion cuando esten vencidos
5. **Sincronizacion Automatica**: Subir datos al recuperar conexion

---

## Arquitectura General

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           ARQUITECTURA OFFLINE-FIRST                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│   ┌─────────────────┐     ┌──────────────────┐     ┌──────────────────────────┐    │
│   │   CUSTODIAN     │     │   LOCAL STORE    │     │      SUPABASE            │    │
│   │   MOBILE UI     │────►│   (IndexedDB)    │────►│  (Database + Storage)    │    │
│   │                 │     │                  │     │                          │    │
│   │ - Wizard 4 pasos│     │ - checklist_draft│     │ - checklist_servicio     │    │
│   │ - Camera capture│     │ - photo_blobs    │     │ - documentos_custodio    │    │
│   │ - Firma digital │     │ - sync_queue     │     │ - checklist-evidencias/  │    │
│   └─────────────────┘     └──────────────────┘     └──────────────────────────┘    │
│           │                       │                           ▲                     │
│           │                       │                           │                     │
│           ▼                       ▼                           │                     │
│   ┌─────────────────┐     ┌──────────────────┐               │                     │
│   │   EXIF/GPS      │     │   SYNC ENGINE    │───────────────┘                     │
│   │   EXTRACTION    │     │                  │                                     │
│   │                 │     │ - Online/Offline │                                     │
│   │ - Coordenadas   │     │ - Auto-retry     │                                     │
│   │ - Timestamp     │     │ - Background sync│                                     │
│   │ - Distancia calc│     │ - Progress track │                                     │
│   └─────────────────┘     └──────────────────┘                                     │
│                                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                    MONITORING DASHBOARD                                      │   │
│   │                                                                              │   │
│   │  - Galeria de fotos validadas                                               │   │
│   │  - Alertas de geolocalizacion (fotos fuera de rango)                        │   │
│   │  - Estado de documentos del custodio                                        │   │
│   │  - Indicador de checklist offline                                           │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Flujo de Usuario (UX Detallado)

```text
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  DASHBOARD CUSTODIO                                                                  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐      │
│  │  📋 PROXIMO SERVICIO                                                       │      │
│  │                                                                            │      │
│  │  Cliente: Transportes del Norte                                            │      │
│  │  Hora: 6:00 AM                                                            │      │
│  │  Ruta: Toluca → Queretaro                                                 │      │
│  │                                                                            │      │
│  │  ┌──────────────────────────────────────────────────────┐                 │      │
│  │  │  📝 INICIAR CHECKLIST PRE-SERVICIO                   │                 │      │
│  │  │      (Requerido antes de salir)                      │                 │      │
│  │  └──────────────────────────────────────────────────────┘                 │      │
│  │                                                                            │      │
│  └────────────────────────────────────────────────────────────────────────────┘      │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  PASO 1 DE 4: DOCUMENTOS                                    [🔴 Sin conexion]        │
│                                                                                      │
│  Verifica que tus documentos esten vigentes                                         │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐        │
│  │  ✅ Licencia de Conducir                                                │        │
│  │     Vigente hasta: 15 Mar 2027                                          │        │
│  │     [Sin cambios necesarios]                                            │        │
│  └─────────────────────────────────────────────────────────────────────────┘        │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐        │
│  │  ✅ Poliza de Seguro                                                    │        │
│  │     Vigente hasta: 31 Dic 2026                                          │        │
│  │     [Sin cambios necesarios]                                            │        │
│  └─────────────────────────────────────────────────────────────────────────┘        │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐        │
│  │  ⚠️ Verificacion Vehicular                                              │        │
│  │     VENCIDA - Venció el 01 Ene 2025                                     │        │
│  │     ┌──────────────────────────────────────────┐                        │        │
│  │     │  📷 Actualizar documento                 │                        │        │
│  │     └──────────────────────────────────────────┘                        │        │
│  └─────────────────────────────────────────────────────────────────────────┘        │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐                  │
│  │  💾 Progreso guardado localmente                              │                  │
│  └───────────────────────────────────────────────────────────────┘                  │
│                                                                                      │
│  [← Cancelar]                                      [Siguiente →]                     │
└──────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  PASO 2 DE 4: INSPECCION DEL VEHICULO                       [🔴 Sin conexion]        │
│                                                                                      │
│  Confirma el estado de tu vehiculo                                                   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐        │
│  │                                                                         │        │
│  │  ┌──────────────────┐    ┌──────────────────┐                          │        │
│  │  │                  │    │                  │                          │        │
│  │  │   🛞 LLANTAS     │    │   💡 LUCES       │                          │        │
│  │  │                  │    │                  │                          │        │
│  │  │      [ ✓ ]       │    │      [ ✓ ]       │                          │        │
│  │  │                  │    │                  │                          │        │
│  │  └──────────────────┘    └──────────────────┘                          │        │
│  │                                                                         │        │
│  │  ┌──────────────────┐    ┌──────────────────┐                          │        │
│  │  │                  │    │                  │                          │        │
│  │  │   🛑 FRENOS      │    │   🪞 ESPEJOS     │                          │        │
│  │  │                  │    │                  │                          │        │
│  │  │      [ ✓ ]       │    │      [ ✓ ]       │                          │        │
│  │  │                  │    │                  │                          │        │
│  │  └──────────────────┘    └──────────────────┘                          │        │
│  │                                                                         │        │
│  │  ┌──────────────────┐    ┌──────────────────┐                          │        │
│  │  │                  │    │                  │                          │        │
│  │  │  🚿 LIMPIABRISAS │    │  🚗 CARROCERIA   │                          │        │
│  │  │                  │    │                  │                          │        │
│  │  │      [ ✓ ]       │    │      [   ]       │                          │        │
│  │  │                  │    │                  │                          │        │
│  │  └──────────────────┘    └──────────────────┘                          │        │
│  │                                                                         │        │
│  └─────────────────────────────────────────────────────────────────────────┘        │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐        │
│  │  ⛽ NIVEL DE COMBUSTIBLE                                                │        │
│  │                                                                         │        │
│  │  [LLENO]───[3/4]───[1/2]───[1/4]───[VACIO]                             │        │
│  │    ●────────○───────○───────○────────○                                 │        │
│  │                                                                         │        │
│  └─────────────────────────────────────────────────────────────────────────┘        │
│                                                                                      │
│  [← Anterior]                                      [Siguiente →]                     │
└──────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  PASO 3 DE 4: FOTOS DEL VEHICULO                            [🟢 Conectado]           │
│                                                                                      │
│  Toma una foto desde cada angulo (4 requeridas)                                     │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐        │
│  │                                                                         │        │
│  │  ┌──────────────────────┐    ┌──────────────────────┐                  │        │
│  │  │                      │    │                      │                  │        │
│  │  │      FRONTAL         │    │      TRASERO         │                  │        │
│  │  │                      │    │                      │                  │        │
│  │  │   ┌────────────┐     │    │   ┌────────────┐     │                  │        │
│  │  │   │            │     │    │   │            │     │                  │        │
│  │  │   │    ✅      │     │    │   │    ⚠️      │     │                  │        │
│  │  │   │   85m      │     │    │   │   850m     │     │                  │        │
│  │  │   │            │     │    │   │            │     │                  │        │
│  │  │   └────────────┘     │    │   └────────────┘     │                  │        │
│  │  │                      │    │   Lejos del origen   │                  │        │
│  │  └──────────────────────┘    └──────────────────────┘                  │        │
│  │                                                                         │        │
│  │  ┌──────────────────────┐    ┌──────────────────────┐                  │        │
│  │  │                      │    │                      │                  │        │
│  │  │    LATERAL IZQ       │    │    LATERAL DER       │                  │        │
│  │  │                      │    │                      │                  │        │
│  │  │   ┌────────────┐     │    │   ┌────────────┐     │                  │        │
│  │  │   │            │     │    │   │            │     │                  │        │
│  │  │   │    ⚠️      │     │    │   │   [ 📷 ]   │     │                  │        │
│  │  │   │  Sin GPS   │     │    │   │   Tomar    │     │                  │        │
│  │  │   │            │     │    │   │            │     │                  │        │
│  │  │   └────────────┘     │    │   └────────────┘     │                  │        │
│  │  │                      │    │                      │                  │        │
│  │  └──────────────────────┘    └──────────────────────┘                  │        │
│  │                                                                         │        │
│  └─────────────────────────────────────────────────────────────────────────┘        │
│                                                                                      │
│  ⚠️ Advertencias registradas:                                                       │
│  • Foto "Trasero" tomada a 850m del origen (sera auditada)                          │
│  • Foto "Lateral Izq" sin GPS (sera auditada)                                       │
│                                                                                      │
│  Estas advertencias NO te impiden continuar, pero seran revisadas por Monitoreo.    │
│                                                                                      │
│  [← Anterior]                                      [Siguiente →]                     │
└──────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  PASO 4 DE 4: CONFIRMACION                                  [🟢 Conectado]           │
│                                                                                      │
│  Revisa y confirma tu checklist                                                      │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐        │
│  │                                                                         │        │
│  │  📋 RESUMEN                                                             │        │
│  │                                                                         │        │
│  │  Documentos:  ✅ 3/3 vigentes (1 actualizado)                           │        │
│  │  Vehiculo:    ✅ 5/6 items OK                                           │        │
│  │  Fotos:       ⚠️ 4/4 (2 con advertencias)                               │        │
│  │                                                                         │        │
│  │  ─────────────────────────────────────────────────────────────          │        │
│  │                                                                         │        │
│  │  📝 OBSERVACIONES (opcional)                                            │        │
│  │  ┌─────────────────────────────────────────────────────────┐            │        │
│  │  │                                                         │            │        │
│  │  │  Carroceria tiene un rayón pequeño en puerta...        │            │        │
│  │  │                                                         │            │        │
│  │  └─────────────────────────────────────────────────────────┘            │        │
│  │                                                                         │        │
│  │  ─────────────────────────────────────────────────────────────          │        │
│  │                                                                         │        │
│  │  ✍️ FIRMA DIGITAL                                                       │        │
│  │  ┌─────────────────────────────────────────────────────────┐            │        │
│  │  │                                                         │            │        │
│  │  │          [Dibuja tu firma aqui]                         │            │        │
│  │  │                    ~~~                                  │            │        │
│  │  │                                                         │            │        │
│  │  └─────────────────────────────────────────────────────────┘            │        │
│  │                     [Limpiar firma]                                     │        │
│  │                                                                         │        │
│  └─────────────────────────────────────────────────────────────────────────┘        │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐      │
│  │                                                                           │      │
│  │   ✅  CONFIRMAR E INICIAR SERVICIO                                        │      │
│  │                                                                           │      │
│  └───────────────────────────────────────────────────────────────────────────┘      │
│                                                                                      │
│  [← Anterior]                                                                        │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Modelo de Datos Completo

### Tabla: documentos_custodio

```sql
-- Almacena documentos persistentes del custodio con vigencias
CREATE TABLE documentos_custodio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custodio_telefono TEXT NOT NULL,
  tipo_documento TEXT NOT NULL CHECK (tipo_documento IN (
    'licencia_conducir',
    'tarjeta_circulacion', 
    'poliza_seguro',
    'verificacion_vehicular',
    'credencial_custodia'
  )),
  numero_documento TEXT,
  fecha_emision DATE,
  fecha_vigencia DATE NOT NULL,
  foto_url TEXT,
  verificado BOOLEAN DEFAULT false,
  verificado_por UUID REFERENCES auth.users(id),
  fecha_verificacion TIMESTAMPTZ,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint: Un documento por tipo por custodio
  UNIQUE(custodio_telefono, tipo_documento)
);

-- Indice para consultas frecuentes
CREATE INDEX idx_documentos_custodio_telefono ON documentos_custodio(custodio_telefono);
CREATE INDEX idx_documentos_custodio_vigencia ON documentos_custodio(fecha_vigencia);
CREATE INDEX idx_documentos_vencidos ON documentos_custodio(fecha_vigencia) 
  WHERE fecha_vigencia < CURRENT_DATE;
```

### Tabla: checklist_servicio

```sql
-- Almacena el checklist completado para cada servicio
CREATE TABLE checklist_servicio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id TEXT NOT NULL,
  custodio_telefono TEXT NOT NULL,
  
  -- Timestamps
  fecha_checklist TIMESTAMPTZ DEFAULT now(),
  fecha_captura_local TIMESTAMPTZ,        -- Cuando se capturo (puede ser offline)
  fecha_sincronizacion TIMESTAMPTZ,       -- Cuando se sincronizo
  
  -- Estado
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completo', 'incompleto')),
  sincronizado_offline BOOLEAN DEFAULT false,
  
  -- Items de inspeccion (estructura JSONB)
  items_inspeccion JSONB DEFAULT '{
    "vehiculo": {
      "llantas_ok": null,
      "luces_ok": null,
      "frenos_ok": null,
      "espejos_ok": null,
      "limpiabrisas_ok": null,
      "carroceria_ok": null,
      "nivel_combustible": null
    },
    "equipamiento": {
      "gato_hidraulico": null,
      "llanta_refaccion": null,
      "triangulos": null,
      "extintor": null
    }
  }'::jsonb,
  
  -- Fotos validadas con metadata GPS (JSONB array)
  fotos_validadas JSONB DEFAULT '[]'::jsonb,
  -- Estructura: [{
  --   "angle": "frontal|trasero|lateral_izq|lateral_der",
  --   "url": "https://...",
  --   "geotag_lat": 19.4326,
  --   "geotag_lng": -99.1332,
  --   "distancia_origen_m": 85,
  --   "validacion": "ok|sin_gps|fuera_rango",
  --   "captured_at": "ISO timestamp",
  --   "capturado_offline": true
  -- }]
  
  -- Datos adicionales
  observaciones TEXT,
  firma_base64 TEXT,
  
  -- Ubicacion al completar
  ubicacion_lat NUMERIC,
  ubicacion_lng NUMERIC,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint: Un checklist por servicio por custodio
  UNIQUE(servicio_id, custodio_telefono)
);

-- Indices para consultas frecuentes
CREATE INDEX idx_checklist_servicio_id ON checklist_servicio(servicio_id);
CREATE INDEX idx_checklist_custodio ON checklist_servicio(custodio_telefono);
CREATE INDEX idx_checklist_fecha ON checklist_servicio(fecha_checklist);
CREATE INDEX idx_checklist_estado ON checklist_servicio(estado);

-- Indice GIN para buscar checklists con advertencias de GPS (auditoria)
CREATE INDEX idx_checklist_alertas_gps ON checklist_servicio 
  USING GIN (fotos_validadas jsonb_path_ops);
```

### Storage Bucket

```sql
-- Crear bucket para evidencias fotograficas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'checklist-evidencias', 
  'checklist-evidencias', 
  false, 
  10485760,  -- 10MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- RLS: Custodios pueden subir a su carpeta
CREATE POLICY "Custodios suben evidencias"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'checklist-evidencias' AND
  auth.role() = 'authenticated'
);

-- RLS: Custodios y staff pueden ver
CREATE POLICY "Ver evidencias checklist"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'checklist-evidencias' AND
  auth.role() = 'authenticated'
);
```

### RLS Policies

```sql
-- Habilitar RLS
ALTER TABLE documentos_custodio ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_servicio ENABLE ROW LEVEL SECURITY;

-- Custodios gestionan sus documentos
CREATE POLICY "Custodios gestionan documentos propios"
ON documentos_custodio FOR ALL
USING (
  custodio_telefono = (SELECT phone FROM profiles WHERE id = auth.uid())
);

-- Staff ve todos los documentos
CREATE POLICY "Staff ve todos los documentos"
ON documentos_custodio FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'planeacion', 'monitoreo', 'coordinador')
  )
);

-- Custodios gestionan su checklist
CREATE POLICY "Custodios gestionan checklist propio"
ON checklist_servicio FOR ALL
USING (
  custodio_telefono = (SELECT phone FROM profiles WHERE id = auth.uid())
);

-- Staff ve todos los checklists
CREATE POLICY "Staff ve todos los checklists"
ON checklist_servicio FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'planeacion', 'monitoreo', 'coordinador')
  )
);
```

---

## Estructura de Archivos

```text
src/
├── types/
│   └── checklist.ts                        # Tipos TypeScript para checklist
│
├── lib/
│   ├── offlineStorage.ts                   # Wrapper IndexedDB (idb)
│   └── geoUtils.ts                         # Funciones GPS/Haversine/EXIF
│
├── hooks/
│   ├── useNetworkStatus.ts                 # Estado online/offline
│   ├── useOfflineSync.ts                   # Motor de sincronizacion
│   ├── useCustodianDocuments.ts            # CRUD documentos con vigencia
│   └── useServiceChecklist.ts              # CRUD checklist servicio
│
├── components/
│   └── custodian/
│       └── checklist/
│           ├── ChecklistWizard.tsx         # Contenedor wizard 4 pasos
│           ├── ChecklistProgressBar.tsx    # Barra de progreso visual
│           ├── OfflineIndicator.tsx        # Badge estado de red
│           ├── SyncStatusBanner.tsx        # Banner de sincronizacion
│           │
│           ├── StepDocuments.tsx           # Paso 1: Documentos
│           ├── DocumentCard.tsx            # Card documento individual
│           ├── DocumentExpiryBadge.tsx     # Badge vigencia
│           │
│           ├── StepVehicleInspection.tsx   # Paso 2: Inspeccion
│           ├── InspectionCheckbox.tsx      # Checkbox grande tactil
│           ├── FuelGauge.tsx               # Selector nivel combustible
│           │
│           ├── StepVehiclePhotos.tsx       # Paso 3: Fotos
│           ├── SecureCameraCapture.tsx     # Captura solo-camara
│           ├── PhotoSlot.tsx               # Slot individual por angulo
│           ├── GeoValidationBadge.tsx      # Badge validacion GPS
│           │
│           ├── StepConfirmation.tsx        # Paso 4: Confirmacion
│           ├── ChecklistSummary.tsx        # Resumen visual
│           └── SignaturePad.tsx            # Canvas firma digital
│
├── pages/
│   └── custodian/
│       └── ServiceChecklistPage.tsx        # Pagina principal
│
└── components/
    └── monitoring/
        └── ChecklistAuditSection.tsx       # Seccion auditoria para ServiceDetailModal
```

---

## Plan de Implementacion por Fases

### FASE 1: Infraestructura Base (Sin UI)
**Objetivo**: Crear la base de datos, tipos y utilidades sin componentes UI para evitar errores de dependencias.

#### Paso 1.1: Crear tipos TypeScript
**Archivo**: `src/types/checklist.ts`

```typescript
// Tipos base para el sistema de checklist

export type TipoDocumentoCustodio = 
  | 'licencia_conducir'
  | 'tarjeta_circulacion'
  | 'poliza_seguro'
  | 'verificacion_vehicular'
  | 'credencial_custodia';

export type EstadoChecklist = 'pendiente' | 'completo' | 'incompleto';

export type ValidacionGeo = 'ok' | 'sin_gps' | 'fuera_rango' | 'pendiente';

export type AnguloFoto = 'frontal' | 'trasero' | 'lateral_izq' | 'lateral_der';

export type NivelCombustible = 'lleno' | '3/4' | '1/2' | '1/4' | 'vacio';

export interface DocumentoCustodio {
  id: string;
  custodio_telefono: string;
  tipo_documento: TipoDocumentoCustodio;
  numero_documento?: string;
  fecha_emision?: string;
  fecha_vigencia: string;
  foto_url?: string;
  verificado: boolean;
  verificado_por?: string;
  fecha_verificacion?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
}

export interface ItemsInspeccion {
  vehiculo: {
    llantas_ok: boolean | null;
    luces_ok: boolean | null;
    frenos_ok: boolean | null;
    espejos_ok: boolean | null;
    limpiabrisas_ok: boolean | null;
    carroceria_ok: boolean | null;
    nivel_combustible: NivelCombustible | null;
  };
  equipamiento: {
    gato_hidraulico: boolean | null;
    llanta_refaccion: boolean | null;
    triangulos: boolean | null;
    extintor: boolean | null;
  };
}

export interface FotoValidada {
  angle: AnguloFoto;
  url?: string;
  localBlobId?: string; // ID en IndexedDB si esta offline
  geotag_lat: number | null;
  geotag_lng: number | null;
  distancia_origen_m: number | null;
  validacion: ValidacionGeo;
  captured_at: string;
  capturado_offline: boolean;
}

export interface ChecklistServicio {
  id: string;
  servicio_id: string;
  custodio_telefono: string;
  fecha_checklist: string;
  fecha_captura_local?: string;
  fecha_sincronizacion?: string;
  estado: EstadoChecklist;
  sincronizado_offline: boolean;
  items_inspeccion: ItemsInspeccion;
  fotos_validadas: FotoValidada[];
  observaciones?: string;
  firma_base64?: string;
  ubicacion_lat?: number;
  ubicacion_lng?: number;
  created_at: string;
  updated_at: string;
}

// Constantes para labels de UI
export const DOCUMENTO_LABELS: Record<TipoDocumentoCustodio, string> = {
  licencia_conducir: 'Licencia de Conducir',
  tarjeta_circulacion: 'Tarjeta de Circulación',
  poliza_seguro: 'Póliza de Seguro',
  verificacion_vehicular: 'Verificación Vehicular',
  credencial_custodia: 'Credencial de Custodia'
};

export const ANGULO_LABELS: Record<AnguloFoto, string> = {
  frontal: 'Frontal',
  trasero: 'Trasero',
  lateral_izq: 'Lateral Izquierdo',
  lateral_der: 'Lateral Derecho'
};

export const INSPECCION_ITEMS = [
  { key: 'llantas_ok', label: 'Llantas', icon: '🛞' },
  { key: 'luces_ok', label: 'Luces', icon: '💡' },
  { key: 'frenos_ok', label: 'Frenos', icon: '🛑' },
  { key: 'espejos_ok', label: 'Espejos', icon: '🪞' },
  { key: 'limpiabrisas_ok', label: 'Limpiabrisas', icon: '🚿' },
  { key: 'carroceria_ok', label: 'Carrocería', icon: '🚗' },
] as const;

// IndexedDB types para offline
export interface ChecklistDraft {
  servicioId: string;
  custodioPhone: string;
  items: ItemsInspeccion;
  observaciones: string;
  createdAt: string;
  updatedAt: string;
}

export interface PhotoBlob {
  id: string;
  servicioId: string;
  angle: AnguloFoto;
  blob: Blob;
  mimeType: string;
  geotagLat: number | null;
  geotagLng: number | null;
  distanciaOrigen: number | null;
  validacion: ValidacionGeo;
  capturedAt: string;
}

export interface SyncQueueItem {
  id: string;
  action: 'upload_photo' | 'save_checklist' | 'update_document';
  payload: Record<string, any>;
  attempts: number;
  lastAttempt: string | null;
  createdAt: string;
}
```

#### Paso 1.2: Crear utilidades de geolocalizacion
**Archivo**: `src/lib/geoUtils.ts`

```typescript
/**
 * Utilidades de geolocalizacion para validacion de fotos
 * Incluye extraccion EXIF y calculo de distancia Haversine
 */

// Radio de la Tierra en metros
const EARTH_RADIUS_M = 6371000;

// Tolerancia maxima en metros
export const GEO_TOLERANCE_M = 500;

/**
 * Calcula la distancia entre dos puntos usando formula Haversine
 */
export function calcularDistanciaHaversine(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_M * c;
}

/**
 * Convierte coordenadas DMS (grados, minutos, segundos) a decimal
 */
function convertDMSToDecimal(
  dms: [number, number, number],
  ref: string
): number {
  const decimal = dms[0] + dms[1] / 60 + dms[2] / 3600;
  return (ref === 'S' || ref === 'W') ? -decimal : decimal;
}

/**
 * Extrae coordenadas GPS del EXIF de una imagen
 * Retorna null si no hay datos GPS
 */
export async function extractGPSFromImage(file: File): Promise<{
  lat: number;
  lng: number;
  timestamp?: string;
} | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const view = new DataView(e.target?.result as ArrayBuffer);
      
      // Verificar que es JPEG
      if (view.getUint16(0, false) !== 0xFFD8) {
        resolve(null);
        return;
      }
      
      const length = view.byteLength;
      let offset = 2;
      
      while (offset < length) {
        if (view.getUint16(offset, false) === 0xFFE1) {
          // Encontrado APP1 (EXIF)
          const exifData = parseExifSegment(view, offset);
          if (exifData) {
            resolve(exifData);
            return;
          }
        }
        offset += 2 + view.getUint16(offset + 2, false);
      }
      
      resolve(null);
    };
    
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file);
  });
}

// Funcion auxiliar para parsear EXIF (simplificada)
function parseExifSegment(view: DataView, offset: number): {
  lat: number;
  lng: number;
  timestamp?: string;
} | null {
  // Implementacion simplificada - en produccion usar exif-js
  // Por ahora retornamos null y usaremos la API de geolocalizacion del navegador
  return null;
}

/**
 * Obtiene la ubicacion actual del dispositivo
 */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // Cache de 1 minuto
      }
    );
  });
}

/**
 * Valida si una foto esta dentro del rango permitido del origen
 */
export function validarUbicacionFoto(
  fotoLat: number | null,
  fotoLng: number | null,
  origenLat: number,
  origenLng: number,
  toleranciaM: number = GEO_TOLERANCE_M
): { valido: boolean; distancia: number | null; mensaje: string } {
  if (fotoLat === null || fotoLng === null) {
    return {
      valido: true, // No bloqueante
      distancia: null,
      mensaje: 'Sin datos GPS - será auditado'
    };
  }
  
  const distancia = calcularDistanciaHaversine(fotoLat, fotoLng, origenLat, origenLng);
  
  if (distancia <= toleranciaM) {
    return {
      valido: true,
      distancia: Math.round(distancia),
      mensaje: `${Math.round(distancia)}m del origen`
    };
  }
  
  return {
    valido: true, // NO BLOQUEANTE - solo advertencia
    distancia: Math.round(distancia),
    mensaje: `${Math.round(distancia)}m del origen - será auditado`
  };
}
```

#### Paso 1.3: Crear wrapper de IndexedDB
**Archivo**: `src/lib/offlineStorage.ts`

```typescript
/**
 * Wrapper para IndexedDB usando idb library
 * Maneja almacenamiento offline de checklists y fotos
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { ChecklistDraft, PhotoBlob, SyncQueueItem } from '@/types/checklist';

interface ChecklistDB extends DBSchema {
  checklist_drafts: {
    key: string; // servicioId
    value: ChecklistDraft;
    indexes: { 'by-phone': string };
  };
  photo_blobs: {
    key: string; // UUID
    value: PhotoBlob;
    indexes: { 'by-servicio': string };
  };
  sync_queue: {
    key: string; // UUID
    value: SyncQueueItem;
    indexes: { 'by-created': string };
  };
}

const DB_NAME = 'detecta-checklist-offline';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<ChecklistDB> | null = null;

/**
 * Obtiene o crea la instancia de la base de datos
 */
export async function getDB(): Promise<IDBPDatabase<ChecklistDB>> {
  if (dbInstance) return dbInstance;
  
  dbInstance = await openDB<ChecklistDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store para borradores de checklist
      if (!db.objectStoreNames.contains('checklist_drafts')) {
        const draftStore = db.createObjectStore('checklist_drafts', { 
          keyPath: 'servicioId' 
        });
        draftStore.createIndex('by-phone', 'custodioPhone');
      }
      
      // Store para blobs de fotos
      if (!db.objectStoreNames.contains('photo_blobs')) {
        const photoStore = db.createObjectStore('photo_blobs', { 
          keyPath: 'id' 
        });
        photoStore.createIndex('by-servicio', 'servicioId');
      }
      
      // Store para cola de sincronizacion
      if (!db.objectStoreNames.contains('sync_queue')) {
        const syncStore = db.createObjectStore('sync_queue', { 
          keyPath: 'id' 
        });
        syncStore.createIndex('by-created', 'createdAt');
      }
    },
  });
  
  return dbInstance;
}

// ============ CHECKLIST DRAFTS ============

export async function saveDraft(draft: ChecklistDraft): Promise<void> {
  const db = await getDB();
  await db.put('checklist_drafts', {
    ...draft,
    updatedAt: new Date().toISOString()
  });
}

export async function getDraft(servicioId: string): Promise<ChecklistDraft | undefined> {
  const db = await getDB();
  return db.get('checklist_drafts', servicioId);
}

export async function deleteDraft(servicioId: string): Promise<void> {
  const db = await getDB();
  await db.delete('checklist_drafts', servicioId);
}

export async function getAllDrafts(phone: string): Promise<ChecklistDraft[]> {
  const db = await getDB();
  return db.getAllFromIndex('checklist_drafts', 'by-phone', phone);
}

// ============ PHOTO BLOBS ============

export async function savePhotoBlob(photo: PhotoBlob): Promise<void> {
  const db = await getDB();
  await db.put('photo_blobs', photo);
}

export async function getPhotoBlob(id: string): Promise<PhotoBlob | undefined> {
  const db = await getDB();
  return db.get('photo_blobs', id);
}

export async function getPhotosByServicio(servicioId: string): Promise<PhotoBlob[]> {
  const db = await getDB();
  return db.getAllFromIndex('photo_blobs', 'by-servicio', servicioId);
}

export async function deletePhotoBlob(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('photo_blobs', id);
}

// ============ SYNC QUEUE ============

export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'attempts' | 'lastAttempt'>): Promise<string> {
  const db = await getDB();
  const id = crypto.randomUUID();
  await db.put('sync_queue', {
    ...item,
    id,
    attempts: 0,
    lastAttempt: null,
    createdAt: new Date().toISOString()
  });
  return id;
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('sync_queue', 'by-created');
}

export async function updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
  const db = await getDB();
  await db.put('sync_queue', item);
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sync_queue', id);
}

export async function clearSyncQueue(): Promise<void> {
  const db = await getDB();
  await db.clear('sync_queue');
}

// ============ UTILITIES ============

export async function getPendingSyncCount(): Promise<number> {
  const db = await getDB();
  const queue = await db.getAll('sync_queue');
  return queue.length;
}

export async function clearAllOfflineData(): Promise<void> {
  const db = await getDB();
  await db.clear('checklist_drafts');
  await db.clear('photo_blobs');
  await db.clear('sync_queue');
}
```

#### Paso 1.4: Ejecutar migracion SQL
**Archivo**: SQL a ejecutar en Supabase

Se ejecutara el SQL definido en la seccion "Modelo de Datos Completo" para crear:
- Tabla `documentos_custodio`
- Tabla `checklist_servicio`
- Bucket `checklist-evidencias`
- Politicas RLS

---

### FASE 2: Hooks de Datos (Sin UI)
**Objetivo**: Crear los hooks de React Query para gestionar datos, manteniendo la logica separada de la UI.

#### Paso 2.1: Hook de estado de red
**Archivo**: `src/hooks/useNetworkStatus.ts`

```typescript
/**
 * Hook para detectar estado online/offline
 */
import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean; // True si estuvo offline y recupero conexion
  lastOnlineAt: Date | null;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
    lastOnlineAt: null
  });

  const handleOnline = useCallback(() => {
    setStatus(prev => ({
      isOnline: true,
      wasOffline: !prev.isOnline,
      lastOnlineAt: new Date()
    }));
  }, []);

  const handleOffline = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      isOnline: false
    }));
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return status;
}
```

#### Paso 2.2: Hook de sincronizacion offline
**Archivo**: `src/hooks/useOfflineSync.ts`

```typescript
/**
 * Hook para sincronizar datos offline cuando recupera conexion
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNetworkStatus } from './useNetworkStatus';
import { 
  getSyncQueue, 
  removeSyncQueueItem, 
  updateSyncQueueItem,
  getPhotoBlob,
  deletePhotoBlob 
} from '@/lib/offlineStorage';
import type { SyncQueueItem } from '@/types/checklist';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

export function useOfflineSync() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  const syncItem = async (item: SyncQueueItem): Promise<boolean> => {
    try {
      switch (item.action) {
        case 'upload_photo': {
          const photoBlob = await getPhotoBlob(item.payload.photoId);
          if (!photoBlob) return true; // Ya no existe, marcar como sincronizado
          
          const { error } = await supabase.storage
            .from('checklist-evidencias')
            .upload(item.payload.path, photoBlob.blob, {
              contentType: photoBlob.mimeType,
              upsert: true
            });
          
          if (error) throw error;
          
          // Limpiar blob local despues de subir
          await deletePhotoBlob(item.payload.photoId);
          return true;
        }
        
        case 'save_checklist': {
          const { error } = await supabase
            .from('checklist_servicio')
            .upsert(item.payload, { onConflict: 'servicio_id,custodio_telefono' });
          
          if (error) throw error;
          return true;
        }
        
        case 'update_document': {
          const { error } = await supabase
            .from('documentos_custodio')
            .upsert(item.payload, { onConflict: 'custodio_telefono,tipo_documento' });
          
          if (error) throw error;
          return true;
        }
        
        default:
          return true;
      }
    } catch (error) {
      console.error(`[OfflineSync] Error syncing item ${item.id}:`, error);
      return false;
    }
  };

  const syncAll = useCallback(async () => {
    if (!isOnline) return;
    
    setSyncStatus('syncing');
    setLastSyncError(null);
    
    try {
      const queue = await getSyncQueue();
      let syncedCount = 0;
      let failedCount = 0;
      
      for (const item of queue) {
        // Max 3 reintentos
        if (item.attempts >= 3) {
          await removeSyncQueueItem(item.id);
          continue;
        }
        
        const success = await syncItem(item);
        
        if (success) {
          await removeSyncQueueItem(item.id);
          syncedCount++;
        } else {
          await updateSyncQueueItem({
            ...item,
            attempts: item.attempts + 1,
            lastAttempt: new Date().toISOString()
          });
          failedCount++;
        }
      }
      
      setPendingCount(failedCount);
      setSyncStatus(failedCount > 0 ? 'error' : 'success');
      
      if (failedCount > 0) {
        setLastSyncError(`${failedCount} items failed to sync`);
      }
    } catch (error) {
      setSyncStatus('error');
      setLastSyncError(error instanceof Error ? error.message : 'Sync failed');
    }
  }, [isOnline]);

  // Auto-sync cuando recupera conexion
  useEffect(() => {
    if (wasOffline && isOnline) {
      syncAll();
    }
  }, [wasOffline, isOnline, syncAll]);

  // Contar items pendientes al montar
  useEffect(() => {
    getSyncQueue().then(queue => setPendingCount(queue.length));
  }, []);

  return {
    syncStatus,
    pendingCount,
    lastSyncError,
    isOnline,
    syncAll
  };
}
```

#### Paso 2.3: Hook de documentos del custodio
**Archivo**: `src/hooks/useCustodianDocuments.ts`

```typescript
/**
 * Hook para gestionar documentos del custodio con vigencias
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { DocumentoCustodio, TipoDocumentoCustodio } from '@/types/checklist';
import { addToSyncQueue } from '@/lib/offlineStorage';

export function useCustodianDocuments(custodioTelefono: string | undefined) {
  const queryClient = useQueryClient();

  // Query principal
  const query = useQuery({
    queryKey: ['custodian-documents', custodioTelefono],
    queryFn: async () => {
      if (!custodioTelefono) return [];
      
      const { data, error } = await supabase
        .from('documentos_custodio')
        .select('*')
        .eq('custodio_telefono', custodioTelefono)
        .order('tipo_documento');

      if (error) throw error;
      return data as DocumentoCustodio[];
    },
    enabled: !!custodioTelefono,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para actualizar documento
  const updateDocument = useMutation({
    mutationFn: async ({
      tipoDocumento,
      file,
      fechaVigencia,
      numeroDocumento
    }: {
      tipoDocumento: TipoDocumentoCustodio;
      file: File;
      fechaVigencia: string;
      numeroDocumento?: string;
    }) => {
      if (!custodioTelefono) throw new Error('No phone');
      
      // Subir archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${custodioTelefono}/${tipoDocumento}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('checklist-evidencias')
        .upload(`documentos/${fileName}`, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('checklist-evidencias')
        .getPublicUrl(`documentos/${fileName}`);
      
      // Guardar en BD
      const { error: dbError } = await supabase
        .from('documentos_custodio')
        .upsert({
          custodio_telefono: custodioTelefono,
          tipo_documento: tipoDocumento,
          numero_documento: numeroDocumento,
          fecha_vigencia: fechaVigencia,
          foto_url: urlData.publicUrl,
          verificado: false,
          updated_at: new Date().toISOString()
        }, { onConflict: 'custodio_telefono,tipo_documento' });
      
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodian-documents', custodioTelefono] });
      toast.success('Documento actualizado');
    },
    onError: (error) => {
      console.error('Error updating document:', error);
      toast.error('Error al actualizar documento');
    }
  });

  // Helper: documentos vencidos
  const getExpiredDocuments = () => {
    if (!query.data) return [];
    const today = new Date().toISOString().split('T')[0];
    return query.data.filter(doc => doc.fecha_vigencia < today);
  };

  // Helper: documentos por vencer (30 dias)
  const getExpiringDocuments = () => {
    if (!query.data) return [];
    const today = new Date();
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    
    return query.data.filter(doc => 
      doc.fecha_vigencia >= todayStr && 
      doc.fecha_vigencia <= in30Days
    );
  };

  // Helper: verificar si hay documentos vencidos
  const hasExpiredDocuments = () => getExpiredDocuments().length > 0;

  return {
    documents: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    updateDocument,
    getExpiredDocuments,
    getExpiringDocuments,
    hasExpiredDocuments,
    refetch: query.refetch
  };
}
```

#### Paso 2.4: Hook principal del checklist
**Archivo**: `src/hooks/useServiceChecklist.ts`

```typescript
/**
 * Hook principal para gestionar el checklist de servicio
 * Maneja estado local, guardado offline y sincronizacion
 */
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNetworkStatus } from './useNetworkStatus';
import {
  saveDraft,
  getDraft,
  deleteDraft,
  savePhotoBlob,
  getPhotosByServicio,
  addToSyncQueue
} from '@/lib/offlineStorage';
import {
  getCurrentPosition,
  validarUbicacionFoto,
  GEO_TOLERANCE_M
} from '@/lib/geoUtils';
import type {
  ChecklistServicio,
  ItemsInspeccion,
  FotoValidada,
  AnguloFoto,
  ValidacionGeo
} from '@/types/checklist';

const DEFAULT_ITEMS: ItemsInspeccion = {
  vehiculo: {
    llantas_ok: null,
    luces_ok: null,
    frenos_ok: null,
    espejos_ok: null,
    limpiabrisas_ok: null,
    carroceria_ok: null,
    nivel_combustible: null
  },
  equipamiento: {
    gato_hidraulico: null,
    llanta_refaccion: null,
    triangulos: null,
    extintor: null
  }
};

interface UseServiceChecklistOptions {
  servicioId: string;
  custodioTelefono: string;
  origenCoords?: { lat: number; lng: number } | null;
}

export function useServiceChecklist({
  servicioId,
  custodioTelefono,
  origenCoords
}: UseServiceChecklistOptions) {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  
  // Estado local
  const [items, setItems] = useState<ItemsInspeccion>(DEFAULT_ITEMS);
  const [fotos, setFotos] = useState<FotoValidada[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [firma, setFirma] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);

  // Query para checklist existente
  const existingChecklistQuery = useQuery({
    queryKey: ['service-checklist', servicioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_servicio')
        .select('*')
        .eq('servicio_id', servicioId)
        .eq('custodio_telefono', custodioTelefono)
        .maybeSingle();
      
      if (error) throw error;
      return data as ChecklistServicio | null;
    },
    enabled: !!servicioId && !!custodioTelefono && isOnline
  });

  // Cargar borrador offline o datos existentes
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingDraft(true);
      
      // Primero intentar cargar borrador offline
      const draft = await getDraft(servicioId);
      if (draft) {
        setItems(draft.items);
        setObservaciones(draft.observaciones);
        
        // Cargar fotos locales
        const localPhotos = await getPhotosByServicio(servicioId);
        if (localPhotos.length > 0) {
          setFotos(localPhotos.map(p => ({
            angle: p.angle,
            localBlobId: p.id,
            geotag_lat: p.geotagLat,
            geotag_lng: p.geotagLng,
            distancia_origen_m: p.distanciaOrigen,
            validacion: p.validacion,
            captured_at: p.capturedAt,
            capturado_offline: true
          })));
        }
        
        setIsLoadingDraft(false);
        return;
      }
      
      // Si hay datos en servidor, usarlos
      if (existingChecklistQuery.data) {
        setItems(existingChecklistQuery.data.items_inspeccion);
        setFotos(existingChecklistQuery.data.fotos_validadas);
        setObservaciones(existingChecklistQuery.data.observaciones || '');
        setFirma(existingChecklistQuery.data.firma_base64 || null);
      }
      
      setIsLoadingDraft(false);
    };
    
    loadInitialData();
  }, [servicioId, existingChecklistQuery.data]);

  // Auto-guardado de borrador cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      saveDraft({
        servicioId,
        custodioPhone: custodioTelefono,
        items,
        observaciones,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }, 30000);
    
    return () => clearInterval(interval);
  }, [servicioId, custodioTelefono, items, observaciones]);

  // Actualizar item de inspeccion
  const updateItem = useCallback((
    categoria: 'vehiculo' | 'equipamiento',
    key: string,
    value: boolean | string | null
  ) => {
    setItems(prev => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        [key]: value
      }
    }));
  }, []);

  // Capturar foto con validacion GPS
  const capturePhoto = useCallback(async (
    angle: AnguloFoto,
    file: File
  ): Promise<FotoValidada> => {
    // Obtener ubicacion actual
    let currentLat: number | null = null;
    let currentLng: number | null = null;
    
    try {
      const position = await getCurrentPosition();
      currentLat = position.coords.latitude;
      currentLng = position.coords.longitude;
    } catch (e) {
      console.warn('[Checklist] Could not get GPS:', e);
    }
    
    // Calcular distancia al origen si hay coordenadas
    let distancia: number | null = null;
    let validacion: ValidacionGeo = 'pendiente';
    
    if (currentLat && currentLng && origenCoords) {
      const result = validarUbicacionFoto(
        currentLat,
        currentLng,
        origenCoords.lat,
        origenCoords.lng
      );
      distancia = result.distancia;
      validacion = result.distancia === null 
        ? 'sin_gps' 
        : (result.distancia <= GEO_TOLERANCE_M ? 'ok' : 'fuera_rango');
    } else if (!currentLat || !currentLng) {
      validacion = 'sin_gps';
    }
    
    // Crear objeto de foto
    const photoId = crypto.randomUUID();
    const newFoto: FotoValidada = {
      angle,
      localBlobId: photoId,
      geotag_lat: currentLat,
      geotag_lng: currentLng,
      distancia_origen_m: distancia,
      validacion,
      captured_at: new Date().toISOString(),
      capturado_offline: !isOnline
    };
    
    // Guardar blob en IndexedDB
    await savePhotoBlob({
      id: photoId,
      servicioId,
      angle,
      blob: file,
      mimeType: file.type,
      geotagLat: currentLat,
      geotagLng: currentLng,
      distanciaOrigen: distancia,
      validacion,
      capturedAt: newFoto.captured_at
    });
    
    // Actualizar estado
    setFotos(prev => {
      const filtered = prev.filter(f => f.angle !== angle);
      return [...filtered, newFoto];
    });
    
    return newFoto;
  }, [servicioId, origenCoords, isOnline]);

  // Eliminar foto
  const removePhoto = useCallback((angle: AnguloFoto) => {
    setFotos(prev => prev.filter(f => f.angle !== angle));
  }, []);

  // Guardar checklist completo
  const saveChecklist = useMutation({
    mutationFn: async () => {
      setIsSaving(true);
      
      const now = new Date().toISOString();
      let ubicacion: { lat: number; lng: number } | null = null;
      
      try {
        const pos = await getCurrentPosition();
        ubicacion = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch (e) {
        console.warn('[Checklist] Could not get location for save');
      }
      
      // Preparar datos del checklist
      const checklistData: Partial<ChecklistServicio> = {
        servicio_id: servicioId,
        custodio_telefono: custodioTelefono,
        estado: 'completo',
        items_inspeccion: items,
        fotos_validadas: fotos,
        observaciones,
        firma_base64: firma,
        ubicacion_lat: ubicacion?.lat,
        ubicacion_lng: ubicacion?.lng,
        fecha_captura_local: now,
        sincronizado_offline: !isOnline
      };
      
      if (isOnline) {
        // Subir fotos primero
        const fotosConUrl: FotoValidada[] = [];
        
        for (const foto of fotos) {
          if (foto.localBlobId) {
            const localPhotos = await getPhotosByServicio(servicioId);
            const localPhoto = localPhotos.find(p => p.id === foto.localBlobId);
            
            if (localPhoto) {
              const fileName = `${servicioId}/${foto.angle}_${Date.now()}.jpg`;
              
              const { error } = await supabase.storage
                .from('checklist-evidencias')
                .upload(fileName, localPhoto.blob, { upsert: true });
              
              if (error) throw error;
              
              const { data: urlData } = supabase.storage
                .from('checklist-evidencias')
                .getPublicUrl(fileName);
              
              fotosConUrl.push({
                ...foto,
                url: urlData.publicUrl,
                localBlobId: undefined
              });
            }
          } else {
            fotosConUrl.push(foto);
          }
        }
        
        checklistData.fotos_validadas = fotosConUrl;
        checklistData.fecha_sincronizacion = now;
        checklistData.sincronizado_offline = false;
        
        // Guardar en BD
        const { error } = await supabase
          .from('checklist_servicio')
          .upsert(checklistData, { 
            onConflict: 'servicio_id,custodio_telefono' 
          });
        
        if (error) throw error;
        
        // Limpiar borrador local
        await deleteDraft(servicioId);
      } else {
        // Modo offline: guardar en cola de sync
        await addToSyncQueue({
          action: 'save_checklist',
          payload: checklistData
        });
        
        // Guardar borrador actualizado
        await saveDraft({
          servicioId,
          custodioPhone: custodioTelefono,
          items,
          observaciones,
          createdAt: now,
          updatedAt: now
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-checklist', servicioId] });
      toast.success(
        isOnline 
          ? 'Checklist guardado correctamente' 
          : 'Checklist guardado localmente - Se sincronizará cuando tengas conexión'
      );
      setIsSaving(false);
    },
    onError: (error) => {
      console.error('[Checklist] Save error:', error);
      toast.error('Error al guardar checklist');
      setIsSaving(false);
    }
  });

  // Verificar si el checklist esta completo
  const isComplete = useCallback(() => {
    // Todos los items de vehiculo deben estar marcados
    const vehiculoComplete = Object.values(items.vehiculo).every(v => v !== null);
    
    // 4 fotos requeridas
    const fotosComplete = fotos.length === 4;
    
    // Firma requerida
    const firmaComplete = !!firma;
    
    return vehiculoComplete && fotosComplete && firmaComplete;
  }, [items, fotos, firma]);

  // Obtener alertas de GPS para UI
  const getGeoAlerts = useCallback(() => {
    return fotos.filter(f => 
      f.validacion === 'sin_gps' || f.validacion === 'fuera_rango'
    );
  }, [fotos]);

  return {
    // Estado
    items,
    fotos,
    observaciones,
    firma,
    isLoading: isLoadingDraft || existingChecklistQuery.isLoading,
    isSaving,
    isOnline,
    existingChecklist: existingChecklistQuery.data,
    
    // Acciones
    updateItem,
    setObservaciones,
    setFirma,
    capturePhoto,
    removePhoto,
    saveChecklist: saveChecklist.mutate,
    
    // Helpers
    isComplete,
    getGeoAlerts
  };
}
```

---

### FASE 3: Componentes UI Atomicos
**Objetivo**: Crear los componentes visuales mas pequeños y reutilizables.

#### Paso 3.1: Indicador de estado de red
**Archivo**: `src/components/custodian/checklist/OfflineIndicator.tsx`

Badge que muestra si el custodio esta online/offline.

#### Paso 3.2: Banner de sincronizacion
**Archivo**: `src/components/custodian/checklist/SyncStatusBanner.tsx`

Banner que muestra estado de sincronizacion y permite forzar sync manual.

#### Paso 3.3: Barra de progreso del wizard
**Archivo**: `src/components/custodian/checklist/ChecklistProgressBar.tsx`

Indicador visual de pasos completados (1-4).

#### Paso 3.4: Card de documento
**Archivo**: `src/components/custodian/checklist/DocumentCard.tsx`

Card que muestra documento con vigencia y estado.

#### Paso 3.5: Badge de vigencia
**Archivo**: `src/components/custodian/checklist/DocumentExpiryBadge.tsx`

Badge coloreado segun dias restantes de vigencia.

#### Paso 3.6: Checkbox de inspeccion
**Archivo**: `src/components/custodian/checklist/InspectionCheckbox.tsx`

Checkbox grande tactil para items de vehiculo.

#### Paso 3.7: Selector de combustible
**Archivo**: `src/components/custodian/checklist/FuelGauge.tsx`

Selector visual estilo gauge para nivel de combustible.

#### Paso 3.8: Slot de foto
**Archivo**: `src/components/custodian/checklist/PhotoSlot.tsx`

Contenedor para cada angulo de foto con estado visual.

#### Paso 3.9: Badge de validacion GPS
**Archivo**: `src/components/custodian/checklist/GeoValidationBadge.tsx`

Badge que muestra distancia y estado de validacion GPS.

#### Paso 3.10: Captura segura de camara
**Archivo**: `src/components/custodian/checklist/SecureCameraCapture.tsx`

Input de camara que bloquea galeria y solo permite captura en vivo.

#### Paso 3.11: Pad de firma digital
**Archivo**: `src/components/custodian/checklist/SignaturePad.tsx`

Canvas tactil para capturar firma del custodio.

#### Paso 3.12: Resumen del checklist
**Archivo**: `src/components/custodian/checklist/ChecklistSummary.tsx`

Vista resumen con conteo de items y alertas.

---

### FASE 4: Pasos del Wizard
**Objetivo**: Crear los 4 pasos principales del wizard de checklist.

#### Paso 4.1: Paso de documentos
**Archivo**: `src/components/custodian/checklist/StepDocuments.tsx`

Lista documentos del custodio, resalta vencidos, permite actualizar.

#### Paso 4.2: Paso de inspeccion vehicular
**Archivo**: `src/components/custodian/checklist/StepVehicleInspection.tsx`

Grid de checkboxes para items del vehiculo + selector de combustible.

#### Paso 4.3: Paso de fotos
**Archivo**: `src/components/custodian/checklist/StepVehiclePhotos.tsx`

4 slots de foto (frontal, trasero, laterales) con validacion GPS.

#### Paso 4.4: Paso de confirmacion
**Archivo**: `src/components/custodian/checklist/StepConfirmation.tsx`

Resumen, campo de observaciones, pad de firma, boton confirmar.

---

### FASE 5: Wizard Contenedor
**Objetivo**: Crear el componente principal que orquesta los pasos.

#### Paso 5.1: Wizard principal
**Archivo**: `src/components/custodian/checklist/ChecklistWizard.tsx`

Maneja navegacion entre pasos, validacion por paso, guardado.

---

### FASE 6: Pagina e Integracion
**Objetivo**: Crear la pagina y conectarla al router.

#### Paso 6.1: Pagina del checklist
**Archivo**: `src/pages/custodian/ServiceChecklistPage.tsx`

Pagina que recibe servicioId y renderiza el wizard.

#### Paso 6.2: Actualizar App.tsx
Agregar ruta `/custodian/checklist/:serviceId`.

#### Paso 6.3: Modificar NextServiceCard
Agregar boton "Iniciar Checklist" que navega a la nueva pagina.

#### Paso 6.4: Modificar MobileDashboardLayout
Mostrar indicador si hay checklist pendiente para servicio proximo.

---

### FASE 7: Vista de Monitoreo
**Objetivo**: Permitir al equipo de monitoreo ver el checklist completado.

#### Paso 7.1: Seccion de auditoria
**Archivo**: `src/components/monitoring/ChecklistAuditSection.tsx`

Componente que muestra galeria de fotos, alertas GPS, estado de documentos.

#### Paso 7.2: Integrar en ServiceDetailModal
Agregar seccion de checklist al modal existente.

---

## Dependencias a Instalar

```bash
npm install idb exif-js
```

- **idb** (v8.0.0): Wrapper moderno de IndexedDB con Promises - 3KB gzipped
- **exif-js** (v2.3.0): Extraccion de metadatos GPS de imagenes - 8KB gzipped

---

## Consideraciones de Testing

### Tests Unitarios Recomendados
1. `geoUtils.ts`: Funcion Haversine con casos limite
2. `offlineStorage.ts`: Operaciones CRUD en IndexedDB
3. `useServiceChecklist.ts`: Estados y transiciones

### Tests E2E Recomendados
1. Flujo completo online
2. Flujo completo offline con sincronizacion
3. Validacion de fotos fuera de rango (debe continuar, no bloquear)
4. Actualizacion de documento vencido

---

## Metricas de Exito

| Metrica | Objetivo |
|---------|----------|
| Tiempo para completar checklist | < 3 minutos |
| Tasa de abandono | < 10% |
| Sincronizacion exitosa offline | > 99% |
| Fotos con GPS valido | > 80% |
| Errores de usuario | < 5% |

---

## Riesgos y Mitigaciones

| Riesgo | Mitigacion |
|--------|------------|
| GPS no disponible | Permitir continuar, marcar para auditoria |
| Camara no disponible | Mensaje claro de error, no bloquear UI |
| IndexedDB lleno | Limpiar datos antiguos automaticamente |
| Sincronizacion fallida | Reintentos con backoff exponencial |
| Fotos muy grandes | Comprimir antes de guardar (max 2MB) |

---

## Estimacion de Tiempo por Fase

| Fase | Descripcion | Tiempo Estimado |
|------|-------------|-----------------|
| 1 | Infraestructura Base | 2 horas |
| 2 | Hooks de Datos | 3 horas |
| 3 | Componentes Atomicos | 4 horas |
| 4 | Pasos del Wizard | 3 horas |
| 5 | Wizard Contenedor | 1 hora |
| 6 | Pagina e Integracion | 1.5 horas |
| 7 | Vista de Monitoreo | 1.5 horas |
| **Total** | | **~16 horas** |

