
# Plan: Integrar Documentos de Custodios en Perfiles Operativos

## Contexto del Problema

Actualmente existen **dos fuentes de documentación**:

| Fuente | Tabla | Clave | Quién sube |
|--------|-------|-------|------------|
| Reclutamiento | `documentos_candidato` | `candidato_id` | Supply/Admin |
| Onboarding Custodio | `documentos_custodio` | `custodio_telefono` | Custodio |

La tab "Documentación" en Perfiles Operativos solo muestra documentos de reclutamiento, ignorando los que suben los custodios desde su portal.

## Solución Propuesta

Unificar ambas fuentes en la vista de Perfiles Operativos, permitiendo a Supply ver y auditar TODOS los documentos.

## Cambios a Realizar

### 1. Nuevo Hook: useCustodianDocsForProfile

Crear hook que busque documentos por teléfono del custodio:

```typescript
// src/pages/PerfilesOperativos/hooks/useCustodianDocsForProfile.ts

export function useCustodianDocsForProfile(telefono: string | null) {
  return useQuery({
    queryKey: ['custodian-docs-profile', telefono],
    queryFn: async () => {
      if (!telefono) return [];
      
      const { data, error } = await supabase
        .from('documentos_custodio')
        .select('*')
        .eq('custodio_telefono', telefono)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!telefono
  });
}
```

### 2. Modificar DocumentacionTab

Actualizar el componente para:
- Recibir `telefono` además de `candidatoId`
- Mostrar documentos de ambas fuentes en secciones separadas
- Agregar badges para indicar origen (Reclutamiento vs Portal Custodio)
- Permitir verificación de documentos del custodio

```typescript
interface DocumentacionTabProps {
  candidatoId: string | null;
  telefono: string | null;  // NUEVO
}
```

### 3. Funcionalidad de Verificación

Agregar botón para que Supply pueda:
- Marcar documento como verificado/no verificado
- Agregar notas de revisión
- Ver fecha y quién verificó

```typescript
const handleVerificar = async (docId: string, verificado: boolean, notas?: string) => {
  await supabase
    .from('documentos_custodio')
    .update({
      verificado,
      verificado_por: user.email,
      fecha_verificacion: new Date().toISOString(),
      notas
    })
    .eq('id', docId);
};
```

### 4. Actualizar PerfilForense.tsx

Pasar el teléfono a DocumentacionTab:

```typescript
<DocumentacionTab 
  candidatoId={candidatoId} 
  telefono={profile.telefono}  // NUEVO
/>
```

## Diseño de UI

```text
┌─────────────────────────────────────────────────────────────┐
│  📊 Resumen                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Total: 7 │ │ Válidos:3│ │ Pend.: 2 │ │ Vencer: 1│       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├─────────────────────────────────────────────────────────────┤
│  📁 Documentos del Custodio (Portal)         [Expandido ▼]  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 📄 Póliza de Seguro           [✓ Verificado] [🔗 Ver]  ││
│  │    Vence: 15 Ene 2026 • Subido: 6 Feb 2025             ││
│  │    ✓ Verificado por: admin@... el 6 Feb 2025           ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ 📄 Tarjeta de Circulación     [⏳ Pendiente] [🔗 Ver]  ││
│  │    Vence: 20 Mar 2026 • Subido: 6 Feb 2025             ││
│  │    [ Verificar ✓ ] [ Rechazar ✗ ]                      ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  📋 Documentos de Reclutamiento              [Expandido ▼]  │
│  │ (documentos existentes del sistema actual)              ││
└─────────────────────────────────────────────────────────────┘
```

## Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/pages/PerfilesOperativos/hooks/useCustodianDocsForProfile.ts` | Crear | Hook para obtener documentos por teléfono |
| `src/pages/PerfilesOperativos/hooks/useVerifyDocument.ts` | Crear | Mutación para verificar documentos |
| `src/pages/PerfilesOperativos/components/tabs/DocumentacionTab.tsx` | Modificar | Integrar ambas fuentes + verificación |
| `src/pages/PerfilesOperativos/hooks/useProfileDocuments.ts` | Modificar | Agregar labels de documentos custodio |
| `src/pages/PerfilesOperativos/PerfilForense.tsx` | Modificar | Pasar telefono a DocumentacionTab |

## Labels Unificados de Documentos

Combinar los labels existentes:

```typescript
export const DOCUMENTO_LABELS: Record<string, string> = {
  // De reclutamiento (documentos_candidato)
  ine: 'INE / Identificación Oficial',
  curp: 'CURP',
  rfc: 'RFC',
  comprobante_domicilio: 'Comprobante de Domicilio',
  licencia_conducir: 'Licencia de Conducir',
  antecedentes_penales: 'Carta de Antecedentes Penales',
  acta_nacimiento: 'Acta de Nacimiento',
  comprobante_estudios: 'Comprobante de Estudios',
  cv: 'Curriculum Vitae',
  foto: 'Fotografía',
  contrato: 'Contrato Firmado',
  
  // De portal custodio (documentos_custodio)
  tarjeta_circulacion: 'Tarjeta de Circulación',
  poliza_seguro: 'Póliza de Seguro',
  verificacion_vehicular: 'Verificación Vehicular',
  credencial_custodia: 'Credencial de Custodia',
  
  otro: 'Otro Documento'
};
```

## Flujo de Auditoría

```text
Custodio sube documento (v11)
         │
         ▼
documentos_custodio (verificado: false)
         │
         ▼
Supply abre Perfil Forense > Documentación
         │
         ▼
Ve documento con badge "Pendiente Verificación"
         │
         ▼
Click "Verificar" → Modal con preview de imagen
         │
         ▼
Supply confirma → UPDATE verificado=true
         │
         ▼
Badge cambia a "✓ Verificado por X el Y"
```

## Verificación

1. Abrir un Perfil Operativo que tenga documentos subidos desde el portal
2. Ir a tab "Documentación"
3. Verificar que aparecen documentos de `documentos_custodio`
4. Probar el flujo de verificación
5. Confirmar que las imágenes son visibles desde los links

## Impacto

- **Supply**: Puede auditar documentos digitalizados sin salir de Perfiles Operativos
- **Custodios**: Sus documentos son visibles y validados por el equipo
- **Operaciones**: Base documental digitalizada y centralizada
