

# Plan: Limpieza Masiva de Custodios por Inactividad

## Alcance de la Operación

| Categoría | Cantidad |
|-----------|----------|
| Custodios activos totales | 415 |
| Sin servicio registrado (nunca trabajaron) | 64 |
| Más de 120 días sin actividad | 274 |
| **Total a dar de baja** | **338** |

## Solución Propuesta

Crear un nuevo componente de limpieza de custodios inactivos dentro del módulo de Administración, con previsualización antes de ejecutar y registro completo de auditoría.

### Estructura de Archivos

```text
src/components/administration/
└── InactivityCleanupManager.tsx   (NUEVO)
```

### Integración

Agregar nueva pestaña en `AdministrationHub.tsx`:
- Tab: "Custodios Inactivos"
- Icono: UserX

## Flujo de Usuario

```text
┌─────────────────────────────────────────────────┐
│  Limpieza de Custodios por Inactividad          │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │   338   │  │   64    │  │   274   │         │
│  │  Total  │  │Sin serv.│  │ >120d   │         │
│  └─────────┘  └─────────┘  └─────────┘         │
│                                                 │
│  Criterio: [120 días ▼]  [Buscar]              │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ ☑ FELIX LOPEZ GOMEZ     | Sin servicios │   │
│  │ ☑ JOSÉ FERNANDO ZÚÑIGA  | Sin servicios │   │
│  │ ☑ MARCOS RAMIREZ        | 145 días      │   │
│  │ ☑ ...                                   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ☑ Seleccionar todos (338)                     │
│                                                 │
│  [Dar de baja seleccionados (338)]             │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Detalles Técnicos

### 1. Consulta de Custodios Inactivos

```sql
SELECT id, nombre, telefono, zona_base, 
       fecha_ultimo_servicio,
       EXTRACT(DAY FROM NOW() - fecha_ultimo_servicio) as dias_sin_actividad
FROM custodios_operativos 
WHERE estado = 'activo'
AND (fecha_ultimo_servicio IS NULL 
     OR fecha_ultimo_servicio < NOW() - INTERVAL '120 days')
ORDER BY fecha_ultimo_servicio ASC NULLS FIRST
```

### 2. Operación de Baja Masiva

Para cada custodio seleccionado:

**Actualizar `custodios_operativos`:**
```typescript
{
  estado: 'inactivo',
  fecha_inactivacion: new Date().toISOString().split('T')[0],
  motivo_inactivacion: 'Dado de baja por inactividad',
  tipo_inactivacion: 'permanente',
  fecha_reactivacion_programada: null,
  updated_at: new Date().toISOString()
}
```

**Insertar en `operativo_estatus_historial`:**
```typescript
{
  operativo_id: custodio.id,
  operativo_tipo: 'custodio',
  estatus_anterior: 'activo',
  estatus_nuevo: 'inactivo',
  tipo_cambio: 'permanente',
  motivo: 'Dado de baja por inactividad',
  notas: `Baja automática: ${dias} días sin actividad`,
  creado_por: user.id
}
```

### 3. Procesamiento en Lotes

- Procesar en grupos de 50 para evitar timeouts
- Mostrar barra de progreso
- Permitir cancelar operación
- Resumen final de resultados

### 4. Componente InactivityCleanupManager

**Características:**
- Selector de días de inactividad (60, 90, 120, 150, 180)
- Tabla con checkboxes para selección individual/masiva
- Preview de custodios afectados antes de ejecutar
- Confirmación con diálogo antes de ejecutar
- Barra de progreso durante ejecución
- Toast con resumen al finalizar

## Modificaciones Requeridas

| Archivo | Cambio |
|---------|--------|
| `src/components/administration/InactivityCleanupManager.tsx` | **CREAR** - Componente principal |
| `src/pages/Administration/AdministrationHub.tsx` | Agregar nueva pestaña "Custodios Inactivos" |

## Seguridad y Auditoría

- Solo usuarios autenticados pueden ejecutar
- Cada baja queda registrada en historial
- Se invalidan queries de custodios tras operación
- No se eliminan registros, solo se cambia estado

## Resultado Esperado

1. Previsualización clara de los 338 custodios afectados
2. Opción de seleccionar todos o individualmente
3. Confirmación antes de ejecutar
4. Barra de progreso durante la operación
5. Todos los custodios dados de baja con:
   - Estado: `inactivo`
   - Motivo: "Dado de baja por inactividad"
   - Tipo: `permanente`
   - Registro en historial para cada uno

