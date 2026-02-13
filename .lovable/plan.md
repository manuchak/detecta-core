

## Rediseno Profesional del Modulo Customer Success

### Problema actual

1. **Sin depuracion de cartera**: No existe forma de dar de baja clientes inactivos desde CS. El hook `useDeleteCliente` lanza error ("not implemented"). Los ~50 clientes sin actividad en 90+ dias contaminan todas las metricas.
2. **Dashboard fragamentado**: 6 pestanas separadas (Dashboard, Retencion, Quejas, Clientes, CAPA, Mejora) obligan al analista a saltar entre vistas para entender el estado de la cartera.
3. **Metricas no accionables**: KPIs como "NRR", "Churn Rate", "SLA Compliance" son abstractos para un analista no tecnico. Faltan indicadores visuales claros (semaforos, progreso).
4. **Sin trazabilidad de bajas**: No hay registro de por que o cuando se dio de baja un cliente.
5. **Playbooks sin contexto visual**: La seccion "Siguiente Mejor Accion" ejecuta touchpoints sin confirmacion y sin mostrar a que cliente especifico aplica.

---

### Solucion: CS Command Center

Reorganizar el modulo en **3 vistas claras** en lugar de 6, con un flujo de trabajo centrado en el analista:

```text
+------------------------------------------------------+
|  CUSTOMER SUCCESS                                     |
|  [Panorama]  [Cartera]  [Operativo]                  |
+------------------------------------------------------+

Tab 1: PANORAMA (Dashboard ejecutivo)
- Hero: 4 KPIs grandes con semaforo (verde/amarillo/rojo)
  - Clientes Activos (con servicio en 90d)
  - CSAT Promedio
  - Quejas Abiertas
  - Clientes en Riesgo
- Embudo de Fidelidad (existente, mejorado)
- Top 5 Acciones Urgentes (clientes que necesitan atencion HOY)

Tab 2: CARTERA (Depuracion + Gestion)
- Filtro por segmento: Activos | Inactivos | En Riesgo | Todos
- Tabla limpia con columnas: Nombre, Ultimo Servicio,
  Servicios 90d, GMV 90d, Quejas, CSAT, Estado, Acciones
- Boton "Dar de baja" con modal de confirmacion y motivo
- Boton "Reactivar" para clientes dados de baja
- Indicadores visuales: puntos de color por salud
- Registro de eventos (baja, reactivacion, notas) en timeline

Tab 3: OPERATIVO (Quejas + CAPA + Mejora)
- Sub-tabs: Quejas | CAPA | Mejora Continua
- Contenido existente, sin cambios funcionales
```

---

### Cambios tecnicos detallados

**1. Nuevo campo en `pc_clientes`** (Migracion SQL)
- Agregar columna `motivo_baja TEXT` para registrar por que se desactivo
- Agregar columna `fecha_baja TIMESTAMPTZ` para trazabilidad

**2. Hook `useCSCartera.ts`** (Nuevo)
- Consulta unificada de clientes con metricas operativas (servicios 90d, GMV, ultimo contacto, quejas)
- Incluye clientes inactivos (filtro controlado por UI)
- Mutacion `deactivateCliente(id, motivo)` que setea `activo=false`, `motivo_baja`, `fecha_baja`
- Mutacion `reactivateCliente(id)` que setea `activo=true`, limpia motivo/fecha

**3. Componente `CSPanorama.tsx`** (Nuevo - reemplaza Dashboard + Retencion)
- 4 KPI cards con semaforo de colores:
  - Verde: valor saludable
  - Amarillo: requiere atencion
  - Rojo: critico
- Umbrales claros para el analista (ej: "3 quejas abiertas = rojo")
- Embudo de fidelidad (reutiliza `CSLoyaltyFunnel`)
- Lista "Atencion Urgente": top 5 clientes que necesitan accion, con boton para abrir perfil

**4. Componente `CSCartera.tsx`** (Nuevo - reemplaza Clientes)
- Filtros de segmento como pills grandes y claras (no selects pequeños):
  - "Activos con servicio" | "Sin servicio 90d+" | "En Riesgo" | "Dados de baja"
- Tabla con filas clickeables que abren el perfil existente
- Columna "Acciones" con boton contextual:
  - Si activo: "Dar de baja" -> modal con campo de motivo obligatorio
  - Si inactivo: "Reactivar" -> confirmacion simple
- Indicador de salud: circulo de color (verde/amarillo/rojo) al inicio de cada fila
- Contador de resultados filtrados visible

**5. Componente `CSOperativo.tsx`** (Nuevo - consolida Quejas + CAPA + Mejora)
- Sub-tabs internas reutilizando componentes existentes:
  - `CSQuejasList`
  - `CSCAPAKanban`
  - `CSMejoraContinua`

**6. Actualizar `CustomerSuccessPage.tsx`**
- Cambiar de 6 tabs a 3: Panorama, Cartera, Operativo
- Actualizar sidebar navigation si aplica

**7. Actualizar `useCSClientesConQuejas` y `useCSLoyaltyFunnel`**
- El calculo de "dias promedio sin contacto" excluira clientes con `activo=false`
- Las metricas de NRR/Churn solo consideraran clientes que realmente operan

---

### Experiencia del analista

El flujo de trabajo diario sera:

1. Abrir **Panorama**: ver de un vistazo si hay algo critico (semaforos rojos)
2. Click en "X clientes en riesgo" -> navega a **Cartera** filtrada
3. En Cartera: revisar cada cliente, decidir si contactar o dar de baja
4. Dar de baja: click -> escribir motivo -> confirmar -> cliente sale de metricas activas
5. Si llega una queja: ir a **Operativo** -> Quejas -> gestionar

Cada accion tiene confirmacion visual (toast) y registro de trazabilidad.

