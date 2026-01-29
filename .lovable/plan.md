
# Análisis Detallado: Bugs en ShiftServicesMap

## Problema 1: Marcadores Desplazados Erróneamente

### Diagnóstico del Origen

El bug ocurre porque hay un **conflicto de CSS transforms** entre Mapbox y los efectos de hover, a pesar del intento de corrección previo con estructura anidada.

#### Análisis del Código Actual (líneas 46-93)

```typescript
// Estructura actual - PROBLEMÁTICA
const markerRoot = document.createElement('div');
markerRoot.style.cssText = `
  width: 36px;
  height: 36px;
  position: relative;  // ← Problema: position: relative puede interferir
`;

const bubble = document.createElement('div');
bubble.style.cssText = `
  ...
  ${isSelected ? 'transform: scale(1.3); z-index: 100;' : ''}  // ← Problema: z-index inline
  ${servicio.estadoVisual === 'en_sitio' ? 'animation: pulse-ring 2s infinite;' : ''}  // ← Problema: animation en mismo elemento
`;
```

#### Causas Raíz Identificadas

1. **El `markerRoot` tiene `position: relative`**: Esto puede interferir con el posicionamiento de Mapbox que usa `position: absolute` con `translate3d`.

2. **`z-index` aplicado en el elemento incorrecto**: El `z-index: 100` está en el `bubble` pero debería estar en el `markerRoot` para que Mapbox lo respete correctamente.

3. **Animación CSS en el mismo elemento que hace hover**: La animación `pulse-ring` modifica `box-shadow`, y al combinarse con los cambios de hover, puede crear comportamientos inesperados en algunos navegadores.

4. **Falta `will-change: transform`**: Sin esta declaración, el navegador puede no optimizar correctamente las capas de renderizado.

#### Patrón Correcto (Referencia: NationalMap.tsx línea 203-206)

```typescript
// NationalMap - NO tiene efectos hover que muevan markers
// Comentario explícito: "Sin efectos hover que puedan mover los markers"
el.style.cssText = `
  ...
  transition: transform 0.2s ease;  // Solo define transition, pero no la aplica
`;
```

### Solución Propuesta

```typescript
// markerRoot - Controlado por Mapbox, SIN transforms propios
const markerRoot = document.createElement('div');
markerRoot.className = 'shift-marker-root';
markerRoot.style.cssText = `
  width: 36px;
  height: 36px;
  /* SIN position: relative - Mapbox maneja el posicionamiento */
`;

// bubble - Elemento visual aislado
const bubble = document.createElement('div');
bubble.className = 'shift-marker-bubble';
bubble.style.cssText = `
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  ...
  transform-origin: center center;
  will-change: transform;  /* Optimización de renderizado */
  backface-visibility: hidden;  /* Evita glitches de rendering */
`;

// Animación pulse en elemento separado o usar pseudo-elementos via CSS class
```

---

## Problema 2: Leyenda Superpuesta al Menú Lateral

### Diagnóstico del Origen

La leyenda está posicionada con `absolute` relativo al Card, pero el Card **NO tiene `position: relative`**, lo que causa que la leyenda se posicione relativa al ancestro posicionado más cercano (potencialmente el layout principal).

#### Código Problemático (líneas 268-285)

```tsx
return (
  <Card className={`overflow-hidden ${className || 'h-[400px]'}`}>
    {/* Legend - usando position: absolute */}
    <div className="absolute bottom-4 left-4 z-10 ...">
      ...
    </div>
    
    <div ref={mapContainer} className="w-full h-full" />
  </Card>
);
```

#### Análisis del Componente Card (card.tsx)

```tsx
// Card NO tiene position: relative por defecto
const Card = (...) => (
  <div
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
  />
)
```

**El problema**: Cuando un elemento hijo tiene `position: absolute`, busca el ancestro posicionado más cercano. Como `Card` no tiene `position: relative`, la leyenda puede posicionarse respecto al viewport o al layout padre (`main` en UnifiedLayout), causando que aparezca sobre el sidebar.

#### Contexto del Layout (UnifiedLayout.tsx líneas 70-84)

```tsx
<div className="flex w-full min-h-[calc(100vh-3rem)]">
  <UnifiedSidebar stats={sidebarStats} />  {/* Sidebar a la izquierda */}
  
  <main className="flex-1 overflow-auto">  {/* Contenido principal */}
    {children}
  </main>
</div>
```

El `z-10` de la leyenda puede no ser suficiente si el sidebar tiene un `z-index` más bajo o si la leyenda está escapando del contexto del Card.

### Solución Propuesta

```tsx
// Agregar position: relative al Card para crear contexto de posicionamiento
<Card className={`overflow-hidden relative ${className || 'h-[400px]'}`}>
  {/* Legend - ahora será relativa al Card */}
  <div className="absolute bottom-4 left-4 z-10 ...">
    ...
  </div>
  
  <div ref={mapContainer} className="w-full h-full" />
</Card>
```

---

## Resumen de Cambios

| Archivo | Cambio | Impacto |
|---------|--------|---------|
| `ShiftServicesMap.tsx` | Agregar `relative` al className del Card | Contiene la leyenda dentro del mapa |
| `ShiftServicesMap.tsx` | Remover `position: relative` del markerRoot | Evita interferencia con Mapbox |
| `ShiftServicesMap.tsx` | Agregar `position: absolute; top: 0; left: 0` al bubble | Posiciona correctamente dentro del root |
| `ShiftServicesMap.tsx` | Agregar `will-change: transform; backface-visibility: hidden` | Optimiza renderizado de animaciones |
| `ShiftServicesMap.tsx` | Separar animación pulse a un pseudo-elemento o elemento adicional | Evita conflicto entre animation y transform |

---

## Implementación Detallada

### Cambio 1: Card con position relative

```tsx
// Línea 268 - Antes
<Card className={`overflow-hidden ${className || 'h-[400px]'}`}>

// Después
<Card className={`overflow-hidden relative ${className || 'h-[400px]'}`}>
```

### Cambio 2: Estructura de Marcadores Optimizada

```typescript
// createMarkerElement - Nueva implementación

// Root: Solo dimensiones, Mapbox controla posición
const markerRoot = document.createElement('div');
markerRoot.className = 'shift-marker-root';
markerRoot.style.cssText = `
  width: 36px;
  height: 36px;
`;

// Bubble: Posicionamiento absoluto dentro del root
const bubble = document.createElement('div');
bubble.className = 'shift-marker-bubble';
bubble.style.cssText = `
  position: absolute;
  top: 0;
  left: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: white;
  border: 3px solid ${config.border};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  transform-origin: center center;
  will-change: transform;
  backface-visibility: hidden;
  ${isFiltered ? 'opacity: 0.3;' : ''}
  ${isSelected ? 'transform: scale(1.3);' : ''}
`;

// Pulse ring: Elemento separado para la animación (si es en_sitio)
if (servicio.estadoVisual === 'en_sitio') {
  const pulseRing = document.createElement('div');
  pulseRing.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    animation: pulse-ring 2s infinite;
    pointer-events: none;
  `;
  markerRoot.appendChild(pulseRing);
}

// Z-index en el root, no en el bubble
if (isSelected) {
  markerRoot.style.zIndex = '100';
}

bubble.appendChild(iconWrapper);
markerRoot.appendChild(bubble);
```

### Cambio 3: Hover Effects Seguros

```typescript
// Los eventos modifican solo bubble.style.transform
// El root permanece intacto
markerRoot.addEventListener('mouseenter', () => {
  if (!isFiltered) {
    bubble.style.transform = isSelected ? 'scale(1.4)' : 'scale(1.15)';
    bubble.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  }
});

markerRoot.addEventListener('mouseleave', () => {
  bubble.style.transform = isSelected ? 'scale(1.3)' : 'scale(1)';
  bubble.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
});
```

---

## Diagrama de Arquitectura de Marcadores

```text
                    Mapbox Controls Position
                           ↓
┌──────────────────────────────────────────────────┐
│  markerRoot (shift-marker-root)                  │
│  ├── width: 36px, height: 36px                   │
│  ├── NO position, NO transform                   │
│  └── Mapbox applies: transform: translate3d()    │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  pulseRing (solo si en_sitio)              │  │
│  │  ├── position: absolute, top: 0, left: 0   │  │
│  │  ├── animation: pulse-ring                 │  │
│  │  └── pointer-events: none                  │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  bubble (shift-marker-bubble)              │  │
│  │  ├── position: absolute, top: 0, left: 0   │  │
│  │  ├── transform: scale() ← Solo esto cambia │  │
│  │  ├── will-change: transform                │  │
│  │  └── backface-visibility: hidden           │  │
│  │                                            │  │
│  │  ┌────────────────────────────────────┐    │  │
│  │  │  iconWrapper                       │    │  │
│  │  │  └── SVG icon                      │    │  │
│  │  └────────────────────────────────────┘    │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## Riesgos y Mitigación

| Riesgo | Mitigación |
|--------|------------|
| La animación pulse puede seguir causando parpadeos | Elemento separado con `pointer-events: none` |
| El z-index podría no funcionar en todos los navegadores | Aplicar al root que tiene stacking context |
| Performance con muchos marcadores | `will-change` pre-optimiza, limitar a 50 marcadores visibles |

---

## Pruebas Recomendadas Post-Implementación

1. Hover sobre marcadores - verificar que no se desplacen
2. Click en marcador seleccionado - verificar que el flyTo funcione
3. Verificar que la leyenda esté contenida dentro del mapa
4. Probar en móvil - la leyenda no debe tapar contenido
5. Verificar animación pulse en marcadores "Posicionado"
