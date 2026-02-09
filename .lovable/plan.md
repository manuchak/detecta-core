

# Plan: Manual de Usuario del Modulo de Facturacion

## Objetivo

Crear un centro de ayuda interactivo e integrado dentro del modulo de Facturacion que permita a los usuarios (equipo de finanzas, coordinadores, CFO) consultar como usar cada funcionalidad sin salir de la aplicacion.

## Mejores Practicas Investigadas

Basado en estandares de UX para documentacion in-app (Salesforce Help, Notion Help, HelpKit):

1. **Contextual, no monolitico**: En lugar de un PDF de 30 paginas, secciones organizadas por tab/funcionalidad con busqueda instantanea.
2. **Accordion/Collapsible**: Estructura de preguntas frecuentes con secciones colapsables para no saturar visualmente.
3. **Busqueda local**: Filtro en tiempo real que busca dentro de todos los articulos sin llamadas al servidor.
4. **Iconografia visual**: Cada seccion identificada con el mismo icono que usa en la navegacion principal para generar reconocimiento.
5. **Flujos paso a paso**: Instrucciones numeradas con descripciones claras de que hacer y donde hacer click.
6. **Acceso persistente**: Un tab dedicado "Ayuda" en el hub principal, siempre visible.

## Estructura del Manual

El manual cubrira las 8 tabs del modulo con la siguiente estructura por seccion:

```text
┌─────────────────────────────────────────────────────────────┐
│  📖 Manual de Usuario — Facturacion y Cobranza              │
│  ┌───────────────────────────────────────────────┐          │
│  │ 🔍 Buscar en el manual...                     │          │
│  └───────────────────────────────────────────────┘          │
│                                                             │
│  [Dashboard] [Servicios] [Facturas] [CxC] [Clientes]       │
│  [Incidencias] [Gastos Extra] [CxP] [Preguntas Frecuentes] │
│                                                             │
│  ▼ Dashboard — Panel Principal                              │
│    ├ Que muestra el dashboard?                              │
│    ├ Como usar los filtros de fecha?                        │
│    ├ Que significan los KPIs?                               │
│    └ Como interpretar las graficas?                         │
│                                                             │
│  ▼ Facturas — Generar y Consultar                           │
│    ├ Como generar una factura?                              │
│    ├ Que es "Dias sin Facturar"?                            │
│    ├ Diferencia entre Inmediata y Corte                     │
│    ├ Donde ingreso la Orden de Compra (OC)?                 │
│    └ Como ver el detalle de una factura emitida?            │
│                                                             │
│  ▼ Preguntas Frecuentes                                     │
│    ├ Que son las horas de cortesia?                         │
│    ├ Como se calcula la pernocta?                           │
│    └ ...                                                    │
└─────────────────────────────────────────────────────────────┘
```

## Contenido Detallado por Seccion

### 1. Dashboard
- Que muestra: KPIs de servicios, ingresos, concentracion por cliente
- Filtros rapidos: 7d, 30d, 3m, 6m, 1a, Mes actual
- Graficas: Barras de ingresos por cliente, Pie de concentracion Top 5

### 2. Servicios (Consulta)
- Como buscar un servicio por folio, cliente o ruta
- Que datos muestra cada servicio
- Como abrir el detalle de un servicio (click en la fila)
- Como registrar detenciones y evidencias de gastos

### 3. Facturas
- **Por Facturar**: Como identificar servicios pendientes, alertas de retraso, como generar una factura batch por cliente
- **Facturas Emitidas**: Como consultar facturas, filtrar por estado, ver detalle de partidas
- **Generar Factura**: Paso a paso del modal (auto-llenado RFC/email, tipo factura, OC)

### 4. Cuentas por Cobrar (CxC)
- Que es el aging report
- Como leer los rangos (0-30, 31-60, 61-90, 90+)
- Como registrar un pago

### 5. Clientes
- Como editar datos fiscales (RFC, Regimen, CFDI)
- Como configurar parametros financieros (horas cortesia, pernocta, tipo facturacion, dias max)
- Como exportar la lista a Excel

### 6. Incidencias
- Que tipos existen (discrepancia monto, rechazo cliente, nota de credito, etc.)
- Como crear una incidencia
- Flujo de estados: Abierta → En Revision → Resuelta → Cerrada
- Como registrar montos original vs ajustado

### 7. Gastos Extraordinarios
- Tipos de gasto (caseta extra, hotel, alimentos, reparacion, etc.)
- Flujo de aprobacion: Pendiente → Aprobado/Rechazado → Reembolsado
- Flags de cobrable al cliente y pagable al custodio

### 8. CxP Proveedores Armados
- Como generar un estado de cuenta por proveedor y periodo
- Que calcula automaticamente el sistema
- Flujo de estados: Borrador → Revision → Aprobado → Pagado

### 9. Preguntas Frecuentes
- Conceptos clave: Horas cortesia, pernocta, estadias, casetas
- Diferencia entre factura inmediata y de corte
- Que hacer si un servicio no aparece en "Por Facturar"
- Como se calcula el IVA
- Roles y permisos del modulo

## Implementacion Tecnica

### Archivos a Crear

| Archivo | Descripcion |
|---------|-------------|
| `src/pages/Facturacion/components/Manual/ManualFacturacionTab.tsx` | Componente principal del manual con busqueda y navegacion por secciones |
| `src/pages/Facturacion/components/Manual/manualContent.ts` | Datos estructurados del contenido (titulos, descripciones, pasos) |
| `src/pages/Facturacion/components/Manual/ManualSection.tsx` | Componente reutilizable para cada seccion con accordions |

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Facturacion/FacturacionHub.tsx` | Agregar tab "Ayuda" con icono `HelpCircle` |

### Arquitectura del Componente

```text
ManualFacturacionTab
├── Barra de busqueda (filtra todas las secciones en tiempo real)
├── Chips de navegacion rapida por seccion
├── ManualSection (por cada modulo)
│   ├── Icono + Titulo de seccion
│   ├── Descripcion general
│   └── Accordion items
│       ├── Pregunta/Titulo
│       └── Contenido con pasos numerados, tips, y notas
└── Seccion FAQ general
```

### Modelo de Datos (manualContent.ts)

```typescript
interface ManualArticle {
  id: string;
  question: string;
  answer: string;         // Texto con instrucciones
  steps?: string[];       // Pasos numerados opcionales
  tip?: string;           // Tip adicional
  keywords: string[];     // Para busqueda local
}

interface ManualSection {
  id: string;
  title: string;
  icon: string;           // Nombre del icono Lucide
  description: string;
  articles: ManualArticle[];
}
```

### Busqueda Local

La busqueda filtrara en tiempo real comparando el query contra:
- `question` de cada articulo
- `answer` de cada articulo
- `keywords` de cada articulo
- `title` de cada seccion

Sin necesidad de backend ni API externa. Todo client-side con un simple `.filter()`.

### Diseno Visual

- Usa los mismos componentes UI existentes: `Card`, `Accordion`, `Badge`, `Input`
- Cada seccion tiene el mismo icono que en la TabsList del hub
- Tips resaltados con `Alert` component en variante `default`
- Pasos numerados con circulos de color primary
- Responsive: funciona en desktop y tablet

## Volumen Estimado

- ~9 secciones con 4-6 articulos cada una
- ~45 articulos totales
- ~200 lineas de contenido estructurado en `manualContent.ts`
- ~150 lineas en `ManualFacturacionTab.tsx`
- ~60 lineas en `ManualSection.tsx`
- 1 linea de cambio en `FacturacionHub.tsx` (agregar tab)

