

## Rediseno: Enfoque Instruccional dentro del Generador IA + Formulario Manual como Plan B

### Cambio de jerarquia

El generador con IA es el camino principal y debe dominar la pantalla. El formulario manual es la valvula de escape para usuarios avanzados o casos donde la IA no sea suficiente.

### Cambios

**1. StepIdentidad.tsx - Reorganizar jerarquia visual**

- Mover el separador visual "o configura manualmente" entre el generador IA y el formulario manual
- Eliminar el campo `enfoque_instruccional` del formulario manual (ya vive dentro del generador IA)
- Colapsar el formulario manual por defecto usando un `Collapsible` de Radix, con texto "Configuracion manual" que el usuario puede expandir si lo necesita
- Mover imagen de portada dentro del collapsible manual

```text
+--------------------------------------------------+
| [Generador IA - prominente, siempre visible]     |
|                                                  |
| Tema del curso *                                 |
| Enfoque instruccional (opcional)                 |
| Rol objetivo        | Duracion                   |
| [ Generar Curso Completo ]                       |
+--------------------------------------------------+

      --- o configura manualmente (v) ---

  (colapsado por defecto, expandible)
  +------------------------------------------------+
  | Codigo *  | Titulo del curso *        [AI btn]  |
  | Descripcion                                     |
  | Imagen de portada                               |
  +------------------------------------------------+
```

**2. AIFullCourseGenerator.tsx - Mantener el enfoque instruccional aqui**

El campo de enfoque instruccional ya existe aqui y es donde debe quedarse segun la indicacion del usuario. No se mueve. Solo se propaga el valor al formulario principal cuando se completa la generacion, para que quede persistido.

Agregar al callback `onComplete` el campo `enfoque_instruccional` para que `StepIdentidad` lo guarde en el form al recibir los resultados.

**3. AIFullCourseGenerator.tsx - Propagar enfoque al form**

Modificar la interfaz `onComplete` para incluir `enfoque_instruccional`:

```typescript
onComplete(
  {
    codigo: metadata.codigo,
    titulo: tema,
    descripcion: metadata.descripcion,
    categoria: metadata.categoria,
    duracion_estimada_min: totalDuracion || duracion,
    roles_objetivo: [rol],
    enfoque_instruccional: enfoque, // nuevo
  },
  modulos
);
```

**4. StepIdentidad.tsx - Recibir y guardar enfoque del generador**

En el handler de `onFullCourseGenerated`, guardar el enfoque en el form:

```typescript
// Dentro del handler que recibe los datos del generador
form.setValue("enfoque_instruccional", formValues.enfoque_instruccional || "");
```

**5. LMSCursoWizard.tsx - Actualizar interfaz de onComplete**

Agregar `enfoque_instruccional` al tipo que recibe `handleFullCourseGenerated` y guardarlo en el form.

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/lms/admin/wizard/StepIdentidad.tsx` | Eliminar campo duplicado de enfoque, colapsar formulario manual con Collapsible, agregar separador visual |
| `src/components/lms/admin/wizard/AIFullCourseGenerator.tsx` | Agregar `enfoque_instruccional` al payload de `onComplete` |
| `src/components/lms/admin/LMSCursoWizard.tsx` | Actualizar handler para guardar `enfoque_instruccional` del generador en el form |

### Resultado

- El generador IA es lo primero y mas visible que ve el usuario
- El enfoque instruccional vive SOLO dentro del generador IA (donde tiene sentido contextual)
- El formulario manual queda colapsado como "plan B", accesible pero sin competir visualmente
- Al generar el curso, el enfoque se persiste en el formulario para futuras regeneraciones
