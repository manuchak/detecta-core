
# Plan: Agregar Seguridad al menú lateral + Seed de Puntos Seguros

## Problemas detectados

1. **Seguridad no aparece en el sidebar**: El módulo fue agregado al archivo `Sidebar.tsx` (legacy), pero la app usa `UnifiedSidebar` que lee de `src/config/navigationConfig.ts`. Seguridad nunca fue registrada ahí.
2. **Tabla `safe_points` vacía**: La tabla existe en la base de datos pero tiene 0 registros. No se ejecutó un seed de datos.

---

## Cambios a realizar

### 1. Agregar grupo y módulo "Seguridad" en navigationConfig.ts

- Agregar un nuevo grupo `seguridad` en el array `navigationGroups` (entre "Capacitación" y "Sistema").
- Agregar un módulo `seguridad` en `navigationModules` con:
  - Path: `/seguridad`
  - Roles: `admin`, `owner`, `jefe_seguridad`, `analista_seguridad`, `coordinador_operaciones`
  - Icon: `ShieldAlert`
  - Group: `seguridad`

### 2. Seed de puntos seguros

Insertar datos realistas de puntos seguros en la tabla `safe_points` mediante migración SQL. Se incluirán entre 15-20 puntos seguros con:
- Diferentes tipos (gasolinera, hotel, base_militar, tienda_conveniencia, estacionamiento, caseta_peaje)
- Coordenadas reales en corredores de alto riesgo de México
- Criterios de evaluación variados (seguridad, iluminación, CCTV, etc.)
- Distintos niveles de certificación (oro, plata, bronce, precaución)
- Status de verificación mixtos (verified, pending, legacy)

---

## Detalles Técnicos

### Archivo: `src/config/navigationConfig.ts`

Agregar import de `ShieldAlert` y:

```typescript
// En navigationGroups (antes de 'system'):
{ id: 'seguridad', label: 'Seguridad', icon: ShieldAlert },

// En navigationModules:
{
  id: 'seguridad',
  label: 'Seguridad',
  icon: ShieldAlert,
  path: '/seguridad',
  roles: ['admin', 'owner', 'jefe_seguridad', 'analista_seguridad', 'coordinador_operaciones'],
  group: 'seguridad',
}
```

### Migración SQL: Seed de ~18 puntos seguros

Insertar registros con coordenadas reales a lo largo de corredores como:
- México-Querétaro (Oxxo Tepotzotlán, Gasolinera Palmillas)
- Querétaro-SLP (Hotel City Express SLP)
- Puebla-Veracruz (Caseta Amozoc)
- Guadalajara-Manzanillo (Base Militar Colima)
- CDMX-Puebla (Gasolinera Río Frío)
- etc.

Cada registro incluirá los 12 criterios booleanos de evaluación, score calculado, y nivel de certificación.
