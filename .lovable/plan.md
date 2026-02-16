

# Mejora del PDF de Reporte de Incidente Operativo

## Problemas identificados

1. No aparece el logo de Detecta en ninguna pagina
2. No se incluyen las imagenes/evidencia adjuntas a la cronologia
3. No se exporta la ubicacion de las entradas de cronologia (campos recien agregados)
4. La ruta del servicio muestra caracteres espaciados/corruptos
5. Falta informacion clave para un Head de Seguridad: tiempo de respuesta, responsable, impacto
6. La cronologia no se ordena cronologicamente en el PDF

## Cambios propuestos

### 1. Agregar logo de Detecta en el header de cada pagina

- Cargar el logo `src/assets/detecta-logo.png` como base64 al inicio de la funcion
- Renderizarlo en la barra roja del header (esquina izquierda, ~12mm de alto)
- Mover el texto "REPORTE DE INCIDENTE OPERATIVO" a la derecha del logo

### 2. Mejorar la seccion de Datos Generales

- Agregar campo "Reportado por" (ya existe en `incidente.reportado_por`)
- Agregar "Tiempo de respuesta" calculado: diferencia entre la primera entrada tipo `deteccion` y la primera `accion` o `notificacion`
- Mostrar severidad con indicador visual (circulo de color segun nivel)

### 3. Corregir renderizado de Ruta en Servicio Vinculado

- El campo Ruta concatena origen y destino con `→` pero jsPDF no maneja bien caracteres especiales en ciertas fuentes
- Usar `.replace()` para limpiar espacios extra y validar encoding antes de renderizar

### 4. Incluir ubicacion en entradas de Cronologia

- Para cada entrada que tenga `ubicacion_texto`, mostrar una linea adicional con icono de pin y la direccion
- Para entradas con `ubicacion_lat/lng` sin texto, mostrar las coordenadas

### 5. Incluir imagenes de evidencia en la Cronologia

- Para entradas con `imagen_url`, descargar la imagen como base64 usando `fetch` + `canvas`
- Renderizar un thumbnail (~40x30mm) debajo de la descripcion de la entrada
- Hacer la funcion `async` para permitir la carga de imagenes
- Agregar fallback: si la imagen no carga, mostrar texto "[Imagen no disponible]"

### 6. Ordenar cronologia cronologicamente

- Ordenar las entradas por `timestamp` ascendente antes de renderizar

### 7. Agregar seccion de Resumen Ejecutivo (nueva, antes de Datos Generales)

- Cuadro destacado con: Tipo, Severidad (con color), Cliente, Zona, Tiempo de respuesta
- Formato visual compacto que permite al Head de Seguridad evaluar gravedad en 5 segundos

### 8. Mejorar el footer

- Incluir "Documento confidencial - Solo para uso interno" en cada pagina
- Mantener numeracion de paginas y fecha de generacion

## Detalle tecnico

### Archivo modificado: `src/components/monitoring/incidents/IncidentPDFExporter.ts`

**Cambios principales:**

1. Importar el logo como base64 (crear constante o importar asset)
2. Convertir `exportIncidentePDF` a funcion `async` para poder cargar imagenes
3. En `addHeader()`: agregar `pdf.addImage()` con el logo
4. Nuevo bloque "Resumen Ejecutivo" con cuadros de color segun severidad
5. En seccion Cronologia:
   - Ordenar `cronologia.sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp))`
   - Para cada entrada, verificar `imagen_url` y cargar con `fetch` + blob to base64
   - Verificar `ubicacion_texto` y renderizar linea extra
6. En seccion Servicio Vinculado: sanitizar texto de ruta

**Archivos adicionales afectados:**

- `src/components/monitoring/incidents/IncidentReportForm.tsx` - Cambiar llamada a `await exportIncidentePDF()`
- `src/components/monitoring/incidents/IncidentListPanel.tsx` - Cambiar llamada a `await exportIncidentePDF()`

### Estructura final del PDF

```text
+------------------------------------------+
| [LOGO DETECTA]  REPORTE DE INCIDENTE     |
|              OPERATIVO        ID: xxxx   |
+------------------------------------------+
|                                          |
|  RESUMEN EJECUTIVO (nuevo)               |
|  +--------+ +--------+ +--------+       |
|  | Tipo   | | Sever. | | T.Resp |       |
|  | Acc.   | | ●BAJA  | | 1h 55m |       |
|  +--------+ +--------+ +--------+       |
|                                          |
|  1. Datos Generales                      |
|     Tipo: ...  Severidad: ...            |
|     Reportado por: ...                   |
|                                          |
|  2. Servicio Vinculado                   |
|     (ruta corregida)                     |
|                                          |
|  3. Cronologia del Evento               |
|     (ordenada cronologicamente)          |
|     ● 16/02 14:32 [Deteccion]           |
|       prueba 1                           |
|     ● 16/02 14:38 [Accion tomada]       |
|       foto del lugar                     |
|       [imagen thumbnail]                 |
|       📍 Calle X, Puebla               |
|     ● 16/02 20:27 [Notificacion]        |
|       prueba 2                           |
|                                          |
|  4. Controles y Atribucion              |
|                                          |
|  5. Resolucion (si aplica)              |
|                                          |
+------------------------------------------+
| Confidencial | Gen: 16/02 | Pag 1 de N  |
+------------------------------------------+
```

