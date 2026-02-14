

## Rediseno del Funnel de Fidelidad - Trapecio Continuo (Validado con Research)

### Evaluacion: Propuesta original vs. Research vs. Imagen de referencia

Despues de investigar dashboards de loyalty/conversion funnels en Userpilot, Dribbble, y guias SaaS 2025-2026, la conclusion es:

- **Mi propuesta original** (bandas rectangulares con ancho decreciente) es funcional pero produce un efecto de "escalones separados" — mejor que el grid actual pero no tan fluido como tu imagen de referencia.
- **La imagen de referencia** usa un trapecio continuo donde cada etapa fluye visualmente a la siguiente, creando un embudo real.
- **El estandar de industria** confirma que los funnels mas efectivos usan formas trapezoidales con datos inline y colores por etapa.

### Diseno final: Trapecio continuo con CSS

Cada etapa del funnel es una seccion trapezoidal que se estrecha progresivamente, creando una silueta de embudo continua sin gaps entre secciones.

```text
Vista del componente:

  ┌────────────────────────────────────────────────┐
  │\  Sparkles   Nuevo         45          62%    /│  ← azul, mas ancho
  │ \____________________________________________/ │
  │  \  Activity  Activo       20          28%  /  │  ← gris
  │   \________________________________________/   │
  │    \  Shield   Leal         8          11% /   │  ← verde
  │     \____________________________________/     │
  │      \  Star   Promotor     4          6%/     │  ← ambar
  │       \________________________________/       │
  │        \  Crown  Embajador   2       3%/       │  ← purpura
  │         \____________________________/         │

  ┌──────────────────────────┐
  │ ⚠ 3 clientes en riesgo   │  ← card roja separada
  └──────────────────────────┘
```

### Implementacion tecnica

**Tecnica CSS - clip-path polygon:**

Cada seccion usa `clip-path: polygon(...)` para crear la forma trapezoidal. Los porcentajes de indentacion son progresivos:

```text
Etapa 1 (Nuevo):     polygon(0% 0%, 100% 0%, 97% 100%, 3% 100%)
Etapa 2 (Activo):    polygon(3% 0%, 97% 0%, 94% 100%, 6% 100%)
Etapa 3 (Leal):      polygon(6% 0%, 94% 0%, 91% 100%, 9% 100%)
Etapa 4 (Promotor):  polygon(9% 0%, 91% 0%, 88% 100%, 12% 100%)
Etapa 5 (Embajador): polygon(12% 0%, 88% 0%, 85% 100%, 15% 100%)
```

Cada seccion tiene `margin-top: -2px` para que se solapen ligeramente y creen continuidad visual (sin gaps blancos).

**Contenido dentro de cada seccion:**
- Flex row: Icono + Label (izquierda) | Count bold (centro) | Porcentaje (derecha)
- Texto blanco sobre fondo de color con gradiente sutil
- Padding vertical suficiente para area clickeable (~44px altura)

**Interactividad:**
- Hover: brightness sube (`hover:brightness-110`) + cursor pointer
- Selected: `ring-2 ring-white/40 z-10` sobre la seccion activa
- Transition suave: `transition-all duration-200`

**"En Riesgo" separado:**
- Card independiente debajo del funnel con fondo `bg-red-50 dark:bg-red-950/30`
- Icono AlertTriangle + count + "clientes requieren atencion"
- Clickeable con el mismo `onStageClick`

### Colores con gradiente por etapa

| Etapa | Gradiente |
|-------|-----------|
| Nuevo | `from-blue-500 to-blue-600` |
| Activo | `from-slate-400 to-slate-500` |
| Leal | `from-green-500 to-green-600` |
| Promotor | `from-amber-500 to-amber-600` |
| Embajador | `from-purple-500 to-purple-600` |

### Responsive

- Desktop: clip-path con indentaciones del 3% progresivo
- Mobile (< sm): indentaciones reducidas al 2% para maximizar espacio de texto; font-size se reduce a `text-xs`

### Archivo a modificar

Solo `src/pages/CustomerSuccess/components/CSLoyaltyFunnel.tsx` — cambio puramente visual.

No se modifica ningun hook, edge function, ni componente padre. La interfaz `Props` (onStageClick, selectedStage) permanece identica.

### Por que este diseno es superior

1. **Vs. grid actual**: Comunica visualmente la metafora de embudo; el grid es un chart de Excel
2. **Vs. bandas rectangulares separadas**: El trapecio continuo fluye como un embudo real; las bandas separadas parecen cards apiladas
3. **Vs. imagen de referencia**: Replica la misma estetica de trapecio continuo con colores por etapa y datos inline
4. **Industria**: Alineado con los patrones de Userpilot y los disenos top de Dribbble para funnel charts

