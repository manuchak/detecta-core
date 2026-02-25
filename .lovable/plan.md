

# Corregir Zoom del Modulo LMS (Capacitacion)

## Problema

La aplicacion tiene un zoom global de `0.7` (70%) en el `<html>` definido en `src/index.css`. Esto hace que todos los elementos del modulo LMS/Capacitacion se vean demasiado pequenos, lo cual no es pedagogico para un sistema de aprendizaje donde la legibilidad es critica.

## Solucion

Crear un componente wrapper `LMSZoomReset` que restaure el zoom a `1` (100%) cuando el usuario esta en cualquier ruta `/lms/*`. Es el mismo patron que ya usa `MonitoringTVPage` para la pantalla TV.

## Cambios

### 1. Nuevo componente `src/components/lms/LMSZoomReset.tsx`

Un wrapper simple que:
- Al montarse, cambia `document.documentElement.style.zoom = '1'`
- Al desmontarse, restaura el valor original
- Renderiza sus `children` sin cambios

### 2. Modificar `src/App.tsx`

Envolver cada pagina LMS con `<LMSZoomReset>` dentro del `<UnifiedLayout>`. Se aplica a las 7 rutas LMS:
- `/lms` (Dashboard)
- `/lms/curso/:cursoId` (Viewer)
- `/lms/admin` (Admin)
- `/lms/reportes` (Reportes)
- `/lms/admin/cursos/nuevo`
- `/lms/admin/cursos/:cursoId`
- `/lms/admin/cursos/:cursoId/editar`

El wrapper va **dentro** de `UnifiedLayout` para que el layout (sidebar, header) mantenga su proporcion y solo el contenido LMS se muestre al 100%.

## Archivos

| Archivo | Accion |
|---|---|
| `src/components/lms/LMSZoomReset.tsx` | **Nuevo** - wrapper que resetea zoom a 1 |
| `src/App.tsx` | Envolver las 7 rutas LMS con `<LMSZoomReset>` |

