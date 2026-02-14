

## Mover Configuración CS de Dialog a Pestaña del Módulo

### Cambio

Actualmente la configuración CS se abre en un Dialog modal. El objetivo es convertirla en una pestaña más del módulo CS, manteniendo el patrón de navegación por URL (`?tab=config`).

### Archivos a modificar

**`src/pages/CustomerSuccess/CustomerSuccessPage.tsx`**:

1. Agregar una quinta pestaña "Configuración" al TabsList con icono Settings
2. Agregar el TabsContent correspondiente que renderiza `<CSConfigPanel />`
3. Eliminar el botón de Settings del header (ya no se necesita el icono de engranaje)
4. Eliminar el Dialog de configuración y su estado (`showConfig`, `setShowConfig`)
5. Mantener el import de CSConfigPanel (ya existe)

### Resultado

- La pestaña se accede via `?tab=config` siguiendo el patrón existente de `useSearchParams`
- El componente `CSConfigPanel` se reutiliza tal cual (ya tiene tabs internas para Health Score y Funnel)
- Se elimina código del Dialog (simplificación)
- El botón de engranaje en el header desaparece ya que la config tiene su propia pestaña dedicada
