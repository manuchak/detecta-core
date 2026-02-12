

## Persistencia de pestana activa en Perfil Operativo

### Problema

Cuando trabajas en la pestana "Docs" (u otra) y abres una imagen o navegas fuera, al regresar el perfil se remonta y vuelve a "Informacion" porque la pestana activa no se guarda en la URL.

### Solucion

Aplicar el mismo patron de persistencia por URL que ya existe en otros modulos (Settings, Planning Hub, WhatsApp Kapso, etc.): usar `useSearchParams` para sincronizar la pestana activa con el parametro `?tab=` de la URL.

### Cambio

**Archivo: `src/pages/PerfilesOperativos/PerfilForense.tsx`**

1. Importar `useSearchParams` (ya se importa `useLocation` de react-router-dom)
2. Leer el parametro `tab` de la URL, con fallback a `"info"`
3. Cambiar `Tabs` de `defaultValue` a `value` controlado
4. Agregar `onValueChange` que actualice el searchParam `tab`

Resultado: la URL pasara de `/perfiles-operativos/custodio/61f...` a `/perfiles-operativos/custodio/61f...?tab=documentacion` y al regresar de ver una imagen, la pestana se restaurara automaticamente.

### Detalle tecnico

```typescript
// Agregar useSearchParams
const [searchParams, setSearchParams] = useSearchParams();
const activeTab = searchParams.get('tab') || 'info';

const handleTabChange = (value: string) => {
  setSearchParams({ tab: value }, { replace: true });
};

// Cambiar Tabs
<Tabs value={activeTab} onValueChange={handleTabChange}>
```

No se requieren cambios en ningun otro archivo. El patron es identico al ya establecido en el proyecto.

