

# Modulo Legal - Centro de Gestion de Documentos Legales

## Vision

Un modulo centralizado para gestionar todos los documentos legales del sistema: plantillas de contratos, politicas de privacidad, NDAs, convenios, y cualquier documento que requiera control de version, compliance y trazabilidad. Funciona como el "Chief Legal Officer" digital del proyecto.

## Estructura del Modulo

### Pestanas principales

1. **Plantillas de Contratos** - CRUD completo de todas las plantillas en `plantillas_contrato`, con editor HTML visual (TipTap ya esta instalado), preview en tiempo real, y variables de interpolacion detectadas automaticamente
2. **Versionamiento** - Historial de cambios de cada plantilla (quien la edito, cuando, que cambio), con capacidad de restaurar versiones anteriores y comparar diff entre versiones
3. **Compliance** - Checklist de cumplimiento legal por tipo de documento (Ley Federal del Trabajo, LFPDPPP para privacidad, regulaciones de armas SEDENA), con fechas de ultima revision y alertas de vencimiento
4. **Catalogo de Variables** - Vista unificada de todas las variables de interpolacion disponibles (`{{nombre_completo}}`, `{{curp}}`, etc.), con su fuente de datos y documentos donde se usan

## Cambios Tecnicos

### 1. Navegacion - `src/config/navigationConfig.ts`

Agregar un nuevo grupo `legal` en `navigationGroups` entre "Supply & Talento" y "Operaciones", con el modulo "Legal" que tiene children:
- Plantillas (editor de plantillas)
- Versiones (historial)
- Compliance (checklist regulatorio)

Roles con acceso: `admin`, `owner`, `supply_admin`, `coordinador_operaciones`

### 2. Nueva tabla `plantillas_contrato_versiones` (migracion SQL)

```text
id: uuid PK
plantilla_id: uuid FK -> plantillas_contrato
version: integer
contenido_html: text
variables_requeridas: text[]
change_description: text
changed_by: uuid FK -> profiles
created_at: timestamptz
```

Cada vez que se edita una plantilla, se guarda la version anterior en esta tabla antes de aplicar el cambio. Esto permite rollback y diff.

### 3. Nueva tabla `legal_compliance_checks` (migracion SQL)

```text
id: uuid PK
plantilla_id: uuid FK -> plantillas_contrato
compliance_type: text (ley_federal_trabajo, lfpdppp, sedena, norma_interna)
status: text (compliant, review_needed, non_compliant)
last_reviewed_at: timestamptz
reviewed_by: uuid FK -> profiles
next_review_date: date
notes: text
created_at: timestamptz
updated_at: timestamptz
```

### 4. Paginas y componentes nuevos

| Archivo | Descripcion |
|---|---|
| `src/pages/Legal/LegalHub.tsx` | Pagina principal con Tabs |
| `src/pages/Legal/components/TemplatesList.tsx` | Lista de plantillas con filtros por tipo, estado activa/inactiva |
| `src/pages/Legal/components/TemplateEditor.tsx` | Editor TipTap para HTML de plantilla + panel lateral de variables disponibles + preview |
| `src/pages/Legal/components/TemplateVersionHistory.tsx` | Timeline de versiones con diff visual y boton de rollback |
| `src/pages/Legal/components/ComplianceChecklist.tsx` | Cards por plantilla con status de compliance, fecha de revision, y alertas |
| `src/pages/Legal/components/VariablesCatalog.tsx` | Tabla de todas las variables, su fuente (candidatos_custodios, leads, OCR) y en que plantillas se usan |
| `src/hooks/useLegalTemplates.ts` | Hook con queries y mutations para CRUD de plantillas + versionamiento |

### 5. Ruta - `src/App.tsx` o router config

Agregar ruta `/legal` con el componente `LegalHub` dentro del `UnifiedLayout`.

### 6. Flujo de edicion de plantilla

1. Usuario selecciona plantilla de la lista
2. Se abre el editor TipTap con el HTML actual
3. Panel lateral muestra variables disponibles (click para insertar `{{variable}}`)
4. Preview en tiempo real con datos de ejemplo
5. Al guardar: se crea registro en `plantillas_contrato_versiones` con el contenido anterior, se actualiza `plantillas_contrato` con el nuevo contenido, se incrementa `version`
6. Opcionalmente se marca como "requiere revision de compliance"

### 7. Integracion con sistema existente

- Las plantillas editadas aqui son las mismas que usa `useContratosCandidato` y `ContractGenerateDialog` - no se duplica nada
- El modulo de version control existente en Administracion (`system_versions`) se mantiene para versiones del sistema; el nuevo versionamiento es especifico para documentos legales
- Los tipos de contrato en `useContratosCandidato.ts` (`TipoContrato`) se pueden extender desde aqui para agregar nuevos tipos (ej: contratos de instaladores)

## Orden de implementacion

1. Migraciones SQL (tablas de versiones y compliance)
2. Navegacion y ruta
3. `LegalHub.tsx` con tabs basicos
4. `TemplatesList.tsx` - lista de plantillas existentes
5. `TemplateEditor.tsx` - editor con TipTap
6. `TemplateVersionHistory.tsx` - historial
7. `ComplianceChecklist.tsx` - compliance
8. `VariablesCatalog.tsx` - catalogo de variables

