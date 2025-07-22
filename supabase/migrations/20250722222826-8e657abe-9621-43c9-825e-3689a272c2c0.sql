-- Políticas RLS para tablas principales del dashboard ejecutivo

-- Custodios rotación tracking
CREATE POLICY "Allow read custodios_rotacion_tracking" ON public.custodios_rotacion_tracking
FOR SELECT USING (true);

-- Servicios custodia  
CREATE POLICY "Allow read servicios_custodia" ON public.servicios_custodia
FOR SELECT USING (true);

-- Gastos externos
CREATE POLICY "Allow read gastos_externos" ON public.gastos_externos
FOR SELECT USING (true);

-- Presupuestos zona
CREATE POLICY "Allow read presupuestos_zona" ON public.presupuestos_zona
FOR SELECT USING (true);

-- Métricas canales
CREATE POLICY "Allow read metricas_canales" ON public.metricas_canales
FOR SELECT USING (true);

-- ROI custodios
CREATE POLICY "Allow read roi_custodios" ON public.roi_custodios
FOR SELECT USING (true);

-- Métricas reclutamiento
CREATE POLICY "Allow read metricas_reclutamiento" ON public.metricas_reclutamiento
FOR SELECT USING (true);

-- Zonas operación nacional
CREATE POLICY "Allow read zonas_operacion_nacional" ON public.zonas_operacion_nacional
FOR SELECT USING (true);

-- Candidatos custodios
CREATE POLICY "Allow read candidatos_custodios" ON public.candidatos_custodios
FOR SELECT USING (true);

-- Leads
CREATE POLICY "Allow read leads" ON public.leads
FOR SELECT USING (true);