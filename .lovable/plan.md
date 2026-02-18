

# Mejoras al modulo Customer Success: Asignacion inversa, touchpoint en cartera, y filtros de analisis

## 1. Submodulo "Asignar Clientes a CSM" en Cartera

**Problema**: Actualmente solo se puede asignar un CSM a un cliente individualmente desde el dropdown en la tabla, lo cual es repetitivo cuando quieres asignar muchos clientes a un mismo CSM.

**Solucion**: Agregar un boton "Asignar por CSM" que abra un modal con flujo inverso:
- Paso 1: Seleccionar un CSM del dropdown
- Paso 2: Mostrar lista de clientes sin CSM asignado (o con otro CSM), con checkboxes para seleccion multiple
- Paso 3: Boton "Asignar X clientes" que use el hook `useBulkAssignCSM` existente

Se agregara como un boton nuevo en la barra superior de CSCartera, junto al boton existente de "Mi Cartera".

## 2. Fecha del ultimo touchpoint en la tarjeta del cliente (Cartera)

**Problema**: En la tabla de cartera no se ve cuando fue el ultimo touchpoint de CS, solo se ve "Dias sin contacto" que combina servicios y touchpoints.

**Solucion**: 
- El hook `useCSCartera` ya calcula `lastTp` (ultimo touchpoint) pero no lo expone en la interfaz `CarteraCliente`
- Agregar campo `ultimo_touchpoint: string | null` al tipo `CarteraCliente` y exponerlo desde el hook
- Agregar una columna "Ult. TP" en la tabla de cartera que muestre la fecha formateada

## 3. Ampliar Analisis de Clientes con filtros de dias (90-120-180-360)

**Problema**: El modulo de Analisis Clientes actualmente filtra por MTD/QTD/YTD/Custom, pero no tiene filtros predefinidos de ventanas de dias (ultimos 90, 120, 180, 360 dias) que son mas utiles para CS. Ademas, la tabla solo muestra Top 15 clientes.

**Solucion**:
- Agregar opciones de filtro de dias al selector de periodo: "Ultimos 90 dias", "Ultimos 120 dias", "Ultimos 180 dias", "Ultimos 360 dias"
- Cambiar el tipo `DateFilterType` para incluir: `'last_90d' | 'last_120d' | 'last_180d' | 'last_360d'`
- En el calculo de `dateRange`, agregar los casos correspondientes usando `subDays`
- Eliminar el limite de Top 15 y mostrar todos los clientes (con paginacion)

---

## Detalles tecnicos

### Archivos a modificar

1. **`src/pages/CustomerSuccess/components/CSCartera.tsx`**
   - Agregar boton "Asignar por CSM" en la barra superior
   - Crear componente `CSBulkAssignByCSMModal` inline o en archivo separado
   - Agregar columna "Ult. TP" a la tabla

2. **`src/hooks/useCSCartera.ts`**
   - Agregar campo `ultimo_touchpoint` al tipo `CarteraCliente`
   - Exponer la fecha del ultimo touchpoint (ya se calcula como `lastTp`)

3. **`src/components/executive/ClientAnalytics.tsx`**
   - Ampliar `DateFilterType` con `'last_90d' | 'last_120d' | 'last_180d' | 'last_360d'`
   - Agregar las opciones correspondientes al `Select` de periodo
   - Calcular los rangos de fecha con `subDays`
   - Remover el `.slice(0, 15)` y agregar paginacion

### Archivo nuevo

4. **`src/pages/CustomerSuccess/components/CSBulkAssignByCSMModal.tsx`**
   - Modal con selector de CSM + lista de clientes con checkboxes
   - Reutiliza `useCSMOptions` y `useBulkAssignCSM` existentes
   - Filtra clientes de `useCSCartera` para mostrar los disponibles

### Sin cambios de base de datos
Toda la data necesaria ya existe. Solo son cambios de frontend.

