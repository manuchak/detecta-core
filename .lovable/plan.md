
# Plan: Exportar Templates de WhatsApp para Meta

## Resumen

Agregar funcionalidad de exportación de los 34 templates en formatos que faciliten su creación en Meta Business Suite: JSON estructurado, CSV para Excel, y un documento Markdown con todos los detalles.

---

## Formatos de Exportación

### 1. JSON Estructurado (recomendado para desarrolladores)

```json
{
  "templates": [
    {
      "name": "servicio_asignado",
      "category": "UTILITY",
      "language": "es",
      "components": {
        "body": {
          "text": "🛡️ SERVICIO ASIGNADO\n\nHola {{1}},\n\nTienes un nuevo servicio...",
          "example": ["Juan Pérez", "15 de febrero", "09:00", "Grupo Carso", "CDMX Centro", "Santa Fe"]
        },
        "buttons": [
          { "type": "QUICK_REPLY", "text": "✅ Confirmar" },
          { "type": "QUICK_REPLY", "text": "❌ No disponible" }
        ]
      },
      "variables": {
        "1": "custodio_nombre",
        "2": "fecha",
        "3": "hora",
        "4": "cliente",
        "5": "origen",
        "6": "destino"
      }
    }
  ]
}
```

### 2. CSV para Excel (fácil copiar/pegar)

| Nombre | Categoría | Variables | Texto | Botón 1 | Botón 2 | Botón 3 |
|--------|-----------|-----------|-------|---------|---------|---------|
| servicio_asignado | UTILITY | 6 | 🛡️ SERVICIO ASIGNADO... | ✅ Confirmar | ❌ No disponible | |

### 3. Markdown Documentación (referencia completa)

Documento con cada template formateado incluyendo:
- Nombre y categoría
- Texto completo del mensaje
- Lista de variables con descripción
- Botones interactivos
- Ejemplo de valores

---

## Cambios Técnicos

### 1. Nueva utilidad de exportación

**Archivo:** `src/utils/exportWhatsAppTemplates.ts`

Funciones para generar los 3 formatos de exportación:

```typescript
// Genera JSON estructurado para Meta API
export const exportToJSON = (): string => { ... }

// Genera CSV compatible con Excel
export const exportToCSV = (): string => { ... }

// Genera documento Markdown de referencia
export const exportToMarkdown = (): string => { ... }

// Descarga archivo al navegador
export const downloadFile = (content: string, filename: string, type: string) => { ... }
```

### 2. Componente de exportación

**Archivo:** `src/components/settings/kapso/TemplateExportDialog.tsx`

Modal con opciones de exportación:

```text
┌─────────────────────────────────────────────────────────┐
│ 📥 Exportar Templates para Meta                         │
│─────────────────────────────────────────────────────────│
│                                                         │
│ Selecciona el formato de exportación:                   │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 📋 JSON Estructurado                                ││
│ │ Formato técnico listo para API de Meta.             ││
│ │ Incluye ejemplos de variables y estructura.         ││
│ │                               [Descargar JSON]      ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 📊 CSV para Excel                                   ││
│ │ Abre en Excel para copiar/pegar fácilmente.         ││
│ │ Una fila por template con todas las variables.      ││
│ │                               [Descargar CSV]       ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 📄 Documentación Markdown                           ││
│ │ Documento completo con todos los detalles.          ││
│ │ Útil como referencia al crear en Meta.              ││
│ │                               [Descargar MD]        ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│                                         [Cerrar]       │
└─────────────────────────────────────────────────────────┘
```

### 3. Actualizar panel de templates

**Archivo:** `src/components/settings/kapso/WhatsAppTemplatesPanel.tsx`

Agregar botón "Exportar" junto al botón de refresh:

```typescript
<Button variant="outline" onClick={() => setExportDialogOpen(true)}>
  <Download className="h-4 w-4 mr-2" />
  Exportar para Meta
</Button>
```

---

## Contenido de Exportación

### JSON incluirá:

- `name`: Nombre exacto del template
- `category`: UTILITY o MARKETING
- `language`: "es" (español)
- `body.text`: Texto completo con placeholders {{n}}
- `body.example`: Array con valores de ejemplo para cada variable
- `buttons`: Array de botones si los tiene
- `variables`: Mapeo de número a nombre descriptivo

### CSV incluirá columnas:

1. `nombre` - Nombre del template
2. `categoria` - UTILITY/MARKETING
3. `num_variables` - Cantidad de variables
4. `variables` - Lista separada por comas
5. `texto` - Contenido del body (escapado)
6. `tiene_botones` - Sí/No
7. `boton_1`, `boton_2`, `boton_3` - Texto de botones

### Markdown incluirá:

- Tabla de contenidos por categoría
- Cada template con:
  - Header con nombre y metadata
  - Bloque de código con el texto
  - Tabla de variables
  - Lista de botones
  - Valores de ejemplo

---

## Estructura de Archivos

```text
src/
├── utils/
│   └── exportWhatsAppTemplates.ts    ← NUEVO
└── components/
    └── settings/
        └── kapso/
            ├── WhatsAppTemplatesPanel.tsx  ← MODIFICAR
            └── TemplateExportDialog.tsx    ← NUEVO
```

---

## Ejemplo de Archivos Generados

### detecta-templates.json
```json
{
  "exportDate": "2026-02-06T17:30:00Z",
  "totalTemplates": 34,
  "templates": [...]
}
```

### detecta-templates.csv
```csv
nombre,categoria,num_variables,variables,texto,tiene_botones,boton_1,boton_2,boton_3
servicio_asignado,UTILITY,6,"custodio_nombre,fecha,hora,cliente,origen,destino","🛡️ SERVICIO ASIGNADO...",Si,✅ Confirmar,❌ No disponible,
```

### detecta-templates.md
```markdown
# Templates de WhatsApp - Detecta

## Índice
1. Servicios y Planeación (7)
2. Checklist y GPS (5)
...

## 1. Servicios y Planeación

### servicio_asignado
- **Categoría:** UTILITY
- **Variables:** 6
...
```

---

## Flujo de Usuario

1. Usuario navega a Settings → WhatsApp Kapso → Templates
2. Hace clic en botón "Exportar para Meta"
3. Se abre modal con 3 opciones de formato
4. Selecciona el formato deseado y descarga
5. Usa el archivo para crear templates en Meta Business Suite
