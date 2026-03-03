

# Corrección de ruta Manzanillo → Cuautitlán (15D)

## Análisis: Google Maps vs sistema actual

La ruta real de Google Maps (796km, 15D) sigue:
```text
Manzanillo → Colima → Acatlán (Macrolib GDL sur) → La Barca → 
Zamora de Hidalgo → Morelia (Lib. Sur) → Maravatío → Atlacomulco → 
Toluca (Lib.) → Cuautitlán/CDMX
```

### Errores encontrados

**1. Tramo faltante Macrolibramiento Este → Zamora → Morelia**
El sistema tiene `mza-tam-2` que va de Colima al Macrolibramiento GDL y sale por **Zapotlanejo Norte** (hacia Lagos de Moreno/Tampico). Pero para ir a CDMX, el tracto sale del Macrolibramiento por el **este hacia La Barca**, toma la 15D por Zamora y conecta con Morelia. Este tramo (~180km) **no existe** en ningún segmento ni corredor.

**2. No hay forma de rutear Manzanillo → CDMX**
El corredor `lazaro-cardenas-cdmx` empieza en LC (Uruapan → Morelia → CDMX), pero no conecta con Manzanillo. El corredor `guadalajara-colima` conecta GDL con Manzanillo pero no con Morelia. Resultado: no hay cadena de segmentos para la ruta más transitada por carga de puerto.

**3. Waypoints del corredor `guadalajara-colima` inconsistentes**
El waypoint `[-103.4800, 20.5200]` cae dentro de GDL urbano, contradice el estándar de libramientos.

**4. Segmento `mza-tam-2` cubre demasiado (100km Colima → Macrolib)**
Google Maps muestra que este tramo pasa por zonas de sierra (Atenquique/barrancas) que merecen segmentación separada por riesgo.

## Plan de corrección

### A. Crear corredor `manzanillo-cdmx` (15D, ~450km)

Nuevo corredor que represente la ruta real de carga Manzanillo → CDMX vía 15D:
```text
Manzanillo → Colima → Macrolib GDL (sur) → La Barca → Zamora → 
Libramiento Morelia → [conecta con lc-cdmx-6 en Maravatío]
```

Con ~5 segmentos nuevos:
| Segmento | Tramo | Km | Riesgo |
|---|---|---|---|
| mza-cdmx-1 | Manzanillo - Colima | 0-100 | medio |
| mza-cdmx-2 | Colima - Macrolib GDL (Acatlán) | 100-210 | bajo |
| mza-cdmx-3 | Macrolib GDL Sur - La Barca | 210-300 | bajo |
| mza-cdmx-4 | La Barca - Zamora | 300-370 | medio |
| mza-cdmx-5 | Zamora - Lib. Morelia (entronque 15D/37D) | 370-450 | medio |

A partir de Morelia, la ruta usa los segmentos existentes `lc-cdmx-6` (Morelia-Maravatío), `lc-cdmx-7` (Maravatío-Atlacomulco), `lc-cdmx-8` (Atlacomulco-Toluca-CDMX).

### B. Corregir corredor `guadalajara-colima`

Arreglar waypoints para que sigan el Macrolibramiento correctamente sin pasar por zona urbana GDL.

### C. Ajustar segmento `mza-tam-2`

Renombrar/clarificar que este segmento es la ruta hacia **Tampico** (norte por Zapotlanejo), no hacia CDMX.

### D. Agregar POIs del tramo nuevo

- Entronque La Barca (decisión: norte a Lagos o este a Zamora) → `referencia`
- Caseta Zamora 15D → `referencia`  
- Gasolinera La Barca → `descanso`

### E. Re-enriquecer geometrías

Invocar `enrich-segment-geometries` para los ~5 segmentos nuevos + correcciones.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/lib/security/highwaySegments.ts` | Crear ~5 segmentos `mza-cdmx-*`, agregar POIs La Barca/Zamora |
| `src/lib/security/highwayCorridors.ts` | Crear corredor `manzanillo-cdmx`; corregir waypoints `guadalajara-colima` |
| Edge function `enrich-segment-geometries` | Invocar para nuevos segmentos |

