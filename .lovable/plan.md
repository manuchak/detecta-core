

## Prevencion Definitiva: Trigger de Normalizacion Automatica en Base de Datos

### Problema

Hoy corregimos los sintomas (RLS y datos existentes), pero la causa raiz persiste: **el telefono se escribe en formato libre** desde distintas fuentes (app, webhooks, imports masivos). Cada nuevo custodio que se registre con un telefono con espacios o prefijo +52 estara expuesto al mismo bug.

### Solucion: Defensa en profundidad

Implementar un **trigger a nivel de base de datos** que normalice automaticamente el campo `custodio_telefono` en TODAS las tablas relevantes al momento de INSERT o UPDATE. Esto garantiza que sin importar la fuente del dato, siempre se almacene limpio.

```text
Fluente de datos          Trigger DB           Dato almacenado
+--------------------+    +-------------+      +------------+
| App movil          | -> |             |      |            |
| Webhook WhatsApp   | -> | normalize   | ---> | 5545180581 |
| Import Excel       | -> | trigger     |      |            |
| Edge function      | -> |             |      |            |
+--------------------+    +-------------+      +------------+
```

### Cambios

#### 1. Migracion SQL: Funcion + Triggers

Crear una funcion SQL reutilizable y aplicarla como trigger en las 4 tablas que usan `custodio_telefono`:

```sql
-- Funcion reutilizable
CREATE OR REPLACE FUNCTION normalize_custodio_telefono()
RETURNS trigger AS $$
BEGIN
  IF NEW.custodio_telefono IS NOT NULL THEN
    NEW.custodio_telefono := regexp_replace(
      NEW.custodio_telefono, '[^0-9]', '', 'g'
    );
    -- Tomar ultimos 10 digitos si tiene prefijo de pais
    IF length(NEW.custodio_telefono) > 10 THEN
      NEW.custodio_telefono := right(NEW.custodio_telefono, 10);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Tablas donde se aplicara el trigger:
- `checklist_servicio`
- `documentos_custodio`
- `custodio_mantenimientos`
- `custodio_configuracion_mantenimiento`

Adicionalmente, normalizar datos existentes en las 4 tablas que pudieran tener formatos inconsistentes.

#### 2. Simplificar la RLS de checklist_servicio

Con el trigger garantizando datos limpios, la politica RLS puede simplificarse para usar `normalize_phone()` (que ya existe como funcion SQL) en lugar de `regexp_replace` inline, manteniendo consistencia con `documentos_custodio`.

#### 3. Sin cambios en frontend

El frontend ya usa `normalizePhone()` en todos los hooks. Los triggers son una red de seguridad para datos que llegan por otras vias (webhooks, imports, queries directas).

### Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| Nueva migracion SQL | Funcion trigger + 4 triggers + normalizacion de datos existentes + simplificacion RLS |

### Resultado

Cualquier custodio nuevo que se registre o reciba servicios tendra su telefono normalizado automaticamente en la base de datos, eliminando la posibilidad de que un formato inconsistente bloquee su acceso a checklists, documentos o mantenimientos.

