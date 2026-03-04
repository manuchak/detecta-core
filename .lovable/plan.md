

# Rediseño: Panel de Inscripciones LMS

## Problemas actuales

1. **1 usuario + 1 curso por operación** — enrollar 5 personas en 3 cursos = 15 clicks
2. **Sin visibilidad de estado existente** — no sabes si alguien ya cursó, está activo o venció
3. **Dos dialogs separados** (individual y masivo) con flujos distintos e incompletos
4. **Lista plana de usuarios** sin contexto — no muestra rol ni historial LMS

## Solución: Dialog unificado con selección múltiple y contexto

Reemplazar los dos dialogs (`EnrollDialog` + `InscripcionMasivaDialog`) con un único dialog inteligente en dos pasos:

### Paso 1 — Seleccionar Usuarios
- **Búsqueda** con texto libre (nombre/email)
- **Filtro rápido por rol** (chips toggleables: Instalador, Monitoreo, etc.)
- **Lista de usuarios con checkboxes** para selección múltiple
- Cada usuario muestra: nombre, email, rol, y un **mini-badge** con cuántos cursos tiene activos/completados
- **Chip de selección** arriba mostrando cuántos van seleccionados, con "x" para quitar individualmente
- Botón "Seleccionar todos los filtrados"

### Paso 2 — Seleccionar Cursos y Confirmar
- **Lista de cursos disponibles** con checkboxes (múltiples)
- Cada curso muestra: título, nivel, obligatorio/opcional
- **Matriz de conflictos** inline: por cada curso seleccionado, muestra cuántos de los usuarios seleccionados ya están inscritos/completados/vencidos
  - Ej: "Toolkit de Soluciones — 3 nuevos, 1 ya inscrito (Carlos C.), 1 completado (Ana R.)"
  - Los ya completados se marcan en verde, los activos en azul, los nuevos en gris
- **Plazo** configurable (default del curso o personalizado)
- **Resumen final**: "Se inscribirán X usuarios en Y cursos (Z ya inscritos serán omitidos)"

### Cambios técnicos

**Archivos a modificar:**

| Archivo | Cambio |
|---|---|
| `src/components/lms/admin/LMSInscripcionesPanel.tsx` | Reemplazar `EnrollDialog` inline y refs a `InscripcionMasivaDialog` con nuevo `InscripcionInteligente` |
| `src/components/lms/admin/InscripcionMasivaDialog.tsx` | Eliminar — reemplazado |
| `src/components/lms/admin/InscripcionInteligente.tsx` | **Nuevo** — dialog unificado multi-step |
| `src/hooks/lms/useLMSAdminInscripciones.ts` | Nuevo hook `useLMSUsuariosConContexto` que trae usuarios + sus inscripciones existentes + roles en una sola query |

**Hook nuevo — `useLMSUsuariosConContexto`:**
- Query `profiles` con join a `user_roles` para obtener el rol
- Query `lms_inscripciones` agrupada por `usuario_id` para obtener conteo de cursos activos/completados
- Retorna: `{ id, display_name, email, roles: string[], cursosActivos: number, cursosCompletados: number, inscripciones: { curso_id, estado }[] }`
- Esto permite que el UI muestre conflictos en tiempo real al seleccionar cursos

**Mutación actualizada — `useLMSInscribirUsuarios`:**
- Ya soporta array de `usuarioIds` — se extiende para aceptar array de `cursoIds` y hacer el producto cartesiano
- El upsert con `ignoreDuplicates: true` ya previene duplicados a nivel DB

