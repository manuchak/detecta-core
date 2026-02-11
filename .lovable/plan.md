

## Rediseno UX/UI del LMS - Mejores Practicas de Gestion de Capacitacion

### Problemas identificados

1. **Botones desalineados en CourseCard**: Las tarjetas tienen contenido de altura variable (titulo, descripcion, progreso) que empuja los botones a diferentes alturas. No hay `flex-grow` para empujar el boton al fondo.
2. **Sin agrupacion por categorias**: Los cursos se muestran en una lista plana sin separacion visual por categoria (onboarding, procesos, herramientas, compliance, habilidades).
3. **Sin prioridad visual**: Los cursos obligatorios pendientes, en progreso, y vencidos no se priorizan visualmente dentro de "Mis Cursos".
4. **Sin medicion de progreso por categoria**: No existe un resumen que muestre "Onboarding: 2/3 completados", "Compliance: 0/1", etc.
5. **Tab "Mis Cursos" mezcla todo**: Muestra en progreso junto con el widget de gamificacion sin separar por prioridad o categoria.

### Mejores practicas de LMS que se van a implementar

Basado en la investigacion de plataformas como LearnDash, Coursera y Udemy:

- **Tarjetas de altura uniforme**: Usar CSS `flex` con `flex-grow` para alinear botones al fondo (tecnica estandar).
- **Agrupacion por categoria con progreso**: Secciones colapsables por categoria mostrando barra de progreso agregada.
- **Prioridad visual**: Ordenar cursos por urgencia (vencidos > urgentes > en progreso > pendientes > completados).
- **Resumen ejecutivo de progreso**: Panel superior con metricas por categoria antes de la lista de cursos.
- **Layout consistente de cards**: `flex flex-col h-full` con el boton en un `mt-auto` para alineacion perfecta.

### Cambios planificados

**Archivo 1: `src/components/lms/CourseCard.tsx`** - Fix de alineacion

- Cambiar el `Card` a `flex flex-col h-full`
- Cambiar `CardContent` a `flex flex-col flex-1`
- Mover el boton de accion a un contenedor con `mt-auto` para que siempre quede al fondo
- Esto resuelve el problema principal de botones desalineados

**Archivo 2: `src/components/lms/CategoryProgressSummary.tsx`** (NUEVO)

Componente que muestra un resumen de progreso por categoria:

```text
+--------------------------------------------------+
| Progreso por Categoria                           |
+--------------------------------------------------+
| Onboarding    [====------] 2/3 cursos   67%      |
| Procesos      [----------] 0/1 cursos    0%      |
| Habilidades   [==========] 1/1 cursos  100%      |
| Compliance    [----------] 0/0 cursos    --      |
+--------------------------------------------------+
```

- Recibe los cursos y calcula agrupados por `categoria`
- Muestra barra de progreso y conteo para cada una
- Chips clickeables que filtran la vista por categoria

**Archivo 3: `src/components/lms/CoursesByCategory.tsx`** (NUEVO)

Componente que agrupa cursos por categoria con secciones colapsables:

- Usa `Collapsible` de Radix para expandir/colapsar
- Cada seccion tiene titulo de categoria, conteo, y barra de progreso mini
- Dentro de cada seccion, cursos ordenados por prioridad: vencidos primero, luego urgentes, luego en progreso, luego pendientes

**Archivo 4: `src/pages/LMS/LMSDashboard.tsx`** - Reestructurar tab "Mis Cursos"

Cambiar el layout de "Mis Cursos" para:

1. **Hero de progreso general**: Tarjeta superior con metricas globales (cursos totales, completados, en progreso, horas dedicadas)
2. **Alertas priorizadas**: Cursos vencidos y urgentes destacados con banner
3. **CategoryProgressSummary**: Resumen visual de progreso por categoria
4. **CoursesByCategory**: Cursos agrupados por categoria con seccion expandible
5. **Widget de gamificacion**: Se mantiene en sidebar pero sin dominar la vista

Orden de prioridad en la lista:
1. Obligatorios vencidos (borde rojo)
2. Obligatorios urgentes <3 dias (borde amarillo)
3. En progreso (borde azul)
4. Inscritos sin empezar
5. Completados (check verde, al final)

### Detalle tecnico

**CourseCard.tsx - Fix de alineacion (CSS puro)**:
```text
Card -> className="flex flex-col h-full ..."
CardContent -> className="p-4 flex flex-col flex-1"
Boton wrapper -> className="pt-2 mt-auto"
```

**CategoryProgressSummary.tsx**:
- Recibe `cursos: CursoDisponible[]`
- Agrupa con `reduce()` por `curso.categoria`
- Calcula completados vs total por grupo
- Renderiza barras de progreso con los colores de la paleta del proyecto

**CoursesByCategory.tsx**:
- Recibe `cursos: CursoDisponible[]`, `onStartCourse`, `onEnroll`
- Funcion de sort por prioridad interna
- Usa `Collapsible` con estado abierto por default para categorias con cursos pendientes
- Categorias con todos los cursos completados aparecen colapsadas

**LMSDashboard.tsx** - Tab "Mis Cursos" nuevo layout:
- Reemplazar grid simple por: `CategoryProgressSummary` + `CoursesByCategory`
- Mover `GamificacionWidget` debajo del resumen de progreso (no en sidebar que roba 25% del ancho)
- Mantener todas las demas tabs sin cambio

### Archivos a crear
- `src/components/lms/CategoryProgressSummary.tsx`
- `src/components/lms/CoursesByCategory.tsx`

### Archivos a modificar
- `src/components/lms/CourseCard.tsx` (fix alineacion flex)
- `src/pages/LMS/LMSDashboard.tsx` (reestructurar tab Mis Cursos)

