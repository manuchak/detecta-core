
## Desarrollar la pestana de Cumplimiento

### Objetivo

Reemplazar el placeholder actual con una vista integral que consolide el estado de cumplimiento del operativo, reuniendo informacion de documentacion, sanciones y checklists en un solo lugar para toma de decisiones rapidas.

### Estructura de la pestana

La pestana tendra 4 secciones:

**1. Resumen de Cumplimiento (cards de metricas)**
- Score general de cumplimiento (semaforo verde/amarillo/rojo)
- Documentos vigentes vs vencidos vs por vencer
- Sanciones activas
- Checklists completados vs pendientes

**2. Documentos y Vigencias**
- Tabla compacta con cada documento del custodio mostrando: tipo, fecha de vigencia, estado (vigente/por vencer/vencido), verificado si/no
- Codigo de colores: verde (vigente >30 dias), ambar (por vencer <=30 dias), rojo (vencido)
- Los 3 documentos obligatorios (licencia, tarjeta circulacion, poliza seguro) se marcan visualmente si faltan

**3. Sanciones**
- Lista de sanciones aplicadas al operativo (activas primero, luego historicas)
- Cada sancion muestra: tipo/categoria, fecha inicio-fin, dias suspension, estado (activa/cumplida/revocada)
- Badge de alerta si hay sanciones activas

**4. Cumplimiento de Checklists**
- Tasa de cumplimiento (servicios con checklist / servicios completados)
- Ultimos 10 checklists con fecha y estado
- Alerta si la tasa es baja (<50%)

### Cambios tecnicos

**Archivo nuevo: `src/pages/PerfilesOperativos/components/tabs/CumplimientoTab.tsx`**
- Componente que recibe `custodioId`, `telefono`, `nombre` como props
- Reutiliza hooks existentes:
  - `useCustodianDocsForProfile(telefono)` para documentos y vigencias
  - `useSancionesAplicadas({ operativoId: custodioId })` del hook `useSanciones.ts`
  - Query directa a `checklist_servicio` filtrada por `custodio_telefono`
- Calcula un score de cumplimiento simple: (docs vigentes + sin sanciones activas + tasa checklist) / 3

**Archivo modificado: `src/pages/PerfilesOperativos/PerfilForense.tsx`**
- Importar `CumplimientoTab`
- Reemplazar el `PlaceholderTab` en `TabsContent value="cumplimiento"` por:
```typescript
<CumplimientoTab 
  custodioId={id!} 
  telefono={profile.telefono || null}
  nombre={profile.nombre}
/>
```

### Datos utilizados (sin cambios en DB)

| Fuente | Hook/Query | Datos |
|---|---|---|
| documentos_custodio | `useCustodianDocsForProfile` | tipo, vigencia, verificado |
| sanciones_aplicadas + catalogo | `useSancionesAplicadas` | tipo, fechas, estado, categoria |
| checklist_servicio | Query directa | conteo por custodio_telefono |
| servicios_custodia | `useProfilePerformance` (parcial) | servicios completados para tasa |

No se requieren migraciones de base de datos ni nuevos RPCs. Toda la informacion ya existe en tablas y hooks disponibles.
