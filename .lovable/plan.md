

# Agregar ubicacion opcional a entradas de cronologia

## Resumen

Agregar un boton opcional "Agregar ubicacion" en el formulario de nueva entrada de cronologia. Al activarlo, se muestra un mini LocationPicker inline. La ubicacion se guarda como coordenadas (lat/lng) y direccion en la entrada, y se muestra como badge con icono de pin en las entradas existentes.

## Cambios en base de datos

Agregar 3 columnas opcionales a la tabla `incidente_cronologia`:

- `ubicacion_lat` (double precision, nullable)
- `ubicacion_lng` (double precision, nullable)  
- `ubicacion_texto` (text, nullable)

## Cambios en codigo

### 1. `src/hooks/useIncidentesOperativos.ts`

- Agregar `ubicacion_lat`, `ubicacion_lng`, `ubicacion_texto` a la interfaz `EntradaCronologia`
- Agregar los mismos campos al `mutationFn` de `useAddCronologiaEntry` para que se inserten en la DB

### 2. `src/components/monitoring/incidents/IncidentTimeline.tsx`

- Agregar campos de ubicacion a `LocalTimelineEntry`: `ubicacion_lat?`, `ubicacion_lng?`, `ubicacion_texto?`
- Actualizar la firma de `onAddEntry` para incluir los campos de ubicacion opcionales
- En el formulario de nueva entrada:
  - Agregar estado local para ubicacion: `entryLocation` con lat, lng, texto
  - Agregar boton toggle "Agregar ubicacion" (icono MapPin) debajo de la seccion de imagen
  - Al activarlo, mostrar un `LocationPicker` compacto (reutilizando el componente existente)
  - Al desactivarlo, limpiar la ubicacion
- En `handleSubmit`: pasar los datos de ubicacion al callback `onAddEntry`
- En la lista de entradas renderizadas: si la entrada tiene `ubicacion_texto`, mostrar un Badge con icono MapPin y el texto de la direccion (truncado)

### 3. `src/components/monitoring/incidents/IncidentReportForm.tsx`

- Actualizar `handleAddCronologia` para recibir y pasar `ubicacion_lat`, `ubicacion_lng`, `ubicacion_texto`
- Actualizar la creacion de `LocalTimelineEntry` para incluir los campos de ubicacion
- En `buildPayload` / flujo de guardado de entradas locales: incluir ubicacion al insertar en DB

### 4. `src/components/monitoring/incidents/IncidentPDFExporter.ts`

- Opcional: mostrar la ubicacion en la seccion de cronologia del PDF si existe

## Flujo del usuario

1. Hace clic en "+ Agregar entrada"
2. Llena fecha, tipo, descripcion
3. Opcionalmente hace clic en "Agregar ubicacion" (boton con icono MapPin)
4. Se despliega un LocationPicker compacto con mapa pequeno
5. Selecciona ubicacion en el mapa o busca direccion
6. Hace clic en "Agregar" - la entrada se crea con la ubicacion
7. En la cronologia, la entrada muestra un badge con la direccion

## Detalles tecnicos

- Se reutiliza el componente `LocationPicker` existente de `./LocationPicker` (ya importado en el mismo directorio)
- El LocationPicker se renderiza condicionalmente con `showLocationPicker` toggle
- Las columnas de DB son nullable para no afectar entradas existentes
- La migracion SQL se ejecuta antes de los cambios de codigo

