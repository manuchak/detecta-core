

# Análisis Fishbone: Tooltip desplazado a la derecha en gráficos móviles

## Diagrama Ishikawa (Causa-Raíz)

```text
                                    Tooltip desplazado
                                    a la derecha en móvil
                                           │
          ┌────────────────┬───────────────┼───────────────┬──────────────┐
          │                │               │               │              │
     CSS Zoom 0.7     Recharts       Viewport          Contenedor    Touch Events
          │            Interno          Móvil              │              │
          │                │               │               │              │
    ┌─────┴─────┐    ┌────┴────┐    ┌─────┴─────┐   ┌────┴────┐   ┌────┴────┐
    │ html      │    │Tooltip  │    │Coordenadas│   │MobileChart│  │Touch vs │
    │ zoom:0.7  │    │calcula  │    │del touch  │   │Block     │  │Mouse    │
    │ desplaza  │    │posición │    │se escalan │   │reduce    │  │offset   │
    │ coord.    │◄───│con coord│    │por zoom   │   │altura    │  │diferente│
    │ sistema   │    │CSS sin  │    │pero SVG   │   │h-[220px] │  │         │
    │           │    │compensar│    │no lo sabe │   │          │  │         │
    └───────────┘    └─────────┘    └───────────┘   └─────────┘  └─────────┘
         ★ RAÍZ
```

## Causa Raíz Identificada

**`html { zoom: 0.7 }` en `src/index.css` línea 152-154.**

Recharts calcula la posición del tooltip usando `getBoundingClientRect()` y las coordenadas del evento táctil/mouse. Cuando CSS `zoom: 0.7` está activo, las coordenadas del DOM se escalan por 0.7 pero las coordenadas del evento touch/mouse reportan valores en el viewport real (sin compensar). Esto genera un desplazamiento de ~43% (1/0.7 - 1) hacia la derecha.

En desktop el efecto es menos notorio porque los gráficos son más anchos y el tooltip tiene más espacio. En móvil, con gráficos de ~350px, el desplazamiento de ~100-150px es muy evidente y saca el tooltip fuera del área visible.

## Solución Propuesta

**Desactivar `zoom: 0.7` en móvil.** El zoom de densidad fue diseñado para desktop; en móvil no aporta valor (la UI mobile ya tiene su propio diseño compacto).

### Cambio en `src/index.css`

Envolver `html { zoom: 0.7 }` en un media query que solo aplique en pantallas >= 768px:

```css
@media (min-width: 768px) {
  html {
    zoom: 0.7;
  }
}
```

Lo mismo para el fallback de Firefox con `transform: scale(0.7)`.

**Un solo archivo editado, un cambio quirúrgico que resuelve la raíz del problema sin afectar desktop.**

