

## Persistencia de Navegacion en el Editor de Cursos

### Problema

El editor usa `defaultValue="general"` en los Tabs, lo que significa que cada vez que el componente se monta (al regresar de copiar un prompt, cambiar de ventana, etc.), se pierde el contexto y el usuario vuelve al tab "General". Ademas, el estado de los modulos expandidos y el contenido abierto para edicion tambien se pierden.

### Solucion

Aplicar el **estandar de persistencia de tabs anidados** ya establecido en el proyecto (`useSearchParams`) a 3 niveles:

1. **Tab activo** -- persistido en URL: `?tab=estructura`
2. **Modulo expandido** -- persistido en URL: `?tab=estructura&modulo=uuid`
3. **Contenido en edicion** -- persistido en URL: `?tab=estructura&modulo=uuid&contenido=uuid`

Al regresar a la pagina, el editor restaura automaticamente el tab, expande el modulo correcto y abre el editor del contenido donde se quedo el usuario.

### Cambios

| Archivo | Cambio |
|---------|--------|
| `LMSCursoEditor.tsx` | Reemplazar `defaultValue="general"` con estado controlado via `useSearchParams` (`value`/`onValueChange`) |
| `TabEstructura.tsx` | Recibir props `expandedModuloId`/`editingContenidoId` desde URL params y pasarlos a los modulos |
| `ModuloInlineEditor.tsx` | Inicializar `isOpen` desde prop `defaultOpen` y sincronizar cambios a URL via callback `onExpandChange` |
| `ContenidoInlineEditor.tsx` | Inicializar `showEditor` desde prop `defaultEditing` y sincronizar a URL via callback `onEditingChange` |

### Detalle Tecnico

**LMSCursoEditor.tsx**:
- Usar `useSearchParams` para leer/escribir `?tab=`
- Pasar `searchParams` y `setSearchParams` al `TabEstructura` para que gestione `&modulo=` y `&contenido=`

**TabEstructura.tsx**:
- Leer `modulo` y `contenido` de searchParams
- Pasar `defaultOpen={modulo.id === expandedModuloId}` a cada `ModuloInlineEditor`
- Cuando un modulo se expande/colapsa, actualizar `?modulo=`

**ModuloInlineEditor.tsx**:
- Recibir `defaultOpen` y `onExpandChange(id, isOpen)`
- Cuando un contenido entra/sale de edicion, llamar `onEditingChange(contenidoId)`

**ContenidoInlineEditor.tsx**:
- Recibir `defaultEditing` prop para inicializar `showEditor`
- Al abrir/cerrar editor, llamar `onEditingChange`

### Resultado

- El usuario copia un prompt de video, regresa a la pagina, y aterriza exactamente en Estructura > Modulo X > Contenido Y abierto
- La URL es compartible/bookmarkeable: `/lms/admin/cursos/abc/editar?tab=estructura&modulo=123&contenido=456`
- Consistente con el patron usado en Settings, Planning Hub y WhatsApp Kapso

