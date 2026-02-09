

# Fix: TV Dashboard no ocupa 100% de la pantalla

## Causa raiz

El archivo `src/index.css` (linea 153) aplica `html { zoom: 0.7 }` globalmente. Esto reduce TODO el contenido al 70% del tamano fisico de la pantalla. Cuando el TV Dashboard usa `h-screen w-screen`, esas medidas CSS se calculan correctamente pero el resultado visual se encoge al 70%, dejando ~30% de espacio blanco a la derecha y abajo.

El sistema de compensacion (`--vh-full: calc(100vh * 1.4286)`) existe para otros modulos pero el TV Dashboard no lo usa — y no deberia, porque la solucion correcta es anular el zoom para esta pagina.

## Solucion

### 1. `src/pages/Monitoring/MonitoringTVPage.tsx`

Agregar un `useEffect` que al montar la pagina cambie `document.documentElement.style.zoom = '1'` y lo restaure a `'0.7'` al desmontar. Esto asegura que SOLO esta pagina se renderice al 100% del tamano fisico.

```typescript
// Override global zoom for TV fullscreen
useEffect(() => {
  const html = document.documentElement;
  const original = html.style.zoom;
  html.style.zoom = '1';
  return () => { html.style.zoom = original; };
}, []);
```

### 2. `src/components/monitoring/tv/TVServicesList.tsx`

Sin cambios adicionales — los nombres ya se muestran completos con el rediseno previo.

### 3. `src/components/monitoring/tv/TVMapDisplay.tsx`

Sin cambios — el ResizeObserver ya recalcula las dimensiones. Al cambiar el zoom a 1, el mapa automaticamente se expandira para llenar el contenedor.

## Resultado esperado

- El dashboard ocupara el 100% de la pantalla de 50 pulgadas
- El mapa llenara completamente su area asignada (8/12 columnas)
- La lista de servicios llenara las 4/12 columnas restantes
- Al volver a otra pagina del sistema, el zoom regresa a 0.7
- No afecta ningun otro modulo del sistema

## Riesgo

Ninguno. El efecto se limita al ciclo de vida del componente MonitoringTVPage.
