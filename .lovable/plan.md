
# Plan: Optimizar Vista de Custodios en Configuración

## Cambios Solicitados

| Elemento | Acción |
|----------|--------|
| Mapa "Distribución por Zona" | Aumentar tamaño |
| Sección "Gestión de Zonas Base" | Eliminar de esta vista |

## Ubicación del Código

**Archivo:** `src/pages/Planeacion/components/configuration/CustodiosZonasTab.tsx`

```text
Línea 338:  <CustodianZoneBubbleMap estadisticasZona={estadisticasZona} />
Líneas 341-547: <Card> Gestión de Zonas Base... </Card>
```

## Implementación

### 1. Eliminar "Gestión de Zonas Base"

Remover completamente el Card que contiene:
- CardHeader con título y botón Actualizar
- Filtros de búsqueda y actividad
- Lista de custodios con selectores de zona/preferencia

### 2. Agrandar el Mapa

Modificar `CustodianZoneBubbleMap.tsx` para aumentar la altura del contenedor del mapa:

```tsx
// Antes
<div className="h-[300px] ...">

// Después  
<div className="h-[500px] ...">
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `CustodiosZonasTab.tsx` | Eliminar Card de Gestión de Zonas Base (líneas 341-547) |
| `CustodianZoneBubbleMap.tsx` | Aumentar altura del mapa de 300px a 500px |

## Resultado Visual Esperado

```text
┌─────────────────────────────────────────────────────────────────┐
│ Configuración de Planeación                                     │
├─────────────────────────────────────────────────────────────────┤
│ [Custodios] [Armados] [Proveedores] [Esquemas] [Sanciones] ...  │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│ │ 100      │ │ 0        │ │ 9        │ │ 100%     │            │
│ │ Activos  │ │ Sin Zona │ │ Zonas    │ │ Completit│            │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │                    MAPA DE DISTRIBUCIÓN                     │ │
│ │                       (más grande)                          │ │
│ │                        ~500px altura                        │ │
│ │                                                             │ │
│ │      ● CDMX (45)    ● MTY (12)    ● GDL (18)              │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│        (Sin sección de Gestión de Zonas Base)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Nota

La funcionalidad de gestionar zonas base seguirá disponible en el módulo de **Perfiles Operativos** (`/perfiles-operativos`), donde existe una interfaz similar para editar custodios individualmente.
