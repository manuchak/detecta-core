

# Analisis Fishbone: Modulo de Tickets

## Problema Principal
El ticket CUS-MM2HMB7O de Luis Armando Gonzalez Aquino existe en la base de datos pero tiene problemas de visibilidad en el dashboard, y los graficos presentan un ciclo de re-renderizado infinito.

```text
                    Ticket de Luis Aquino invisible + Graficos fallando
                    ================================================
                    |
    +---------------+---------------+----------------+---------------+
    |               |               |               |               |
  DATOS           RLS/AUTH        FRONTEND         METRICAS
    |               |               |               |
    |               |               |               |
 custodio_id     Politicas OK    Loop infinito   full_name no
 es NULL         (admin ve       en charts       existe en
 en ticket       todo)           por dates       profiles
    |                             inestables      (es display_name)
    |                               |
 Telefono sin                    startDate =
 normalizar                      new Date() en
 (espacios vs                    cada render
 sin espacios)                      |
    |                            useCallback
 No hay link                     se recrea
 custodio_id                     infinitamente
 automatico
 al crear ticket
```

## Hallazgo 1: Ticket CUS-MM2HMB7O SI existe en la DB

El ticket de Luis Aquino esta en la tabla `tickets`:
- ID: `eb660eb0-4447-4dcd-834e-9dfa2c11c873`
- Telefono: `55 8180 2331`
- Status: `abierto`
- **custodio_id: NULL** (problema critico)
- tipo_ticket: `custodio`

El admin tiene rol `admin` en `user_roles`, y la politica `users_view_own_tickets` permite SELECT para `admin`. Por tanto, **el ticket SI deberia aparecer en el listado**.

**Causa raiz de que no se vea "como de Luis Aquino"**: La columna `custodio_id` es NULL. El dashboard muestra el nombre del custodio via `ticket.custodio?.nombre` (linea 446 de TicketsList.tsx), que depende de un JOIN con `custodios_operativos` usando `custodio_id`. Como es NULL, muestra "Sin nombre" y el admin no lo identifica como de Luis Aquino.

Ademas hay inconsistencia de formato de telefono:
- `profiles.phone`: `55 8180 2331` (con espacios)
- `custodios_operativos.telefono`: `5581802331` (sin espacios)
- `tickets.custodio_telefono`: `55 8180 2331` (con espacios)

## Hallazgo 2: Graficos en loop infinito de re-renderizado

El session replay confirma ciclos repetidos de skeleton/chart. La causa esta en `useTicketMetrics.ts`:

```text
// Linea 58-62: Valores por defecto crean objetos NUEVOS en cada render
const {
  startDate = startOfMonth(subMonths(new Date(), 3)),  // NUEVO Date() cada render
  endDate = new Date(),                                  // NUEVO Date() cada render
} = options;
```

Estos valores inestables hacen que `useCallback` (linea 64) recree `calculateMetrics` en cada render, disparando el `useEffect` (linea 377) infinitamente.

## Hallazgo 3: Columna `full_name` no existe

En `useTicketMetrics.ts` linea 116:
```text
.select('id, full_name')  // ERROR: la columna es 'display_name'
```

Esto causa que todos los agentes muestren "Sin nombre" en las metricas de performance.

## Hallazgo 4: Warning de DOM nesting

El console log muestra: `<div> cannot appear as a descendant of <p>`. Esto viene de un `<Badge>` (que renderiza un `<div>`) dentro de `<CardDescription>` (que renderiza un `<p>`), en el componente TicketsList.tsx linea 255-258.

---

## Plan de Correccion

### Tarea 1: Corregir loop infinito de graficos

**Archivo**: `src/hooks/useTicketMetrics.ts`

Memoizar los valores por defecto de `startDate` y `endDate` para evitar que `useCallback` se recree en cada render:

```text
// Antes (lineas 57-62):
const { startDate = startOfMonth(subMonths(new Date(), 3)), endDate = new Date() } = options;

// Despues:
const defaultStart = useMemo(() => startOfMonth(subMonths(new Date(), 3)), []);
const defaultEnd = useMemo(() => new Date(), []);
const { startDate = defaultStart, endDate = defaultEnd, departamento, agentId } = options;
```

Ademas, convertir las dependencias del `useCallback` a strings para estabilidad:

```text
}, [startDate.toISOString(), endDate.toISOString(), departamento, agentId]);
```

### Tarea 2: Corregir columna full_name a display_name

**Archivo**: `src/hooks/useTicketMetrics.ts`, linea 116

Cambiar:
```text
.select('id, full_name')
```
Por:
```text
.select('id, display_name')
```

Y en linea 118:
```text
a.full_name || 'Sin nombre'
```
Por:
```text
a.display_name || 'Sin nombre'
```

### Tarea 3: Vincular custodio_id automaticamente al crear ticket

**Archivo**: `src/hooks/useCustodianTicketsEnhanced.ts`

En la funcion `createTicket` (linea 171+), antes de insertar, buscar el `custodio_id` en `custodios_operativos` usando el telefono normalizado:

```text
// Normalizar telefono (quitar espacios, +52, etc.)
const normalizedPhone = custodianPhone.replace(/[\s\-\+]/g, '').replace(/^52/, '');

// Buscar custodio_id
const { data: custodioData } = await supabase
  .from('custodios_operativos')
  .select('id')
  .or(`telefono.eq.${normalizedPhone},telefono.eq.${custodianPhone}`)
  .maybeSingle();

// Incluir custodio_id en el insert
insert({
  ...existingFields,
  custodio_id: custodioData?.id || null,
})
```

### Tarea 4: Resolver custodio_id para tickets existentes sin el

Crear un script SQL (via migration tool) que actualice los tickets existentes que tienen `custodio_telefono` pero no `custodio_id`:

```text
UPDATE tickets t
SET custodio_id = co.id
FROM custodios_operativos co
WHERE t.custodio_id IS NULL
  AND t.custodio_telefono IS NOT NULL
  AND replace(replace(replace(t.custodio_telefono, ' ', ''), '-', ''), '+52', '') 
    = replace(replace(replace(co.telefono, ' ', ''), '-', ''), '+52', '');
```

### Tarea 5: Mejorar resolucion de nombre en el dashboard

**Archivo**: `src/pages/Tickets/TicketsList.tsx`, linea 446

Agregar fallback al nombre del custodio buscando por telefono si `custodio` es null:

```text
{ticket.custodio?.nombre || ticket.custodio_telefono || ticket.customer_name || 'Sin nombre'}
```

Y en `TicketCardMobile.tsx` linea 99, mismo cambio.

### Tarea 6: Corregir DOM nesting warning

**Archivo**: `src/pages/Tickets/TicketsList.tsx`, linea 255-258

El `<Badge>` dentro de `<CardDescription>` viola DOM nesting (`<div>` dentro de `<p>`). Cambiar el `<Badge>` a un `<span>` inline o mover fuera del `<CardDescription>`.

---

## Resumen de archivos a modificar

| Archivo | Cambio | Impacto |
|---|---|---|
| `src/hooks/useTicketMetrics.ts` | Memoizar dates + fix `full_name` | Elimina loop infinito de graficos |
| `src/hooks/useCustodianTicketsEnhanced.ts` | Vincular `custodio_id` al crear ticket | Tickets futuros tendran nombre visible |
| `src/pages/Tickets/TicketsList.tsx` | Fallback nombre + fix DOM nesting | Nombre visible + warning eliminado |
| `src/components/tickets/TicketCardMobile.tsx` | Fallback nombre custodio | Nombre visible en mobile |
| SQL Migration | UPDATE tickets sin custodio_id | Fix retroactivo para Luis Aquino |

## Impacto esperado

- Graficos dejan de flickear/ciclarse (loop infinito eliminado)
- El ticket de Luis Aquino muestra su nombre correctamente
- Tickets futuros creados por custodios siempre tendran `custodio_id` vinculado
- Nombres de agentes correctos en metricas de performance
- Warning de DOM nesting eliminado

