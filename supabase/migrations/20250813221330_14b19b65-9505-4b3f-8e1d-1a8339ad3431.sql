-- Crear tabla para versiones del sistema
CREATE TABLE IF NOT EXISTS public.system_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number TEXT NOT NULL UNIQUE,
  version_name TEXT,
  release_date DATE NOT NULL DEFAULT CURRENT_DATE,
  version_type TEXT NOT NULL DEFAULT 'minor', -- major, minor, patch, hotfix
  status TEXT NOT NULL DEFAULT 'planning', -- planning, development, testing, released, deprecated
  description TEXT,
  release_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla para cambios específicos
CREATE TABLE IF NOT EXISTS public.system_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID REFERENCES public.system_versions(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL, -- feature, bugfix, enhancement, breaking_change, security
  module TEXT NOT NULL, -- administracion, monitoreo, inventario, etc.
  title TEXT NOT NULL,
  description TEXT,
  impact_level TEXT NOT NULL DEFAULT 'low', -- low, medium, high, critical
  technical_details TEXT,
  affected_components TEXT[],
  rollback_plan TEXT,
  testing_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear tabla para releases y features
CREATE TABLE IF NOT EXISTS public.feature_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID REFERENCES public.system_versions(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  feature_description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  completion_status TEXT NOT NULL DEFAULT 'planned', -- planned, in_progress, completed, cancelled
  assigned_to UUID REFERENCES auth.users(id),
  due_date DATE,
  completion_date DATE,
  estimated_hours INTEGER,
  actual_hours INTEGER,
  dependencies TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.system_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_releases ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para system_versions
CREATE POLICY "version_control_admin_full_access" ON public.system_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "version_control_dev_read" ON public.system_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones')
    )
  );

-- Políticas RLS para system_changes
CREATE POLICY "changes_admin_full_access" ON public.system_changes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "changes_dev_read" ON public.system_changes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones')
    )
  );

-- Políticas RLS para feature_releases
CREATE POLICY "features_admin_full_access" ON public.feature_releases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "features_dev_read" ON public.feature_releases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones')
    )
  );

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_version_control_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_versions_timestamp
  BEFORE UPDATE ON public.system_versions
  FOR EACH ROW EXECUTE FUNCTION update_version_control_timestamps();

CREATE TRIGGER update_system_changes_timestamp
  BEFORE UPDATE ON public.system_changes
  FOR EACH ROW EXECUTE FUNCTION update_version_control_timestamps();

CREATE TRIGGER update_feature_releases_timestamp
  BEFORE UPDATE ON public.feature_releases
  FOR EACH ROW EXECUTE FUNCTION update_version_control_timestamps();

-- Insertar algunas versiones iniciales
INSERT INTO public.system_versions (version_number, version_name, version_type, status, description, release_notes) VALUES
('1.0.0', 'Genesis', 'major', 'released', 'Versión inicial del sistema', 'Implementación base del sistema WMS y monitoreo'),
('1.1.0', 'Security Enhancement', 'minor', 'released', 'Mejoras de seguridad y RLS', 'Implementación completa de políticas de seguridad'),
('1.2.0', 'Version Control', 'minor', 'development', 'Sistema de control de versiones', 'Implementación del módulo de control de versiones profesional');