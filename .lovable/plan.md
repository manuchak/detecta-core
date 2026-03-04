

## Diagnóstico Fishbone: "No se pudo crear el ticket" en portal custodio

```text
              Error "No se pudo crear el ticket"
                           |
    -------------------------------------------------------
    |                      |                      |
  Tabla fantasma      Efecto secundario      UX engañosa
  (post-insert)       (datos huérfanos)      (falso negativo)
  - Línea 270 consulta   - Ticket SÍ se crea   - Toast dice "Error"
    'categorias_ticket_   - Fotos SÍ se suben   - Wizard no avanza
    custodio'             - Pero createTicket    - Custodio reintenta
  - Tabla NO existe         retorna null          y puede crear
  - Real: 'ticket_       - loadTickets() nunca    duplicados
    categorias_custodio'    se ejecuta
  - Error lanzado 
    DESPUÉS del insert
```

### Causa raíz confirmada

En `src/hooks/useCustodianTicketsEnhanced.ts`, línea 270-273, después de insertar el ticket exitosamente, el código consulta la tabla `categorias_ticket_custodio` para obtener el nombre de la categoría para el template de WhatsApp. **Esa tabla no existe.** La tabla real es `ticket_categorias_custodio`.

El error de PostgREST cae en el `catch` genérico (línea 309), que muestra "No se pudo crear el ticket" y retorna `null` — aunque el ticket **sí fue creado** en la base de datos.

### Evidencia

- Query directa confirma: tabla `categorias_ticket_custodio` → no existe
- Tabla real: `ticket_categorias_custodio` (6 categorías activas)
- Tickets recientes de custodios SÍ aparecen en BD (el insert funciona)
- El mismo nombre de tabla incorrecto aparece en `InternalChatModal.tsx` línea 323

### Plan de fix

**1. Corregir nombre de tabla en `useCustodianTicketsEnhanced.ts` (línea 271)**
- Cambiar `categorias_ticket_custodio` → `ticket_categorias_custodio`

**2. Corregir nombre de tabla en `InternalChatModal.tsx` (línea 323)**
- Cambiar `categorias_ticket_custodio` → `ticket_categorias_custodio`

**3. Hacer el envío de WhatsApp no-bloqueante**
- Mover la consulta de categoría + `invoke('kapso-send-template')` fuera del try/catch principal, o envolver en su propio try/catch. Si el template falla, el ticket ya se creó con éxito — no debe afectar el resultado.

**4. Mover `loadTickets()` y `return data` antes de la lógica de WhatsApp**
- Garantizar que el wizard reciba el ticket creado y avance a la pantalla de éxito antes de que se intente enviar el template.

