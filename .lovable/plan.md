

## Sistema de Notas Internas para Perfiles Operativos

### Objetivo

Reemplazar el placeholder actual en la pestana "Notas" con un sistema completo de notas internas donde el equipo puede registrar observaciones, incidencias, acuerdos y cualquier anotacion relevante sobre cada operativo.

### Requiere tabla nueva en base de datos

No existe una tabla de notas. Se creara `notas_operativos` con la siguiente estructura:

| Columna | Tipo | Descripcion |
|---|---|---|
| id | uuid (PK) | ID unico |
| operativo_id | text | ID del custodio o armado |
| operativo_tipo | text | 'custodio' o 'armado' |
| contenido | text | Texto de la nota |
| categoria | text | 'general', 'incidencia', 'acuerdo', 'seguimiento' |
| prioridad | text | 'baja', 'media', 'alta' |
| autor_id | uuid | FK a auth.users |
| autor_nombre | text | Nombre del autor (para display rapido) |
| is_pinned | boolean | Si esta fijada arriba |
| created_at | timestamptz | Fecha de creacion |
| updated_at | timestamptz | Ultima edicion |

RLS habilitado: lectura y escritura para usuarios autenticados.

### Archivos a crear/modificar

**1. Crear `src/pages/PerfilesOperativos/hooks/useNotasOperativo.ts`**

Hook con:
- Query para listar notas del operativo, ordenadas por pinned desc + created_at desc
- Mutation para crear nota nueva
- Mutation para editar nota
- Mutation para eliminar nota
- Mutation para toggle pin

**2. Crear `src/pages/PerfilesOperativos/components/tabs/NotasTab.tsx`**

Componente completo con:
- Boton "Nueva Nota" que abre un formulario inline o dialog
- Formulario: textarea para contenido, selector de categoria (chips: General, Incidencia, Acuerdo, Seguimiento), selector de prioridad (Baja/Media/Alta)
- Lista de notas existentes como cards con:
  - Icono de pin (notas fijadas arriba con fondo destacado)
  - Badge de categoria con color
  - Indicador de prioridad (punto de color: verde/amarillo/rojo)
  - Contenido de la nota
  - Pie: autor + fecha relativa ("hace 2 horas")
  - Menu de acciones: Editar, Fijar/Desfijar, Eliminar (con confirmacion)
- Filtros simples: por categoria y busqueda por texto
- Estado vacio amigable cuando no hay notas

**3. Modificar `src/pages/PerfilesOperativos/PerfilForense.tsx`**

- Importar `NotasTab`
- Reemplazar `PlaceholderTab` en la pestana "notas" por:
```typescript
<NotasTab 
  operativoId={id!} 
  operativoTipo={tipo} 
/>
```
- Eliminar `PlaceholderTab` ya que no se usa en ninguna otra pestana

### Flujo de usuario

1. El usuario entra a la pestana "Notas" de un perfil operativo
2. Ve la lista de notas existentes (o un estado vacio invitando a crear la primera)
3. Click en "Nueva Nota" abre un formulario
4. Escribe la nota, selecciona categoria y prioridad
5. Guarda y la nota aparece en la lista con su nombre como autor
6. Puede fijar notas importantes, editarlas o eliminarlas

### Detalle tecnico

- Las fechas se muestran con `date-fns` en formato relativo (formatDistanceToNow)
- El autor se toma de `useStableAuth` (user.email / user.user_metadata.display_name)
- Categorias con colores: General (gris), Incidencia (rojo), Acuerdo (verde), Seguimiento (azul)
- El sistema funciona tanto para custodios como para armados (campo `operativo_tipo`)

