
# Mostrar nombres completos y referencia de factura en tarjetas de servicios

## Problema actual

En las tarjetas de servicios programados (tab "Servicios"), los nombres de custodio y armado se cortan por CSS (`truncate max-w-[120px]`), y la referencia de factura (`id_interno_cliente`) no se muestra.

## Cambios

### Archivo: `src/pages/Planeacion/components/ScheduledServicesTabSimple.tsx`

**1. Nombre completo del custodio (linea 1046)**

Eliminar `truncate max-w-[120px]` del span del custodio para que se muestre el nombre completo sin cortar.

```text
-- Antes:
<span className="font-medium text-foreground truncate max-w-[120px]">

-- Despues:
<span className="font-medium text-foreground">
```

**2. Nombre completo del armado (linea 1069)**

El armado ya no tiene truncate, pero por consistencia verificar que se mantenga sin restriccion. Sin cambio necesario aqui.

**3. Referencia de factura (`id_interno_cliente`) - nueva seccion**

Agregar despues del bloque del armado (Row 3, linea 1072), una fila condicional que muestre la referencia del cliente cuando exista:

```text
{service.id_interno_cliente && (
  <div className="flex items-center gap-1 mt-1 pl-2 text-xs">
    <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
    <span className="text-muted-foreground">Ref:</span>
    <span className="font-medium text-foreground">{service.id_interno_cliente}</span>
  </div>
)}
```

**4. Layout Row 2 - permitir wrap**

Para evitar que la fila 2 se comprima demasiado con nombres largos, cambiar de `flex items-center` a `flex flex-wrap items-center` en la linea 1031, permitiendo que el contenido pase a segunda linea si es necesario en pantallas pequeñas.

## Resultado visual

Cada tarjeta mostrara:
- **Fila 1**: Cliente, hora, folio, badges de estado
- **Fila 2**: Ruta + Custodio completo + Vehiculo (con wrap si necesario)
- **Fila 3** (si aplica): Nombre completo del armado (Acompanante)
- **Fila 4** (si aplica): Ref: [referencia de factura]
