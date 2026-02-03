
# Plan: Convertir Custodio a Armado (Corrección de Datos)

## Problema

Debido a errores de carga, algunos registros fueron creados como "custodio" cuando en realidad son "armado". Se necesita una forma de corregir esta clasificación desde la interfaz.

## Consideraciones UX

**Por qué NO en la pestaña de edición regular:**
- Es una acción destructiva e irreversible desde UI
- No es una edición rutinaria, es corrección de datos
- Debe tener fricción intencional para evitar errores

**Propuesta: Sección separada con protección**
- Ubicar en la tarjeta "Configuración Operativa" del tab Información
- Visible solo para roles autorizados (admin, owner, coordinador_operaciones)
- Requiere confirmación explícita con motivo
- Registra historial de cambio

## Diseño de UI

```text
┌────────────────────────────────────────────────┐
│ ⚙️ Configuración Operativa                     │
├────────────────────────────────────────────────┤
│ Preferencia de servicio                        │
│ ┌──────────┐ ┌──────────┐ ┌──────────────┐    │
│ │ 🏠 Local │ │ ✈️ Foráneo│ │ ⚪ Indistinto │   │
│ └──────────┘ └──────────┘ └──────────────┘    │
│                                                │
│ ──────────────────────────────────────────    │
│ [🔴 Dar de baja]                              │
│                                                │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ 🔒 Acciones de Corrección de Datos (Admin)    │
│ ┌────────────────────────────────────────────┐│
│ │ Este custodio fue registrado               ││
│ │ incorrectamente y debería ser armado.      ││
│ │                                            ││
│ │ [🔄 Convertir a Armado]                    ││
│ └────────────────────────────────────────────┘│
└────────────────────────────────────────────────┘
```

## Flujo de Conversión

```text
Click "Convertir a Armado"
        ↓
Modal de Confirmación
┌─────────────────────────────────────────────────┐
│ ⚠️ Convertir Custodio a Armado                  │
├─────────────────────────────────────────────────┤
│ ¿Estás seguro de convertir a:                   │
│ Juan Pérez González                             │
│                                                 │
│ Esta acción:                                    │
│ • Moverá el registro a la tabla de armados      │
│ • Eliminará datos específicos de custodio       │
│ • No es reversible desde la interfaz            │
│                                                 │
│ Motivo: [Error de carga - registro incorrecto]  │
│                                                 │
│ Tipo de armado: [Seleccionar ▼]                 │
│   • Interno                                     │
│   • Externo                                     │
│   • Freelance                                   │
│                                                 │
├─────────────────────────────────────────────────┤
│ [Cancelar]          [✓ Confirmar Conversión]    │
└─────────────────────────────────────────────────┘
```

## Cambios Técnicos

### 1. Crear `useConvertirTipoOperativo.ts`

Hook para ejecutar la conversión:

```typescript
interface ConvertirParams {
  operativoId: string;
  direccion: 'custodio_a_armado' | 'armado_a_custodio';
  motivo: string;
  tipoArmado?: string;
  ejecutadoPor: string;
}
```

Lógica:
- Fetch registro actual de custodios_operativos
- Mapear campos comunes (nombre, telefono, email, zona_base, estado, disponibilidad, numero_servicios, rating_promedio, etc.)
- Insertar en armados_operativos con valores por defecto para campos específicos de armado
- Eliminar de custodios_operativos
- Registrar en historial/log

### 2. Crear `ConvertirTipoModal.tsx`

Modal de confirmación con:
- Resumen del operativo a convertir
- Campo de motivo obligatorio
- Selector de tipo_armado (requerido para conversión a armado)
- Advertencia clara de irreversibilidad

### 3. Actualizar `InformacionPersonalTab.tsx`

- Agregar sección "Corrección de Datos" al final de la tarjeta "Configuración Operativa"
- Mostrar solo si el usuario tiene rol autorizado
- Solo visible en perfiles de tipo 'custodio'
- Integrar hook de autenticación para verificar rol

### 4. Crear constante de roles autorizados

En `accessControl.ts`:

```typescript
export const DATA_CORRECTION_ROLES = [
  'admin',
  'owner',
  'coordinador_operaciones'
] as const;
```

## Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `src/hooks/useConvertirTipoOperativo.ts` | **Crear** - Hook de conversión |
| `src/pages/PerfilesOperativos/components/ConvertirTipoModal.tsx` | **Crear** - Modal de confirmación |
| `src/pages/PerfilesOperativos/components/tabs/InformacionPersonalTab.tsx` | Modificar - Agregar sección y botón |
| `src/constants/accessControl.ts` | Modificar - Agregar DATA_CORRECTION_ROLES |

## Mapeo de Campos (Custodio → Armado)

| Campo Custodio | Campo Armado | Acción |
|----------------|--------------|--------|
| id | id | Nuevo UUID |
| nombre | nombre | Copiar |
| telefono | telefono | Copiar |
| email | email | Copiar |
| zona_base | zona_base | Copiar |
| estado | estado | Copiar |
| disponibilidad | disponibilidad | Copiar |
| numero_servicios | numero_servicios | Copiar |
| rating_promedio | rating_promedio | Copiar |
| - | tipo_armado | Usuario selecciona |
| - | licencia_portacion | null (completar después) |
| - | experiencia_anos | null |
| pc_custodio_id | - | Se pierde |
| vehiculo_propio | - | Se pierde |

## Consideraciones de Seguridad

- Verificación de rol en frontend Y backend (RLS)
- Registro en tabla de auditoría
- Campo motivo obligatorio
- Transacción atómica (insert + delete)

## Resultado Esperado

- Daniela Castañeda (y otros coordinadores) pueden corregir clasificaciones erróneas
- Proceso con fricción intencional para evitar errores
- Registro de auditoría completo
- UI clara sobre la naturaleza destructiva de la acción
