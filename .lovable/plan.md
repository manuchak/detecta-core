

# Fix: Persistencia de Tab en Configuracion de Planeacion

## Problema Real

La pagina que pierde el tab NO es `/settings` sino la **Configuracion de Planeacion** dentro del modulo de Planeacion. Hay dos niveles de tabs:

- **Nivel 1 (PlanningHub)**: Tabs "Dashboard", "Servicios", "Rutas", "Configuracion" -- YA tiene persistencia via URL (`?tab=config`)
- **Nivel 2 (PlanningConfigurationTab)**: Tabs "Custodios", "Armados", "Proveedores", **"Esquemas"**, "Sanciones", "Parametros", "Datos" -- usa `useState('zonas-custodios')` SIN persistencia

Cuando el usuario esta trabajando en el tab "Esquemas" llenando formularios de metas, al navegar a otra seccion y regresar, el tab exterior se mantiene en "Configuracion" pero el tab interior se reinicia a "Custodios".

## Solucion

Agregar persistencia al tab interior usando el mismo patron que ya funciona en PlanningHub: un **segundo query param** en la URL (`configTab`) con backup en `sessionStorage`.

La URL resultante sera: `/planeacion?tab=config&configTab=esquemas`

## Cambios

### Archivo: `src/pages/Planeacion/components/configuration/PlanningConfigurationTab.tsx`

1. Recibir `searchParams` y `setSearchParams` como props desde PlanningHub (o usar `useSearchParams` directamente)
2. Leer el tab activo desde `searchParams.get('configTab')` con fallback a sessionStorage y luego a `'zonas-custodios'`
3. En `onValueChange`, guardar en sessionStorage y actualizar el query param `configTab`
4. Preservar los query params existentes (especialmente `tab=config`) al actualizar

### Archivo: `src/pages/Planeacion/PlanningHub.tsx`

Sin cambios funcionales necesarios -- el componente hijo usara `useSearchParams` directamente.

## Detalle Tecnico

```text
// Antes (PlanningConfigurationTab.tsx)
const [activeTab, setActiveTab] = useState('zonas-custodios');

// Despues
const [searchParams, setSearchParams] = useSearchParams();
const activeTab = searchParams.get('configTab')
  || sessionStorage.getItem('planeacion_config_tab')
  || 'zonas-custodios';

const handleTabChange = (value: string) => {
  sessionStorage.setItem('planeacion_config_tab', value);
  const newParams = new URLSearchParams(searchParams);
  newParams.set('configTab', value);
  setSearchParams(newParams, { replace: true });
};
```

Se usa `new URLSearchParams(searchParams)` para preservar el param `tab=config` del padre. Solo se modifica 1 archivo.

