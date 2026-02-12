

## Sistema de Rating Operativo - Pestana Calificaciones

### Concepto

Un sistema de rating compuesto (1-5 estrellas) que evalua al custodio en 5 dimensiones operativas. El rating se calcula automaticamente a partir de datos existentes, pero la arquitectura esta disenada para que en el futuro los clientes puedan agregar su propia dimension de calificacion.

### Modelo de Rating (5 dimensiones)

| Dimension | Peso | Fuente de datos | Logica |
|---|---|---|---|
| **Performance** | 25% | `useProfilePerformance.scoreGlobal` | Score global existente (puntualidad + confiabilidad + checklist + docs + volumen) mapeado a 1-5 estrellas |
| **Disponibilidad** | 20% | `custodios_operativos.disponibilidad` + dias sin actividad | Disponible + activo reciente = 5, suspendido/inactivo >30d = 1 |
| **Revenue** | 20% | `servicios_custodia.costo_custodio` | Ingresos generados en 90 dias, normalizado vs percentiles de la flota |
| **Versatilidad** | 15% | `servicios_locales_15d` + `servicios_foraneos_15d` + `preferencia_tipo_servicio` | Mix local/foraneo equilibrado = 5 estrellas. Solo un tipo = 3. Preferencia "indistinto" = bonus |
| **Calificacion Cliente** | 20% | Placeholder (futuro) | Columna reservada. Por ahora muestra "Sin datos" con badge "Proximamente" |

**Escala**: Cada dimension produce un score 0-100 que se mapea a estrellas (0-20=1, 21-40=2, 41-60=3, 61-80=4, 81-100=5).

**Rating General**: Promedio ponderado de las 5 dimensiones = valor que se persiste en `custodios_operativos.rating_promedio`.

### Cambios tecnicos

**1. Nuevo hook: `src/pages/PerfilesOperativos/hooks/useOperativeRating.ts`**

Recibe `custodioId`, `nombre`, `telefono` y calcula las 5 dimensiones:

- **Performance**: Reutiliza `useProfilePerformance` y extrae `scoreGlobal`
- **Disponibilidad**: Query a `custodios_operativos` (disponibilidad, estado, fecha_ultimo_servicio)
- **Revenue**: Query a `servicios_custodia` de los ultimos 90 dias con `costo_custodio`, calcula total y lo compara contra el P50 y P90 de la flota (query adicional de percentiles)
- **Versatilidad**: Lee `servicios_locales_15d`, `servicios_foraneos_15d`, `preferencia_tipo_servicio` de `custodios_operativos`. Formula: ratio = min(local, foraneo) / max(local, foraneo). Ratio 1.0 = 100, ratio 0 = 40. Bonus +10 si preferencia = "indistinto"
- **Cliente**: Retorna null (futuro)

Calcula el rating compuesto y opcionalmente actualiza `rating_promedio` en la tabla.

**2. Nuevo componente: `src/pages/PerfilesOperativos/components/tabs/CalificacionesTab.tsx`**

Estructura visual:

```text
+------------------------------------------+
|  RATING GENERAL    ★★★★☆  4.2 / 5.0     |
|  "Operativo Destacado"                    |
+------------------------------------------+

+----------+ +----------+ +----------+
| Perf 4.5 | | Disp 4.0 | | Rev 3.8  |
| ★★★★★   | | ★★★★☆   | | ★★★★☆   |
| 25%      | | 20%      | | 20%      |
+----------+ +----------+ +----------+
+----------+ +----------+
| Vers 3.5 | | Cliente  |
| ★★★★☆   | | Prox.    |
| 15%      | | 20%      |
+----------+ +----------+

+------------------------------------------+
| Desglose detallado por dimension         |
| - Performance: tabla con sub-scores      |
| - Revenue: ingresos 90d vs flota         |
| - Versatilidad: mix local/foraneo visual |
+------------------------------------------+

+------------------------------------------+
| Historico de rating (futuro placeholder) |
+------------------------------------------+
```

Componentes internos:
- `RatingOverviewCard`: Rating general grande con estrellas y etiqueta textual (Excelente/Destacado/Estandar/En desarrollo/Critico)
- `DimensionCard`: Card por cada dimension con estrellas, score numerico, peso, y detalle
- `RevenueComparison`: Barra de posicion del custodio vs P25/P50/P75/P90 de la flota
- `VersatilidadChart`: Mini donut mostrando mix local vs foraneo
- Seccion "Calificacion del Cliente" con badge "Proximamente" y texto explicativo de la futura integracion

**3. Modificar `src/pages/PerfilesOperativos/PerfilForense.tsx`**

- Importar `CalificacionesTab`
- Reemplazar `PlaceholderTab` por:
```typescript
<CalificacionesTab
  custodioId={id!}
  nombre={profile.nombre}
  telefono={profile.telefono || null}
  profile={custodioProfile || undefined}
/>
```

### Etiquetas de rating

| Rango | Etiqueta | Color |
|---|---|---|
| 4.5 - 5.0 | Excelente | Verde |
| 3.5 - 4.4 | Destacado | Azul |
| 2.5 - 3.4 | Estandar | Amarillo |
| 1.5 - 2.4 | En desarrollo | Naranja |
| 1.0 - 1.4 | Critico | Rojo |

### Preparacion para calificacion de clientes (futuro)

La dimension "Calificacion Cliente" aparecera con un diseno distinto (borde punteado, icono de candado) indicando que es una dimension pendiente. El texto explicara: "Esta dimension se activara cuando los clientes puedan calificar el servicio desde su portal". Mientras tanto, el rating general se calcula solo con las 4 dimensiones activas (los pesos se redistribuyen: Performance 30%, Disponibilidad 25%, Revenue 25%, Versatilidad 20%).

### Archivos afectados

| Archivo | Accion |
|---|---|
| `src/pages/PerfilesOperativos/hooks/useOperativeRating.ts` | Crear |
| `src/pages/PerfilesOperativos/components/tabs/CalificacionesTab.tsx` | Crear |
| `src/pages/PerfilesOperativos/PerfilForense.tsx` | Modificar - integrar CalificacionesTab |

Sin migraciones de base de datos. Se reutiliza la columna `rating_promedio` existente en `custodios_operativos`.
