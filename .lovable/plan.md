

# Analisis del Workflow de Liberacion — Boton "Liberar" No Se Habilita

## Problema Raiz Identificado

El boton "Liberar a Planificacion" tiene `disabled={isSaving || !gates.canLiberate}` (linea 1152). Se habilita **solo cuando no hay RED gates**. Tras analizar el codigo completo, hay 3 problemas:

### Bug 1: Gate RED de Licencia no considera tipo operativo Armado

```typescript
// Linea 413 — siempre evalua, incluso para Armado
if (!liberacion.documentacion_licencia) {
  red.push('Licencia faltante');
}
```

Para tipo `armado`, el campo `documentacion_licencia` mapea a "Portacion de Arma" (linea 176-178 del prefill), pero el gate siempre dice "Licencia faltante". Si supply no marca este checkbox porque el label dice "Licencia" y el custodio es armado, el boton queda bloqueado. **El gate debe adaptarse al tipo operativo.**

### Bug 2: Drafts persistidos en IndexedDB sobrescriben datos del servidor

El `usePersistedForm` con `hydrateOnMount: true` restaura drafts antiguos de IndexedDB. Si supply abrio el modal hace dias, un draft con `documentacion_ine: false` se rehidrata y sobreescribe el `initialLiberacion` del servidor. La logica en lineas 216-235 intenta manejar esto, pero si `hasDraft` es `true`, **preserva el draft viejo** sin importar que el servidor tenga datos actualizados.

Resultado: supply llena checkboxes, guarda, cierra, vuelve a abrir → el draft viejo se carga → checkboxes aparecen desmarcados → RED gates activos → boton deshabilitado.

### Problema 3: UX — No es claro que bloquea ni donde hacer clic

El resumen de gates (lineas 1117-1138) esta al fondo del scroll, despues de todos los accordions. Si hay bloqueos RED, el boton dice "Resolver bloqueos primero" en gris, pero el usuario no ve **cuales** son los bloqueos sin hacer scroll hasta abajo. No hay indicacion visual en el header ni near the button.

---

## Plan de Solucion

### 1. Corregir gate RED de licencia para tipo Armado

En el `useMemo` de gates (linea 401), cambiar:

```typescript
// ANTES
if (!liberacion.documentacion_licencia) {
  red.push('Licencia faltante');
}

// DESPUES
if (!liberacion.documentacion_licencia) {
  red.push(liberacion.tipo_operativo === 'armado' 
    ? 'Portación de arma faltante' 
    : 'Licencia de conducir faltante');
}
```

Y adaptar el label del checkbox en la seccion de documentacion (linea 720) para que muestre "Portacion de Arma" cuando `tipo_operativo === 'armado'`.

### 2. Resolver conflicto draft vs servidor

En la logica de hidratacion (lineas 216-235), cuando `hasDraft` es true, **merge** los valores del servidor que sean `true` con el draft (union, no sobreescritura). Si el servidor dice `documentacion_ine: true` pero el draft dice `false`, el servidor gana para booleanos `true`:

```typescript
if (hasDraft) {
  // Merge: server TRUE values always win over draft FALSE
  updateDraft(prev => ({
    ...prev,
    liberacion: {
      ...prev.liberacion,
      // Si el servidor tiene un campo TRUE, usarlo
      ...(initialLiberacion.documentacion_ine && { documentacion_ine: true }),
      ...(initialLiberacion.documentacion_licencia && { documentacion_licencia: true }),
      // etc para todos los campos booleanos del checklist
    }
  }));
}
```

### 3. Mejorar UX: Gate status visible junto al boton

Mover el resumen de gates al footer sticky, justo encima del boton de liberar, en formato compacto inline. Cuando hay RED gates, mostrar un banner rojo compacto con los bloqueos directamente sobre el boton:

```text
+------------------------------------------------+
| [sticky footer]                                 |
| 🔴 Bloqueos: INE faltante · Licencia faltante  |
| [Cancelar] [Guardar] [Resolver bloqueos primero]|
+------------------------------------------------+
```

Cuando todo esta ok (sin RED gates):
```text
+------------------------------------------------+
| [sticky footer]                                 |
| ✅ Sin bloqueos — listo para liberar            |
| ⚠️ 2 advertencias (se puede continuar)          |
| [Cancelar] [Guardar] [🚀 Liberar con advert.]  |
+------------------------------------------------+
```

Y cuando NO hay ni RED ni YELLOW:
```text
+------------------------------------------------+
| [sticky footer]                                 |
| ✅ Todos los requisitos completados             |
| [Cancelar] [Guardar] [🚀 Liberar a Planificación]|
+------------------------------------------------+
```

### 4. Indicadores de progreso en accordion headers

Agregar badge de estado (rojo/verde) en cada accordion trigger para que supply vea inmediatamente que seccion tiene issues sin necesidad de expandir:

- Documentacion: badge rojo si hay docs faltantes que son RED gate
- Contratos: badge amarillo si incompletos
- Capacitacion: badge amarillo si incompleta
- Estudio Socioeconomico: badge rojo si desfavorable, amarillo si pendiente

---

## Archivos a Modificar

| Archivo | Cambio |
|---|---|
| `LiberacionChecklistModal.tsx` | Fix gate licencia/armado, merge drafts con servidor, mover gate summary al footer, badges en accordions |

Un solo archivo, ~4 cambios localizados dentro del mismo componente.

