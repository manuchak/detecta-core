

# Ticker de alertas operacionales: solo eventos accionables para el videowall

## Problema actual

El ticker muestra **todos** los incidentes sin distinguir entre eventos operacionales urgentes (bloqueos, saqueos, asaltos activos) y contenido informativo general (estadisticas, noticias generales, reportes historicos). Para el equipo que monitorea el videowall, solo importan eventos **en curso o recientes** que puedan afectar tramos carreteros.

## Solucion: Filtrado por tipo de incidente + relevancia operacional

La clasificacion AI ya asigna un `tipo_incidente` a cada tweet. Aprovecharemos esto para crear dos niveles de prioridad en el ticker.

### Tipos de incidente accionables (prioridad alta - se muestran siempre)

| tipo_incidente | Descripcion |
|---|---|
| bloqueo_carretera | Bloqueos, narcobloqueos, cierres viales |
| robo_carga | Robo de carga en transito |
| robo_unidad | Robo de trailer/camion completo |
| asalto_transporte | Asaltos a transportistas en ruta |
| secuestro_operador | Secuestro de chofer/operador |
| accidente_trailer | Volcaduras, accidentes que cierran vias |

### Tipos excluidos del ticker (no accionables para operaciones en tiempo real)

| tipo_incidente | Razon |
|---|---|
| robo_combustible | Generalmente reportado post-hecho |
| robo_autopartes | No afecta tramos en tiempo real |
| extorsion | Patron cronico, no evento puntual |
| vandalismo_unidad | Bajo impacto operacional |
| otro / sin_clasificar | Ruido, estadisticas, noticias generales |

### Filtro adicional por keywords de accion inmediata

Ademas del `tipo_incidente`, agregar un regex para detectar frases que indican **eventos activos** en el texto:

```
bloqueo|narcobloqueo|cierran|cortaron|saqueo|rapiña|balacera|enfrentamiento|persecucion|emboscada|desvio|cerrada|no pasar|precaucion
```

Esto captura tweets clasificados como `otro` o `sin_clasificar` que si son relevantes operacionalmente.

## Cambios tecnicos

### Archivo: `src/components/monitoring/tv/TVAlertTicker.tsx`

1. **Definir conjunto de tipos accionables**:
   - `ACTIONABLE_TYPES = ['bloqueo_carretera', 'robo_carga', 'robo_unidad', 'asalto_transporte', 'secuestro_operador', 'accidente_trailer']`

2. **Agregar regex de eventos activos**:
   - `ACTIVE_EVENT_KEYWORDS` para detectar lenguaje de evento en curso

3. **Reemplazar la logica de filtrado actual**:
   - Primer filtro: incidentes cuyo `tipo_incidente` esta en ACTIONABLE_TYPES
   - Segundo filtro: incidentes de otros tipos pero que contienen keywords de evento activo en `resumen_ai`
   - Eliminar el backfill con incidentes no relacionados (ya no se rellenan con contenido generico)
   - Mantener el orden por severidad y luego por fecha

4. **Reducir ventana temporal a 24h**:
   - Con el filtro mas inteligente, 24h es suficiente. Si no hay nada en 24h, mostrar "Sin alertas activas" (que es la situacion real)

5. **Mejorar el mensaje vacio**:
   - Cambiar "Sin alertas de ruta recientes" por "Sin incidentes activos en corredores" para reflejar que es un indicador positivo

### Archivo: `src/hooks/useIncidentesRRSS.ts`

- Sin cambios necesarios. El filtrado se hace en el componente despues de recibir los datos.

## Resultado esperado

El ticker mostrara exclusivamente:
- Bloqueos y narcobloqueos activos
- Robos de carga/unidad reportados en las ultimas horas
- Asaltos y secuestros de operadores
- Accidentes que cierran tramos
- Cualquier evento con lenguaje de urgencia operacional

No mostrara: estadisticas semanales, noticias generales de seguridad, reportes historicos, ni contenido informativo sin impacto inmediato en ruta.

