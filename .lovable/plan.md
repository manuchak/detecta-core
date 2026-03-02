

# Corredor Crítico: SLP - Matehuala - Saltillo - Monterrey (57D)

## Justificacion

El tramo SLP-Matehuala-Monterrey por la autopista 57D/57 es la **principal arteria comercial** entre CDMX y Monterrey. Actualmente tiene **CERO segmentos de riesgo** en el sistema, a pesar de:

- Cruzar el **Altiplano Potosino** (~200km de desierto con cobertura celular limitada)
- Pasar por **Matehuala**, nodo logistico y zona de operacion de crimen organizado
- Conectar con la entrada sur a **Saltillo** y el corredor industrial hacia Monterrey
- Ser ruta de transito de **abarrotes, electronicos y autopartes** (productos mas robados en Mexico)
- Tener zonas muertas de comunicacion ya documentadas en `cellularCoverage.ts` pero sin contrapartida de riesgo

El sistema tiene el hub SLP (extremo, 4 segmentos) que termina en Villa de Reyes, y el corredor monterrey-saltillo (medio, sin segmentos). Entre ambos hay un **hueco de ~350km sin analisis de riesgo**.

## Cambios Propuestos

### 1. Nuevo corredor en `highwayCorridors.ts`

Agregar corredor `slp-matehuala-saltillo` con nivel **ALTO** (con tramos internos en EXTREMO):

```text
{
  id: 'slp-matehuala-saltillo',
  name: 'SLP - Matehuala - Saltillo (57D)',
  riskLevel: 'alto',
  description: 'Eje norte por Altiplano Potosino. Zonas muertas de comunicacion, robos organizados en Matehuala',
  kilometers: 450,
  avgEventsPerHex: 5,
  waypoints: [ SLP -> Charcas -> Matehuala -> Saltillo ]
}
```

### 2. Segmentos granulares en `highwaySegments.ts`

**7 segmentos** cubriendo los ~450km:

| Segmento | Tramo | Km | Riesgo | Justificacion |
|---|---|---|---|---|
| slp-mat-1 | SLP Norte - Entronque Charcas | 0-70 | Alto | Salida zona urbana, inicio despoblado |
| slp-mat-2 | Charcas - Venado | 70-140 | Extremo | Altiplano desertico, zona muerta celular, territorio cartel |
| slp-mat-3 | Venado - Matehuala Sur | 140-200 | Extremo | Zona mas aislada, sin cobertura, halcones |
| slp-mat-4 | Matehuala | 200-230 | Alto | Nodo logistico, robos en accesos y estaciones |
| slp-mat-5 | Matehuala - La Ventura | 230-300 | Alto | Tramo desertico norte, baja vigilancia |
| slp-mat-6 | La Ventura - Saltillo Sur | 300-380 | Medio | Mejora gradual de infraestructura |
| slp-mat-7 | Saltillo Sur - Entronque MTY | 380-450 | Medio | Zona periurbana Saltillo, conexion con 40D |

### 3. Segmentos para corredor existente `monterrey-saltillo`

El corredor `monterrey-saltillo` ya existe (85km, nivel medio) pero **sin segmentos**. Agregar 3 segmentos:

| Segmento | Tramo | Km | Riesgo | Justificacion |
|---|---|---|---|---|
| mty-sal-1 | Saltillo - Ramos Arizpe | 0-25 | Bajo | Zona industrial vigilada |
| mty-sal-2 | Ramos Arizpe - Santa Catarina | 25-60 | Medio | Tramo montanoso, curvas cerradas |
| mty-sal-3 | Santa Catarina - MTY | 60-85 | Bajo | Zona metropolitana MTY |

### 4. POIs criticos

Agregar puntos de interes operativos:

- **Blackspot**: Altiplano Charcas-Venado (zona de emboscadas)
- **Blackspot**: Acceso sur Matehuala (robo en paradas)
- **Safe area**: Gasolinera vigilada Matehuala centro
- **Safe area**: Puesto GN km 200 (57D)
- **Caseta**: Caseta Huizache (57D)
- **Junction**: Entronque Matehuala-Nuevo Laredo (57/57D)

### 5. Recomendaciones ISO 28000 para segmentos extremo

Los segmentos `slp-mat-2` y `slp-mat-3` (Altiplano Potosino) tendran recomendaciones especificas:

- Comunicacion satelital OBLIGATORIA (zona muerta confirmada en cellularCoverage.ts)
- Restriccion horaria absoluta: NO transitar 19:00-06:00
- Check-in obligatorio ANTES de entrar (km 70) y al SALIR (km 200)
- Convoy minimo 2 unidades para carga >$1.5M MXN
- Protocolo anti-jammer activo (71% uso nacional)
- Contacto previo con base GN Matehuala

### 6. Actualizacion de cobertura celular

El archivo `cellularCoverage.ts` ya tiene `deadzone-altiplano-slp` pero solo cubre km 80-150. Extender la zona muerta para cubrir km 70-200 (Charcas a Matehuala) que es la brecha real segun datos de IFT.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/lib/security/highwayCorridors.ts` | Agregar corredor `slp-matehuala-saltillo` |
| `src/lib/security/highwaySegments.ts` | Agregar 7 segmentos SLP-Matehuala-Saltillo + 3 segmentos MTY-Saltillo + 6 POIs |
| `src/lib/security/cellularCoverage.ts` | Extender zona muerta Altiplano a km 70-200 |

Total: 3 archivos, 10 segmentos nuevos, 6 POIs.
