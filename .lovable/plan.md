

# Optimizar Vista Clientes para Movil (390px)

## Diagnostico

El tab "Clientes" renderiza `ClientAnalytics` (914 lineas) + `AcquisitionOverview` + `DailyLeadsCallsChart`. En 390px hay problemas graves:

1. **Header verbose**: Titulo largo + 2 botones (PDF, Actualizar) ocupan mucho espacio
2. **Periodo de Analisis**: Card completa con header icon + titulo para un solo Select
3. **4 Metric Cards**: Ya 2-col pero con padding generoso y Badges innecesarios
4. **Rutas + KM**: 2 cards grandes apiladas verticalmente (~300px de scroll)
5. **Filtros**: Card con 4 selects apilados verticalmente (~250px)
6. **Tabla de 9 columnas**: Completamente ilegible en 390px, scroll horizontal obligatorio
7. **AcquisitionOverview + DailyLeadsCallsChart**: Mas cards verbosas debajo

## Cambios propuestos

### `src/components/executive/ClientAnalytics.tsx`

**En movil (`isMobile`):**

1. **Header compacto**: Eliminar subtitulo, reducir titulo a "Performance Clientes", botones como iconos small
2. **Periodo inline**: Eliminar la Card wrapper, mostrar solo el Select con label inline en una fila
3. **Metric Cards compactas**: Reducir padding (p-3), ocultar Badge de servicios/GMV secundario, reducir `text-2xl` a `text-xl`
4. **Rutas + KM**: Fusionar en una sola fila de 3 pills (Foraneos | Locales | KM prom) similar a las pills de Ops
5. **Filtros compactos**: Eliminar Card wrapper, solo mostrar buscador + 1 select de ordenamiento (ocultar tipo servicio y CSM en movil, o colapsar en un boton "Filtros")
6. **Tabla → Lista de cards**: Reemplazar la tabla de 9 columnas por una lista de cards compactas tipo:
   ```text
   ┌─────────────────────────────┐
   │ #1 ASTRA ZENECA        ⭐  │
   │ 516 svs │ $3.7M │ AOV $7.2K│
   │ ✅ 94% cumpl  │ 2d inactivo│
   └─────────────────────────────┘
   ```
   Cada card clickeable para ver detalle. Limitar a top 15 con "Ver mas".

7. **Vista detalle de cliente** (cuando `selectedClient`): Misma optimizacion 2-col compacta, ocultar card "Actividad Temporal" verbosa y mostrar datos inline

### `src/pages/Dashboard/KPIDashboard.tsx`

**Tab "client" en movil**: Eliminar el separador "Adquisicion" + AcquisitionOverview + DailyLeadsCallsChart del tab movil. Esa data es secundaria para el equipo directivo y agrega ~400px de scroll. Si se necesita, puede ir en un sub-tab propio.

## Resultado esperado (390px)

```text
┌─────────────────────────────┐
│ Performance Clientes  📄 🔄 │
│ [Ultimos 120 dias ▼]        │
├─────────────────────────────┤
│ Mejor AOV  │ Mas Servicios  │
│ $31,519    │ 516            │
│ PROCESOS.. │ ASTRA ZENECA   │
├────────────┼────────────────┤
│ Mayor GMV  │ Mejor Cumpl.   │
│ $3.7M      │ 98.5%          │
│ ASTRA Z..  │ PROCESOS..     │
├─────────────────────────────┤
│ 45 For│ 280 Loc│ 245km prom │
├─────────────────────────────┤
│ 🔍 Buscar...  [Ordenar ▼]  │
├─────────────────────────────┤
│ #1 ASTRA ZENECA         ⭐  │
│ 516 svs│$3.7M│AOV $7.2K     │
│ ✅94%  │ 2d inact │ ↗+12%   │
├─────────────────────────────┤
│ #2 PROCESOS ESP..       🟢  │
│ 9 svs │$283K│AOV $31.5K     │
│ ✅97%  │ 5d inact │ ↗+8%    │
└─────────────────────────────┘
```

## Archivos a modificar
- **`src/components/executive/ClientAnalytics.tsx`** — Layout movil completo: header, periodo, metrics, rutas, filtros, tabla→cards
- **`src/pages/Dashboard/KPIDashboard.tsx`** — Eliminar AcquisitionOverview y DailyLeadsCallsChart del tab "client" en movil

