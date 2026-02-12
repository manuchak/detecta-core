

## Plan: Persistir el informe SIERCP y permitir visualizacion instantanea

### Problema actual

Cada vez que se abre el dialog de informe SIERCP, se llama a la edge function de IA para regenerar el informe desde cero. Esto:
- Toma 10-15 segundos cada vez
- Gasta creditos de IA innecesariamente
- El informe se pierde al cerrar el dialog

### Solucion

Guardar el informe generado en la base de datos y cargarlo directamente en aperturas futuras.

### Cambios

#### 1. Base de datos - Nueva columna `ai_report`

Agregar columna `ai_report JSONB` a la tabla `evaluaciones_psicometricas` para persistir el informe generado.

#### 2. SIERCPReportDialog.tsx - Logica de cache

Cambiar el flujo del dialog:
- Al abrir, verificar si `evaluation.ai_report` ya existe
- Si existe: mostrar el informe guardado inmediatamente (sin loading, sin llamada a IA)
- Si no existe: generar con IA como antes, y despues de generar, guardar el resultado en la columna `ai_report` de esa evaluacion
- Agregar boton "Regenerar" para forzar una nueva generacion si se desea

#### 3. InvitationsTable.tsx - Iconos diferenciados

Cambiar el icono del boton segun si el informe ya fue generado:
- Icono de "ojo" (`Eye`) si `ai_report` ya existe (visualizacion instantanea)
- Icono actual (`ExternalLink`) si aun no se ha generado (primera generacion)

#### 4. useEvaluacionesPsicometricas.ts - Incluir ai_report en queries

Agregar `ai_report` a la interfaz `EvaluacionPsicometrica` para que este disponible en los componentes.

#### 5. useSIERCPInvitations.ts - Incluir ai_report en la query de invitaciones

Asegurar que la query que trae las invitaciones con evaluacion tambien traiga el campo `ai_report`.

### Flujo corregido

```
Primera vez:
  1. Analista hace click en icono (ExternalLink) en candidato completado
  2. Dialog abre, detecta que no hay ai_report guardado
  3. Genera informe con IA (10-15 seg con loading)
  4. Muestra el informe Y lo guarda en evaluaciones_psicometricas.ai_report
  5. Analista puede imprimir/PDF

Siguientes veces:
  1. Analista ve icono de "ojo" (Eye) indicando que el informe ya existe
  2. Click en el ojo
  3. Dialog abre, detecta ai_report existente
  4. Muestra el informe instantaneamente (sin loading, sin llamada a IA)
  5. Boton "Regenerar" disponible si desea actualizar el informe
```

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| Migracion SQL | `ALTER TABLE evaluaciones_psicometricas ADD COLUMN ai_report JSONB` |
| `src/hooks/useEvaluacionesPsicometricas.ts` | Agregar `ai_report` a la interfaz |
| `src/hooks/useSIERCPReport.ts` | Agregar funcion `saveReport` que persiste en la BD |
| `src/components/recruitment/psychometrics/SIERCPReportDialog.tsx` | Logica condicional: cargar de BD o generar. Boton "Regenerar" |
| `src/components/recruitment/siercp/InvitationsTable.tsx` | Icono Eye vs ExternalLink segun ai_report |
| `src/hooks/useSIERCPInvitations.ts` | Incluir ai_report en la query |

