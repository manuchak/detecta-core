
# Fix: Persistencia completa del sub-tab Kapso

## Problema encontrado

Hay un bug en **dos lugares** de `Settings.tsx` donde `setSearchParams({ tab: value })` usa un objeto plano que **reemplaza todos los query params**, eliminando `kapsoTab` de la URL.

### Lineas afectadas:

1. **Linea 21** - `handleTabChange`: Al hacer click en cualquier tab, borra `kapsoTab`
2. **Linea 27** - `useEffect` de sincronizacion: Al regresar desde el sidebar (sin params en URL), restaura `tab` desde localStorage pero borra `kapsoTab` de sessionStorage/URL

### Ademas:

El `sessionStorage` de KapsoConfig pierde el valor `kapsoTab` porque cuando `KapsoConfig` se monta, lee `kapsoTab` de la URL (que ya fue borrado por Settings) y obtiene `null`, cayendo al default `'conexion'`.

## Solucion

Cambiar ambos `setSearchParams` en `Settings.tsx` para **preservar los params existentes** usando `new URLSearchParams(searchParams)` en vez de un objeto plano. Tambien guardar y restaurar `kapsoTab` desde `sessionStorage` en el `useEffect`.

## Cambios

### Archivo: `src/pages/Settings/Settings.tsx`

**handleTabChange (linea 19-22):**
```text
// Antes
const handleTabChange = (value: string) => {
  localStorage.setItem(SETTINGS_TAB_KEY, value);
  setSearchParams({ tab: value }, { replace: true });
};

// Despues
const handleTabChange = (value: string) => {
  localStorage.setItem(SETTINGS_TAB_KEY, value);
  const newParams = new URLSearchParams(searchParams);
  newParams.set('tab', value);
  setSearchParams(newParams, { replace: true });
};
```

**useEffect de sincronizacion (linea 25-29):**
```text
// Antes
React.useEffect(() => {
  if (!searchParams.get('tab') && activeTab !== 'ia') {
    setSearchParams({ tab: activeTab }, { replace: true });
  }
}, []);

// Despues
React.useEffect(() => {
  if (!searchParams.get('tab') && activeTab !== 'ia') {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', activeTab);
    // Restaurar kapsoTab desde sessionStorage si existia
    const savedKapsoTab = sessionStorage.getItem('kapso-active-tab');
    if (activeTab === 'kapso' && savedKapsoTab) {
      newParams.set('kapsoTab', savedKapsoTab);
    }
    setSearchParams(newParams, { replace: true });
  }
}, []);
```

Solo se modifica 1 archivo. El resultado es que al navegar a `/settings` desde el sidebar, la URL se reconstruye como `/settings?tab=kapso&kapsoTab=templates` usando los valores guardados.
