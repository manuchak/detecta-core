
# Análisis de Gestión de Nombres de Clientes (Comercial vs Fiscal)

## Diagnóstico del Problema

### 1. Estructura Actual de Datos

La tabla `pc_clientes` tiene dos campos para nombres:

| Campo | Tipo | Propósito | Estado Actual |
|-------|------|-----------|---------------|
| `nombre` | text NOT NULL | Nombre comercial (día a día) | Poblado en todos los clientes |
| `razon_social` | text NULL | Nombre fiscal (facturación) | **NULL en el 100% de los clientes** |

### 2. Tablas Relacionadas SIN Foreign Keys

```text
┌─────────────────────────────────────────────────────────────────────┐
│                          pc_clientes                                 │
│  ┌──────────────────────┬────────────────────────────────────────┐  │
│  │ id (uuid, PK)        │ nombre | razon_social | rfc | ...       │  │
│  └──────────────────────┴────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
         ▲                          ▲                      ▲
         │                          │                      │
         │ NO HAY FK                │ NO HAY FK            │ NO HAY FK
         │                          │                      │
┌────────┴───────┐       ┌──────────┴──────────┐    ┌──────┴─────────┐
│servicios_custodia│     │servicios_planificados│   │matriz_precios   │
│                │        │                     │    │     _rutas      │
│nombre_cliente  │        │nombre_cliente       │    │cliente_nombre   │
│(texto libre)   │        │(texto libre)        │    │(texto libre)    │
└────────────────┘        └─────────────────────┘    └────────────────┘
```

**Problema crítico**: Las relaciones se basan en **coincidencia de texto**, no en IDs.

### 3. Inconsistencia de Datos Detectada

Ejemplo de nombres en diferentes tablas:

| Tabla | Ejemplo de nombre |
|-------|-------------------|
| pc_clientes | "AIRMAR" |
| servicios_custodia | "AIRMAR LOGISTICS SA" |
| matriz_precios_rutas | "AIRMAR LOGISTIKS" |

**Consecuencia**: Cambiar el nombre comercial en `pc_clientes` **rompe la vinculación** con:
- Historial de servicios
- Tarifario de rutas
- Servicios planificados

### 4. Interfaces de Edición Actuales

| Módulo | Componente | Campos Editables | Problema |
|--------|------------|------------------|----------|
| Planeación | `ClienteDialog.tsx` | `nombre`, RFC, contacto, SLA | NO tiene razon_social |
| Facturación | `ClienteFormModal.tsx` | `razon_social`, RFC, régimen, crédito | NO permite editar `nombre` |

**El coordinador de operaciones NO puede cambiar el nombre comercial** desde Facturación porque el campo no está en el formulario.

---

## Riesgos de Modificación Directa

### Si cambiamos el nombre en `pc_clientes`:

1. **matriz_precios_rutas**: Las tarifas quedan huérfanas (buscan por `cliente_nombre` texto)
2. **servicios_custodia**: El historial se desvincula
3. **servicios_planificados**: Servicios pendientes pierden referencia
4. **Reportes de facturación**: Agrupaciones incorrectas
5. **CRM Hub**: El Client Matcher deja de funcionar

---

## Solución Propuesta (3 Fases)

### Fase 1: Habilitar Edición de Nombre Comercial (Bajo Riesgo)

**Objetivo**: Permitir al coordinador_operaciones editar el nombre comercial con confirmación.

**Cambios**:

1. Agregar campo `nombre` al formulario `ClienteFormModal.tsx`:
   - Con warning visual de impacto
   - Solo para roles autorizados

2. Crear constante `NOMBRE_COMERCIAL_EDIT_ROLES` en `accessControl.ts`:
```typescript
export const NOMBRE_COMERCIAL_EDIT_ROLES = [
  'admin',
  'owner', 
  'coordinador_operaciones'
] as const;
```

3. Agregar confirmación antes de guardar cambio de nombre:
   - Mostrar cuántas rutas/servicios tienen ese nombre
   - Preguntar si desea propagar el cambio

### Fase 2: Sistema de Alias/Nombres Alternativos (Riesgo Medio)

**Objetivo**: Permitir múltiples nombres para el mismo cliente sin romper historiales.

**Cambios en base de datos**:

```sql
-- Nueva tabla para nombres alternativos
CREATE TABLE pc_clientes_alias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES pc_clientes(id) NOT NULL,
  alias text NOT NULL,
  tipo text DEFAULT 'comercial', -- 'comercial', 'fiscal', 'historico'
  es_principal boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(alias)
);

-- Trigger para mantener nombre principal sincronizado
```

**Beneficios**:
- Un cliente puede tener: "AIRMAR", "AIRMAR LOGISTICS", "AIRMAR SA"
- La búsqueda encuentra cualquier variante
- El historial se preserva

### Fase 3: Migración a Foreign Keys (Alto Impacto - Largo Plazo)

**Objetivo**: Normalizar relaciones con IDs en lugar de texto.

**Pasos**:

1. Agregar columna `cliente_id` a tablas relacionadas
2. Script de migración para vincular registros existentes
3. Actualizar queries para usar JOIN en lugar de texto
4. Marcar columnas de texto como deprecated
5. Eventualmente eliminar columnas de texto

---

## Recomendación Inmediata

Para la solicitud actual del coordinador de operaciones, recomiendo **Fase 1** únicamente:

### Cambios Requeridos:

| Archivo | Cambio |
|---------|--------|
| `src/constants/accessControl.ts` | Agregar `NOMBRE_COMERCIAL_EDIT_ROLES` |
| `src/pages/Facturacion/hooks/useClientesFiscales.ts` | Agregar `nombre` a `ClienteFiscalUpdate` |
| `src/pages/Facturacion/components/GestionClientes/ClienteFormModal.tsx` | Agregar campo editable para `nombre` con warning |

### Validaciones de Seguridad:

1. **Solo roles autorizados** pueden ver/editar el campo nombre
2. **Confirmación obligatoria** si el nombre tiene servicios/rutas asociadas
3. **Audit log** del cambio (quién, cuándo, valor anterior/nuevo)
4. **NO propagar automáticamente** el cambio a otras tablas (evita corrupción masiva)

---

## Próximos Pasos Sugeridos

1. **Aprobar este análisis** para implementar Fase 1
2. **Documentar** los casos donde nombre != razon_social
3. **Planificar** migración de datos para poblar `razon_social` en clientes existentes
4. **Evaluar** si Fase 2 (alias) es necesaria según volumen de inconsistencias

---

## Resumen Técnico

| Aspecto | Estado Actual | Propuesta Fase 1 |
|---------|---------------|------------------|
| Edición nombre comercial | Solo desde Planeación | También desde Facturación |
| Control de roles | Sin restricción | Solo admin/owner/coord_ops |
| Validación de impacto | Ninguna | Mostrar rutas/servicios afectados |
| Propagación de cambios | N/A | Manual (usuario decide) |
| Compatibilidad hacia atrás | N/A | 100% - no rompe nada existente |
