

# Hacer Performance la pestaña principal del módulo de Monitoreo

## Cambios

### 1. Cambiar el tab por defecto a "performance" (`MonitoringPage.tsx`)

- **Línea 40**: Cambiar la lógica de `activeTab` para que cuando no hay `tab` en la URL, el valor por defecto sea `'performance'` en vez de `'posicionamiento'`.

Antes:
```
tabFromUrl === 'performance' ? 'performance' : 'posicionamiento'
```

Después:
```
tabFromUrl || 'performance'
```

(Se simplifica toda la cadena ternaria ya que cualquier valor válido en la URL se respeta, y sin parámetro cae a `'performance'`.)

### 2. Reordenar las pestañas visualmente (`MonitoringPage.tsx`)

Mover el `TabsTrigger` y `TabsContent` de "Performance" al primer lugar en la lista, seguido de Posicionamiento, Checklists, Adopción Digital e Incidentes.

Orden actual: Posicionamiento > Checklists > Adopción > Incidentes > Performance

Orden nuevo: **Performance** > Posicionamiento > Checklists > Adopción > Incidentes

### 3. Actualizar título y descripción del header

Cambiar el título de "Control de Posicionamiento" a algo más general como "Centro de Monitoreo", ya que ahora la vista principal es Performance y el título actual solo aplica a una pestaña.

## Por qué NO drag & drop de tabs

- Solo hay 5 pestañas — el beneficio de reordenar es marginal
- Requiere persistencia por usuario (localStorage o BD), manejo de nuevas pestañas futuras, y sincronización con la URL
- Agrega complejidad de mantenimiento desproporcionada al valor que aporta
- La solución simple (reordenar estáticamente) resuelve el problema real: que Performance sea lo primero que se ve

## Archivo afectado

`src/pages/Monitoring/MonitoringPage.tsx` — cambios en default tab, orden de TabsTrigger/TabsContent, y texto del header.

