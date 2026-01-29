
# Plan: Reubicar Widget de Clima Debajo del Mapa

## Objetivo
Posicionar el widget de clima en una ubicación fija debajo del mapa para garantizar su visibilidad inmediata, siguiendo mejores prácticas de jerarquía visual y relevancia contextual.

## Cambio Propuesto

### Layout Actual
```
[Mapa 2/3]        [Lista 1/3]
[Clima] [Alertas] ← Al final, puede quedar fuera del viewport
```

### Layout Nuevo
```
[Mapa 2/3]        [Lista 1/3]
[Clima]           [continúa...]
─────────────────────────────
[Alertas de Ruta - full width]
```

## Archivo a Modificar

**`src/pages/Monitoring/MonitoringPage.tsx`**

### Cambios Específicos

1. Mover `WeatherWidget` dentro del contenedor del mapa (línea 73-81)
2. Mantener `TwitterFeed` en sección separada (full width)
3. Ajustar el espaciado para mantener consistencia visual

### Código Resultante

```tsx
{/* Main content */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Map column - takes 2/3 on large screens */}
  <div className="lg:col-span-2 space-y-4">
    <ShiftServicesMap 
      servicios={servicios}
      className="h-[450px] lg:h-[500px]"
      onServiceClick={handleServiceClick}
      selectedServiceId={selectedService}
      filterEstado={filterEstado}
    />
    {/* Weather Widget - Ahora debajo del mapa */}
    <WeatherWidget />
  </div>

  {/* Side panel - services list */}
  <div className="lg:col-span-1">
    <ShiftServicesTable 
      servicios={servicios}
      onServiceClick={handleServiceClick}
      selectedServiceId={selectedService}
      filterEstado={filterEstado}
      onFilterChange={setFilterEstado}
    />
  </div>
</div>

{/* Alertas de Ruta - Sección separada */}
<TwitterFeed />
```

## Beneficios

| Aspecto | Mejora |
|---------|--------|
| Visibilidad | El clima siempre visible junto al mapa |
| Contexto | Relación visual clima-geografía |
| UX | Usuario no necesita hacer scroll para ver condiciones |
| Jerarquía | Mapa > Clima > Alertas (orden de criticidad) |

## Consideraciones Técnicas

- Sin cambios en componentes individuales
- Solo reorganización del layout en `MonitoringPage.tsx`
- El `TwitterFeed` pasa a ocupar ancho completo, dándole más espacio para mostrar alertas
- Responsive: En móvil, el orden será Mapa → Clima → Lista → Alertas (stack vertical)

## Tiempo Estimado
5 minutos de implementación
