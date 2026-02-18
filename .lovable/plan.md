

# Neutralizar zoom 0.7 en el Modulo de Seguridad

## Diagnostico

El `html { zoom: 0.7 }` global (linea 153 de `index.css`) reduce todo al 70%. Para compensar, el mapa usa `zoom: 1.4286` con `width/height: 70%` y multiples `resize()` con timeouts -- un stack de hacks fragil que:
- Impide que Mapbox calcule correctamente el canvas
- Desperdicia ~30% del espacio vertical real
- Hace que las alturas `calc(100vh - Xpx)` sean incorrectas (100vh ya esta escalado)
- Las capas (tramos, POIs, zonas sin cobertura) no se renderizan bien

## Solucion

Aplicar `zoom: calc(1 / 0.7)` en el wrapper de `SecurityPage` para que todo dentro opere a escala real (0.7 * 1.4286 = 1.0). Luego:
- Eliminar TODOS los hacks de zoom del mapa
- Usar alturas naturales (100vh ya es real)
- El mapa ocupa su contenedor al 100% nativo

---

## Cambios por archivo

### 1. `src/pages/Security/SecurityPage.tsx`

Envolver todo el contenido en un div con `zoom: 1.4286` para neutralizar el 0.7 global. Ajustar alturas a valores reales (ya no necesitan compensacion):

```tsx
return (
  <div style={{ zoom: 1 / 0.7 }} className="space-y-4">
    {/* Header */}
    <div>
      <h1 className="text-xl font-bold ...">Modulo de Seguridad</h1>
      <p className="text-xs ...">...</p>
    </div>

    <Tabs ...>
      <TabsList className="grid w-full grid-cols-5 h-9">
        {/* tabs con texto mas compacto ya que estamos a escala real */}
      </TabsList>

      <TabsContent value="routes" className="mt-3 h-[calc(100vh-130px)]">
        <RouteRiskIntelligence />
      </TabsContent>
      ...
    </Tabs>
  </div>
);
```

Reducir ligeramente los tamaños de texto/iconos ya que ahora estan a escala 1:1 (antes el zoom 0.7 los hacia mas pequenos).

### 2. `src/components/security/map/RiskZonesMap.tsx`

**Eliminar todos los hacks de zoom**. El mapa ahora opera en un contexto sin zoom, asi que solo necesita llenar su contenedor:

- Quitar el div "clip wrapper" con `overflow-hidden`
- Quitar los estilos `zoom: 1.4286`, `width: 70%`, `height: 70%`
- El `mapContainer` pasa a ser simplemente `className="w-full h-full rounded-lg"`
- Mantener un solo `m.resize()` en el load (sin timeouts escalonados)
- La leyenda permanece como overlay absoluto normalmente

```tsx
return (
  <div className="relative w-full h-full">
    {loading && <Loader />}
    <div ref={mapContainer} className="w-full h-full rounded-lg" />
    {mapReady && <Legend />}
  </div>
);
```

### 3. `src/components/security/routes/RouteRiskIntelligence.tsx`

Ajustar la altura del grid a un valor que funcione sin compensacion de zoom:

```tsx
<div className="grid ... h-[calc(100vh-130px)] min-h-[400px]">
```

(Antes usaba `100vh-200px` que con el zoom 0.7 era incorrecto)

### 4. `src/components/security/map/RiskZonesHeader.tsx`

Sin cambios estructurales necesarios -- ya esta compacto. Solo ajustar tamaños de texto/icono si se ven demasiado grandes a escala real.

---

## Resultado esperado

- Mapa al 100% de su contenedor sin hacks
- Capas (tramos, POIs, zonas sin cobertura, puntos seguros) visibles correctamente
- Todo el espacio vertical aprovechado
- Codigo mas simple y mantenible (sin compensaciones de zoom)
- El resto de la app sigue con zoom 0.7 sin afectarse

## Archivos a modificar

1. `src/pages/Security/SecurityPage.tsx` -- Wrapper con `zoom: 1/0.7`, ajustar tamaños
2. `src/components/security/map/RiskZonesMap.tsx` -- Eliminar hacks de zoom, mapa nativo
3. `src/components/security/routes/RouteRiskIntelligence.tsx` -- Ajustar alturas

