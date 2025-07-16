-- Crear tabla para registrar pagos a instaladores
CREATE TABLE public.pagos_instaladores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instalador_id UUID NOT NULL REFERENCES public.instaladores(id) ON DELETE CASCADE,
  servicio_id UUID REFERENCES public.servicios_monitoreo(id) ON DELETE SET NULL,
  concepto TEXT NOT NULL, -- 'instalacion', 'mantenimiento', 'reparacion', 'bono'
  monto NUMERIC(10,2) NOT NULL,
  fecha_trabajo TIMESTAMP WITH TIME ZONE NOT NULL,
  fecha_pago TIMESTAMP WITH TIME ZONE,
  estado_pago TEXT NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'procesado', 'pagado', 'rechazado'
  metodo_pago TEXT, -- 'transferencia', 'deposito', 'efectivo'
  referencia_pago TEXT,
  observaciones TEXT,
  comprobante_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Crear tabla para tracking de ubicación de instaladores
CREATE TABLE public.instalador_ubicaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instalador_id UUID NOT NULL REFERENCES public.instaladores(id) ON DELETE CASCADE,
  latitud NUMERIC(10, 8) NOT NULL,
  longitud NUMERIC(11, 8) NOT NULL,
  direccion TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tipo_ubicacion TEXT NOT NULL DEFAULT 'trabajo', -- 'trabajo', 'disponible', 'descanso'
  precision_metros INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para normas y checklist de instalación
CREATE TABLE public.normas_instalacion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_equipo TEXT NOT NULL, -- 'gps_vehicular', 'gps_personal', 'alarma', 'camara'
  nombre_norma TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  pasos_requeridos JSONB NOT NULL, -- Array de pasos con descripción, obligatorio, orden
  puntuacion_maxima INTEGER NOT NULL DEFAULT 100,
  categoria TEXT NOT NULL, -- 'seguridad', 'calidad', 'funcionalidad'
  version TEXT NOT NULL DEFAULT '1.0',
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Crear tabla para evaluaciones basadas en normas
CREATE TABLE public.evaluaciones_normas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instalacion_id UUID REFERENCES public.programacion_instalaciones(id) ON DELETE CASCADE,
  norma_id UUID NOT NULL REFERENCES public.normas_instalacion(id),
  instalador_id UUID NOT NULL REFERENCES public.instaladores(id),
  evaluador_id UUID NOT NULL REFERENCES auth.users(id),
  puntuacion_obtenida INTEGER NOT NULL,
  puntuacion_maxima INTEGER NOT NULL,
  pasos_evaluados JSONB NOT NULL, -- Resultado de cada paso del checklist
  observaciones TEXT,
  fotos_evidencia TEXT[], -- URLs de fotos
  requiere_reevaluacion BOOLEAN NOT NULL DEFAULT false,
  fecha_evaluacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para inventario asignado a instaladores
CREATE TABLE public.inventario_instalador (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instalador_id UUID NOT NULL REFERENCES public.instaladores(id) ON DELETE CASCADE,
  equipo_tipo TEXT NOT NULL, -- 'gps', 'herramienta', 'material'
  equipo_nombre TEXT NOT NULL,
  numero_serie TEXT,
  cantidad INTEGER NOT NULL DEFAULT 1,
  estado TEXT NOT NULL DEFAULT 'asignado', -- 'asignado', 'en_uso', 'danado', 'perdido', 'devuelto'
  fecha_asignacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fecha_devolucion TIMESTAMP WITH TIME ZONE,
  costo_unitario NUMERIC(10,2),
  observaciones TEXT,
  responsable_asignacion UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para métricas de performance
CREATE TABLE public.instalador_metricas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instalador_id UUID NOT NULL REFERENCES public.instaladores(id) ON DELETE CASCADE,
  periodo_inicio DATE NOT NULL,
  periodo_fin DATE NOT NULL,
  servicios_completados INTEGER NOT NULL DEFAULT 0,
  servicios_cancelados INTEGER NOT NULL DEFAULT 0,
  tiempo_promedio_instalacion INTEGER, -- minutos
  calificacion_promedio NUMERIC(3,2),
  porcentaje_puntualidad NUMERIC(5,2),
  porcentaje_calidad NUMERIC(5,2),
  ingresos_periodo NUMERIC(10,2) NOT NULL DEFAULT 0,
  horas_trabajadas INTEGER NOT NULL DEFAULT 0,
  kilometros_recorridos NUMERIC(10,2),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instalador_id, periodo_inicio, periodo_fin)
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.pagos_instaladores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instalador_ubicaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.normas_instalacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluaciones_normas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_instalador ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instalador_metricas ENABLE ROW LEVEL SECURITY;

-- Políticas para pagos_instaladores
CREATE POLICY "Admins y supply pueden gestionar pagos" ON public.pagos_instaladores
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin')
  )
);

CREATE POLICY "Instaladores pueden ver sus pagos" ON public.pagos_instaladores
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.instaladores
    WHERE id = pagos_instaladores.instalador_id
    AND user_id = auth.uid()
  )
);

-- Políticas para ubicaciones (solo admins y el instalador)
CREATE POLICY "Admins pueden ver todas las ubicaciones" ON public.instalador_ubicaciones
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin')
  )
);

CREATE POLICY "Instaladores pueden gestionar su ubicación" ON public.instalador_ubicaciones
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.instaladores
    WHERE id = instalador_ubicaciones.instalador_id
    AND user_id = auth.uid()
  )
);

-- Políticas para normas (admins gestionan, todos leen)
CREATE POLICY "Admins pueden gestionar normas" ON public.normas_instalacion
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin')
  )
);

CREATE POLICY "Usuarios autenticados pueden leer normas" ON public.normas_instalacion
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Políticas para evaluaciones de normas
CREATE POLICY "Admins y evaluadores pueden gestionar evaluaciones" ON public.evaluaciones_normas
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin')
  ) OR evaluador_id = auth.uid()
);

CREATE POLICY "Instaladores pueden ver sus evaluaciones" ON public.evaluaciones_normas
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.instaladores
    WHERE id = evaluaciones_normas.instalador_id
    AND user_id = auth.uid()
  )
);

-- Políticas para inventario
CREATE POLICY "Admins pueden gestionar inventario" ON public.inventario_instalador
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin')
  )
);

CREATE POLICY "Instaladores pueden ver su inventario" ON public.inventario_instalador
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.instaladores
    WHERE id = inventario_instalador.instalador_id
    AND user_id = auth.uid()
  )
);

-- Políticas para métricas
CREATE POLICY "Admins pueden gestionar métricas" ON public.instalador_metricas
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'supply_admin')
  )
);

CREATE POLICY "Instaladores pueden ver sus métricas" ON public.instalador_metricas
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.instaladores
    WHERE id = instalador_metricas.instalador_id
    AND user_id = auth.uid()
  )
);

-- Crear índices para mejor performance
CREATE INDEX idx_pagos_instaladores_instalador_id ON public.pagos_instaladores(instalador_id);
CREATE INDEX idx_pagos_instaladores_fecha_trabajo ON public.pagos_instaladores(fecha_trabajo);
CREATE INDEX idx_pagos_instaladores_estado ON public.pagos_instaladores(estado_pago);

CREATE INDEX idx_ubicaciones_instalador_timestamp ON public.instalador_ubicaciones(instalador_id, timestamp DESC);
CREATE INDEX idx_ubicaciones_timestamp ON public.instalador_ubicaciones(timestamp DESC);

CREATE INDEX idx_normas_tipo_equipo ON public.normas_instalacion(tipo_equipo);
CREATE INDEX idx_normas_activa ON public.normas_instalacion(activa);

CREATE INDEX idx_evaluaciones_normas_instalador ON public.evaluaciones_normas(instalador_id);
CREATE INDEX idx_evaluaciones_normas_fecha ON public.evaluaciones_normas(fecha_evaluacion);

CREATE INDEX idx_inventario_instalador_id ON public.inventario_instalador(instalador_id);
CREATE INDEX idx_inventario_estado ON public.inventario_instalador(estado);

CREATE INDEX idx_metricas_instalador_periodo ON public.instalador_metricas(instalador_id, periodo_inicio, periodo_fin);

-- Triggers para updated_at
CREATE TRIGGER update_pagos_instaladores_updated_at
  BEFORE UPDATE ON public.pagos_instaladores
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_inventario_instalador_updated_at
  BEFORE UPDATE ON public.inventario_instalador
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_normas_instalacion_updated_at
  BEFORE UPDATE ON public.normas_instalacion
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_instalador_metricas_updated_at
  BEFORE UPDATE ON public.instalador_metricas
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Insertar algunas normas de ejemplo
INSERT INTO public.normas_instalacion (tipo_equipo, nombre_norma, descripcion, pasos_requeridos, categoria) VALUES
('gps_vehicular', 'Instalación GPS Vehicular Estándar', 'Procedimiento estándar para instalación de dispositivos GPS vehiculares', 
 '[
   {"orden": 1, "descripcion": "Verificar compatibilidad del vehículo", "obligatorio": true, "puntos": 10},
   {"orden": 2, "descripcion": "Ubicar punto de alimentación 12V permanente", "obligatorio": true, "puntos": 15},
   {"orden": 3, "descripcion": "Instalar dispositivo en lugar seguro y oculto", "obligatorio": true, "puntos": 20},
   {"orden": 4, "descripcion": "Conectar cables de alimentación con fusible", "obligatorio": true, "puntos": 15},
   {"orden": 5, "descripcion": "Conectar antena GPS en posición óptima", "obligatorio": true, "puntos": 15},
   {"orden": 6, "descripcion": "Configurar dispositivo y verificar señal", "obligatorio": true, "puntos": 15},
   {"orden": 7, "descripcion": "Documentar instalación con fotos", "obligatorio": true, "puntos": 10}
 ]'::jsonb, 'calidad'),
('gps_personal', 'Instalación GPS Personal', 'Procedimiento para dispositivos GPS personales',
 '[
   {"orden": 1, "descripcion": "Verificar funcionamiento del dispositivo", "obligatorio": true, "puntos": 20},
   {"orden": 2, "descripcion": "Configurar SIM y plan de datos", "obligatorio": true, "puntos": 25},
   {"orden": 3, "descripcion": "Programar contactos de emergencia", "obligatorio": true, "puntos": 20},
   {"orden": 4, "descripcion": "Capacitar al usuario final", "obligatorio": true, "puntos": 25},
   {"orden": 5, "descripcion": "Realizar pruebas de funcionamiento", "obligatorio": true, "puntos": 10}
 ]'::jsonb, 'funcionalidad');