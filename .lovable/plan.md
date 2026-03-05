

# Tarjetas más respiradas + Filtro rápido por custodio en "En Curso"

Dos mejoras para el workflow operativo con volumen alto de servicios.

## 1. Tarjetas ligeramente más altas

Actualmente las tarjetas usan `px-3 py-2` con `gap-1.5` en el grid. El cambio es mínimo pero efectivo:

- **ServiceCardActive.tsx**: Cambiar padding de `py-2` a `py-3`, y el spacing interno `mt-0.5` a `mt-1` y `mt-1.5` a `mt-2`. Esto agrega ~12px de altura por tarjeta, suficiente para "respirar" sin desperdiciar espacio.
- **BoardColumnEnCurso.tsx**: Cambiar `gap-1.5` del grid a `gap-2`.

Aplica el mismo ajuste a **ServiceCardEnDestino** para consistencia visual.

## 2. Barra de filtro rápido en la columna "En Curso"

Un input de búsqueda compacto en el header de la columna que filtra las tarjetas en tiempo real por:
- Nombre del custodio
- Nombre del cliente
- Folio (id_servicio)

### En BoardColumnEnCurso.tsx:
- Agregar estado local `filter` con `useState('')`
- Input tipo `Search` con placeholder "Buscar custodio, cliente..." debajo del header, usando el icono `Search` de lucide
- Filtrar `services` con `.filter()` antes del `.map()` comparando contra `custodio_asignado`, `nombre_cliente`, e `id_servicio`
- Mostrar el count filtrado vs total: "5 de 12"

El filtro es puramente client-side (ya tenemos todos los servicios en memoria), instantáneo, y no requiere cambios en el backend.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `ServiceCardActive.tsx` | Aumentar padding vertical (`py-2` → `py-3`) y spacing interno |
| `ServiceCardEnDestino.tsx` | Mismo ajuste de padding para consistencia |
| `BoardColumnEnCurso.tsx` | Agregar input de filtro + aumentar gap del grid |

