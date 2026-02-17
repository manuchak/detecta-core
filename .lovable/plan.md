

## Plan: Corregir fuente de datos + Herramienta de Auditoria Excel vs Sistema

### Problema raiz

El hook `useExecutiveMultiYearData` hace un `select` directo a `servicios_custodia` sin paginacion, lo que causa que Supabase devuelva maximo 1,000 filas. Con ~10,000+ servicios por ano, los totales mostrados en los charts son incorrectos (subreportados).

Ya existe un RPC server-side `get_historical_monthly_data` que agrega correctamente en la base de datos y devuelve totales exactos por mes/ano.

---

### Parte 1: Corregir useExecutiveMultiYearData

**Archivo:** `src/hooks/useExecutiveMultiYearData.ts`

Estrategia de refactorizacion:

| Tipo de dato | Fuente actual (rota) | Fuente nueva |
|---|---|---|
| monthlyByYear | Query cruda (1000 filas max) | RPC `get_historical_monthly_data` (server-side, sin limite) |
| quarterlyByYear | Derivado de monthlyByYear | Derivado del RPC (correcto porque el RPC ya tiene datos completos) |
| yearlyTotals | Derivado de monthlyByYear | Derivado del RPC |
| dailyCurrent | Query cruda (mes actual) | Query con `.range(0, 2000)` solo para el mes actual (~30 registros/dia max) |
| clientsMTD | Query cruda (mes actual) | Query con `.range(0, 2000)` solo para el mes actual |
| weekdayComparison | Query cruda | Derivado de dailyCurrent + mes anterior con paginacion |
| localForaneoMonthly | Query cruda | Query separada ultimos 12 meses con paginacion |
| armedMonthly | Query cruda | Query separada ultimos 12 meses con paginacion |

Cambios concretos:

1. Reemplazar la query unica monolitica por:
   - `supabase.rpc('get_historical_monthly_data')` para datos mensuales (fuente de verdad)
   - Query paginada solo para el mes actual (dailyCurrent, clientsMTD, weekday)
   - Query paginada para ultimos 2 meses (local/foraneo, armado)

2. Calcular `monthlyByYear`, `quarterlyByYear`, `yearlyTotals` a partir del RPC (datos correctos, ya agregados server-side)

3. Para las queries de detalle, implementar paginacion con loop:
   ```
   let allRecords = [];
   let offset = 0;
   while (true) {
     const { data } = await supabase.from(...).range(offset, offset + 999);
     allRecords.push(...data);
     if (data.length < 1000) break;
     offset += 1000;
   }
   ```

---

### Parte 2: Herramienta de Auditoria en Administracion

**Nueva pestana** en `AdministrationHub.tsx` - "Auditoria de Datos"

Ninguno de los componentes existentes (Metas, Inactividad, Limpieza BDD, Versiones) sirve para esta tarea, por lo que se creara un componente nuevo.

**Archivo nuevo:** `src/components/administration/DataAuditManager.tsx`

Funcionalidad:

1. **Subir Excel** - El usuario sube su archivo Excel de datos validados. El componente lee las columnas esperadas:
   - Ano, Mes, Servicios, GMV (como minimo)
   - Acepta variantes de nombres de columna (Year, Ano, year, etc.)

2. **Obtener datos del sistema** - Llama al RPC `get_historical_monthly_data` para obtener los totales del sistema

3. **Comparacion lado a lado** - Tabla con columnas:
   | Periodo | Servicios Excel | Servicios Sistema | Delta | Delta % | GMV Excel | GMV Sistema | Delta | Delta % | Estado |
   
   - Delta = Sistema - Excel
   - Estado: OK (delta < 1%), Alerta (1-5%), Error (>5%)
   - Colores: verde/amarillo/rojo segun severidad

4. **Resumen** - Card superior con:
   - Total de periodos analizados
   - Periodos con discrepancia
   - Discrepancia maxima encontrada
   - Porcentaje de coincidencia global

5. **Exportar resultados** - Boton para descargar la comparacion como Excel

**Archivo modificado:** `src/pages/Administration/AdministrationHub.tsx`

- Agregar 5ta pestana "Auditoria" con icono `FileSearch`
- Grid de tabs pasa de `grid-cols-4` a `grid-cols-5`

---

### Resumen de archivos

| Tipo | Archivo | Cambio |
|------|---------|--------|
| Modificacion | `src/hooks/useExecutiveMultiYearData.ts` | Refactorizar para usar RPC + paginacion |
| Nuevo | `src/components/administration/DataAuditManager.tsx` | Herramienta de auditoria Excel vs Sistema |
| Modificacion | `src/pages/Administration/AdministrationHub.tsx` | Agregar pestana de Auditoria |

