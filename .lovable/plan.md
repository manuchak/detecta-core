

## Análisis del Feedback de Osvaldo

**Lo que dice Osvaldo:** La explicación actual del ciclo de pago en la ficha del cliente usa un ejemplo dinámico basado en "hoy", lo cual cambia constantemente. Pide que la regla se exprese de forma fija: *"Facturas al día 15, se pagan el día 7 del mes inmediato siguiente"*.

**Estado actual del código:** La lógica de cálculo (`calcularFechaVencimientoReal`) ya es correcta — cuando `dia_pago < dia_corte`, efectivamente calcula el pago en el mes siguiente al corte. El problema es solo la **explicación textual** en `explicarCicloPago()`, que muestra un ejemplo con la fecha de hoy que cambia diario.

---

### Respuesta sugerida para Osvaldo:

> Osvaldo, tienes razón. La lógica del motor de cálculo ya contempla correctamente que si el día de pago (7) es menor al día de corte (15), el pago cae en el mes siguiente al corte. Lo que vamos a corregir es la explicación visual en la ficha del cliente para que muestre la regla fija y clara:
>
> *"Corte día 15 → Pago día 7 del mes siguiente"*
>
> Sin depender de la fecha actual. Opcionalmente agregamos un ejemplo estático ilustrativo (ej: "Factura emitida el 10/Ene → Corte 15/Ene → Pago 7/Feb").

---

### Plan de Implementación

**Archivo:** `src/utils/calcularVencimiento.ts` — función `explicarCicloPago`

Cambiar la explicación de dinámica a **regla fija + ejemplo estático ilustrativo**:

```
Antes:
"Facturas emitidas hasta el día 15 del mes se pagan el día 7 del mes siguiente.
 Ejemplo: emitida hoy (12/03) → vence 07/04 (26 días reales)."

Después:
"Corte día 15 → Pago día 7 del mes siguiente al corte.
 Ejemplo: Factura del 10/Ene → Corte 15/Ene → Pago 7/Feb."
```

La regla fija usa un ejemplo con meses ficticios (Ene/Feb) que nunca cambia y es fácil de entender. Se eliminará la dependencia de `new Date()`.

**Lógica para el texto del ejemplo estático:**
- Si `dia_pago > dia_corte`: "Pago día X del mismo mes del corte" + ejemplo dentro del mismo mes
- Si `dia_pago <= dia_corte`: "Pago día X del mes siguiente al corte" + ejemplo cruzando mes

Solo se modifica la función `explicarCicloPago` (~15 líneas). El motor de cálculo no cambia.

