

## Hacer visibles las mejoras del LMS

### Problema actual

Los nuevos componentes (`CategoryProgressSummary` y `CoursesByCategory`) estan dentro del tab "Mis Cursos", pero lo primero que el usuario ve al entrar a `/lms` es la seccion "Cursos Obligatorios Pendientes" que sigue siendo un grid plano sin agrupacion por categorias. Esto hace que la mejora pase desapercibida.

### Cambios propuestos

**Archivo: `src/pages/LMS/LMSDashboard.tsx`**

1. **Eliminar la seccion separada "Cursos Obligatorios Pendientes"** (lineas 107-135) que duplica contenido que ya aparece en "Mis Cursos"
2. **Mover el `CategoryProgressSummary` ARRIBA de los tabs**, como panel principal siempre visible, para que sea lo primero que el usuario vea
3. **Hacer que el tab "Mis Cursos" sea el default** cuando no hay onboarding pendiente (ya lo es, pero la seccion de obligatorios roba toda la atencion visual)
4. **En el tab "Mis Cursos"**, integrar un banner compacto de alertas urgentes/vencidas dentro de `CoursesByCategory` en lugar de una seccion separada

**Archivo: `src/components/lms/CoursesByCategory.tsx`**

5. Agregar indicador visual de urgencia por categoria (icono de alerta si hay cursos vencidos en esa categoria)
6. Destacar cursos obligatorios con un borde lateral de color (left border) ademas del ring actual

**Archivo: `src/components/lms/CategoryProgressSummary.tsx`**

7. Agregar metricas globales arriba de las barras: total inscritos, completados, en progreso (como mini-cards)

### Resultado esperado

Al entrar a `/lms`:
- Lo primero visible sera el resumen de progreso por categoria con metricas
- El tab "Mis Cursos" mostrara cursos agrupados y priorizados por categoria
- No habra seccion separada duplicando cursos obligatorios (ya se muestran priorizados dentro de cada categoria)
- La experiencia sera notablemente diferente y mas organizada

### Archivos a modificar
- `src/pages/LMS/LMSDashboard.tsx` - Reestructurar layout principal
- `src/components/lms/CoursesByCategory.tsx` - Indicadores de urgencia por categoria
- `src/components/lms/CategoryProgressSummary.tsx` - Agregar metricas globales
