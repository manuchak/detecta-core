
# Mostrar nombre del creador en el reporte de incidentes

## Problema

Hay dos fallas encadenadas:

1. **El formulario no guarda quién creó el incidente**: La función `buildPayload()` en `IncidentReportForm.tsx` nunca incluye `reportado_por`, por lo que la columna queda NULL en la base de datos.
2. **El PDF muestra el UUID en lugar del nombre**: Aunque se guardara, `reportado_por` es una columna UUID. El PDF lo muestra directamente como texto (`incAny.reportado_por || '-'`), lo cual mostraría algo como `a1b2c3d4-...` en lugar de tu nombre.

## Solución

### 1. Guardar `reportado_por` al crear el incidente

En `src/components/monitoring/incidents/IncidentReportForm.tsx`, agregar `reportado_por: user?.id` dentro de `buildPayload()`. Esto asegura que cada incidente nuevo (o borrador) registre automáticamente al usuario que lo creó.

### 2. Resolver el nombre para el PDF

En `src/components/monitoring/incidents/IncidentPDFExporter.ts`, antes de generar el PDF, consultar la tabla `profiles` usando el UUID de `reportado_por` para obtener `display_name` (o `email` como fallback). Pasar ese nombre como prop al documento PDF.

### 3. Mostrar el nombre en el PDF

En `src/components/monitoring/incidents/pdf/IncidentPDFDocument.tsx`, reemplazar `incAny.reportado_por || '-'` por la nueva prop `reportadoPorNombre` que ya contiene el nombre resuelto.

## Archivos a modificar

- **`src/components/monitoring/incidents/IncidentReportForm.tsx`**: Agregar `reportado_por: user?.id` en `buildPayload()`
- **`src/components/monitoring/incidents/IncidentPDFExporter.ts`**: Consultar `profiles` para resolver el nombre del creador antes de generar el PDF
- **`src/components/monitoring/incidents/pdf/IncidentPDFDocument.tsx`**: Recibir y mostrar `reportadoPorNombre` en lugar del UUID

## Dato adicional

Los incidentes ya creados seguirán con `reportado_por = NULL`. Para esos casos, el PDF mostrará el email de la firma de creación (`firma_creacion_email`) como fallback, ya que ese dato sí se guarda correctamente.
