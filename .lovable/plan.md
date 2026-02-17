

## Corregir DataAuditManager para aceptar Excel con estructura de servicios_custodia

### Problema actual

El componente espera columnas pre-agregadas (Ano, Mes, Servicios, GMV) pero el Excel del usuario tiene registros individuales con estructura similar a `servicios_custodia`, donde `fecha_hora_cita` es el campo de fecha base.

### Solucion

Modificar `DataAuditManager.tsx` para soportar dos modos de Excel:

1. **Modo registros individuales (nuevo):** Detectar columna `fecha_hora_cita`, extraer ano/mes de cada registro, contar filas como servicios, y sumar `cobro_cliente` como GMV
2. **Modo agregado (existente):** Mantener compatibilidad con Excel que ya tiene columnas Ano/Mes/Servicios/GMV

### Cambios tecnicos en `src/components/administration/DataAuditManager.tsx`

**Deteccion de columnas con flexibilidad:**
- `fecha_hora_cita`: buscar variantes como "fecha hora cita", "fecha_hora_cita", "fecha cita", "appointment"
- `cobro_cliente`: buscar variantes como "cobro cliente", "cobro_cliente", "gmv", "ingreso", "cobro", "revenue"

**Parseo robusto de fechas:**
- Strings ISO (`2025-01-15T20:00:00`)
- Formato `dd/MM/yyyy` y `dd-MM-yyyy`
- Numeros seriales de Excel
- Objetos Date nativos de xlsx

**Logica de agregacion:**
- Agrupar registros por ano-mes extraido de `fecha_hora_cita`
- Contar registros por periodo = servicios
- Sumar `cobro_cliente` por periodo = GMV

**Flujo de decision:**
1. Leer headers del Excel
2. Buscar columna `fecha_hora_cita` (variantes)
3. Si existe: modo registros individuales (agregar en frontend)
4. Si no existe: buscar columnas Ano/Mes (modo actual)
5. Si ninguno: mostrar error con columnas detectadas

**UX mejorada:**
- Indicar que formato se detecto ("Se detectaron X registros individuales, agrupando por mes...")
- Mostrar mensaje descriptivo del archivo esperado incluyendo ambos formatos aceptados

