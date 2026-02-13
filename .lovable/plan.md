

## Fix: Cache del navegador sirviendo codigo viejo

### Diagnostico

El codigo ya esta corregido en ambos archivos:
- `useSimpleLeads.ts`: el JOIN `profiles!asignado_a` ya fue removido (linea 81-89 confirma que solo tiene el select limpio)
- `useSupplyPipelineCounts.ts`: el filtro `.gte('created_at', cutoffISO)` ya esta aplicado a evaluaciones (linea 35)

**Sin embargo**, la request de red que el navegador envia todavia incluye `assigned_profile:profiles!asignado_a(display_name)` en la URL. Esto significa que el navegador esta usando una version cacheada del bundle JavaScript.

### Solucion

Forzar que Vite regenere el bundle tocando el archivo para invalidar el cache. El cambio sera minimo (agregar un comentario con timestamp) para garantizar que el bundler genere un hash nuevo.

### Cambio

| Archivo | Accion |
|---|---|
| `src/hooks/useSimpleLeads.ts` | Agregar comentario con timestamp para invalidar cache del bundle |

Esto forzara al HMR (Hot Module Replacement) de Vite a recargar el modulo con el codigo correcto.

