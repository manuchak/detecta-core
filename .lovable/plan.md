
# Persistencia de Tab Activo en Configuracion

## Problema

La pagina `/settings` usa `useState("ia")` para el tab activo. Cada vez que el usuario navega a otra seccion y regresa, el tab se reinicia a "Inteligencia Artificial" en lugar de mantener el ultimo tab visitado (ej: "WhatsApp Kapso").

## Solucion

Reemplazar `useState` con persistencia en la URL usando query parameters (`/settings?tab=kapso`). Esto es mas robusto que localStorage porque:
- Funciona con el boton de "atras" del navegador
- Se puede compartir el link directo a un tab
- No requiere limpieza

## Cambios

### Archivo: `src/pages/Settings/Settings.tsx`

1. Importar `useSearchParams` de `react-router-dom`
2. Leer el tab activo desde `searchParams.get('tab')` con fallback a `"ia"`
3. En `onValueChange`, actualizar el search param en vez de setState
4. Eliminar el `useState` actual

El resultado es que al navegar a `/settings?tab=kapso` y luego salir/regresar, el tab se mantiene. Tambien al hacer click en un tab, la URL se actualiza automaticamente.

## Detalle tecnico

```
// Antes
const [activeTab, setActiveTab] = useState("ia");

// Despues
const [searchParams, setSearchParams] = useSearchParams();
const activeTab = searchParams.get('tab') || 'ia';
const handleTabChange = (value: string) => {
  setSearchParams({ tab: value }, { replace: true });
};
```

Solo se modifica un archivo. No hay dependencias nuevas (`react-router-dom` ya esta instalado).
