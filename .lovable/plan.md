
# Fix: Persistencia de Tab Interno en KapsoConfig

## Problema

El componente `KapsoConfig.tsx` (linea 108) usa:

```
<Tabs defaultValue="conexion">
```

Esto es un tab **no controlado** sin persistencia. Cada vez que navegas fuera de `/settings?tab=kapso` y regresas, el componente se remonta y el tab interno se reinicia a "Conexion", aunque estuvieras en "Templates" o "Webhook".

## Solucion

Convertir los tabs de `KapsoConfig` a **controlados** con persistencia dual (URL query param + sessionStorage), usando el mismo patron ya establecido en Settings y PlanningConfigurationTab.

## Cambios

### Archivo: `src/components/settings/KapsoConfig.tsx`

1. Importar `useSearchParams` de `react-router-dom`
2. Leer el sub-tab activo desde `searchParams.get('kapsoTab')` con fallback a `sessionStorage` y luego `'conexion'`
3. En `onValueChange`, guardar en sessionStorage y actualizar query param preservando los existentes (`tab=kapso`)
4. Cambiar `<Tabs defaultValue="conexion">` a `<Tabs value={activeKapsoTab} onValueChange={handleKapsoTabChange}>`

### Resultado esperado

La URL sera: `/settings?tab=kapso&kapsoTab=templates`

Al navegar a Meta y regresar, el tab se mantendra exactamente donde estabas.

### Detalle tecnico

```text
// Antes (linea 108)
<Tabs defaultValue="conexion" className="w-full">

// Despues
const KAPSO_TAB_KEY = 'kapso-active-tab';
const [searchParams, setSearchParams] = useSearchParams();
const activeKapsoTab = searchParams.get('kapsoTab')
  || sessionStorage.getItem(KAPSO_TAB_KEY)
  || 'conexion';

const handleKapsoTabChange = (value: string) => {
  sessionStorage.setItem(KAPSO_TAB_KEY, value);
  const newParams = new URLSearchParams(searchParams);
  newParams.set('kapsoTab', value);
  setSearchParams(newParams, { replace: true });
};

<Tabs value={activeKapsoTab} onValueChange={handleKapsoTabChange} className="w-full">
```

Solo se modifica 1 archivo. No hay dependencias nuevas.
