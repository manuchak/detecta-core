import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { User, MessageCircle, Phone, MapPin, Target, Clock, Car, AlertCircle, CheckCircle2, Shield, Settings, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { CustodioPerformanceCard } from '@/components/planeacion/CustodioPerformanceCard';
import { CustodianContactDialog } from '../dialogs/CustodianContactDialog';
import { ConflictOverrideModal, type ConflictDetails } from '../dialogs/ConflictOverrideModal';
import { useCustodiosConProximidad, type CustodioConProximidad } from '@/hooks/useProximidadOperacional';
import type { CustodioEnriquecido } from '@/hooks/useCustodiosWithTracking';
import type { ServicioNuevo } from '@/utils/proximidadOperacional';
import { UniversalSearchBar } from '@/components/planeacion/search/UniversalSearchBar';
import { SearchResultsInfo, CUSTODIAN_CATEGORIES } from '@/components/planeacion/search/SearchResultsInfo';
import { supabase } from '@/integrations/supabase/client';
interface ServiceData {
  servicio_id?: string;
  origen?: string;
  destino?: string;
  fecha_hora_cita?: string;
  tipo_servicio?: string;
  cliente_nombre?: string;
  destino_texto?: string;
  fecha_programada?: string;
  hora_ventana_inicio?: string;
  incluye_armado?: boolean;
  requiere_gadgets?: boolean;
  gadgets_seleccionados?: string[];
  observaciones?: string;
  fecha_recepcion?: string;
  hora_recepcion?: string;
  es_ruta_reparto?: boolean;
  puntos_intermedios?: Array<{
    orden: number;
    nombre: string;
    direccion: string;
    tiempo_estimado_parada_min: number;
    observaciones?: string;
  }>;
  numero_paradas?: number;
}

interface AssignmentData extends ServiceData {
  custodio_asignado_id?: string;
  custodio_nombre?: string;
  estado_comunicacion?: 'enviado' | 'aceptado' | 'rechazado' | 'sin_responder' | 'contactar_despues';
  // Override de conflicto
  override_conflicto_motivo?: string;
  override_conflicto_detalles?: string;
}

interface ComunicacionState {
  estado: 'pendiente' | 'enviado' | 'aceptado' | 'rechazado' | 'sin_responder' | 'contactar_despues';
  metodo?: 'whatsapp' | 'llamada' | 'dialog';
  timestamp?: Date;
  razon_rechazo?: string;
  categoria_rechazo?: string;
  detalles?: string;
  contactar_en?: string;
}

interface CustodianAssignmentStepProps {
  serviceData: ServiceData;
  onComplete: (data: AssignmentData) => void;
  onBack: () => void;
}

// Helper function to convert CustodioConProximidad to CustodioEnriquecido with validation
const convertToEnriquecido = (custodio: CustodioConProximidad): CustodioEnriquecido | null => {
  console.log('🔄 Convirtiendo custodio para ContactDialog:', {
    nombre: custodio.nombre,
    id: custodio.id,
    telefono: custodio.telefono,
    allProperties: Object.keys(custodio)
  });
  
  // Validación crítica de propiedades requeridas
  if (!custodio.id) {
    console.error('❌ ERROR: Custodio sin ID:', custodio);
    toast.error(`Error: ${custodio.nombre} no tiene ID asignado`);
    return null;
  }
  
  if (!custodio.nombre) {
    console.error('❌ ERROR: Custodio sin nombre:', custodio);
    toast.error('Error: Custodio sin nombre');
    return null;
  }
  
  if (!custodio.telefono) {
    console.warn('⚠️ ADVERTENCIA: Custodio sin teléfono:', custodio.nombre);
    toast.warning(`${custodio.nombre} no tiene teléfono registrado`);
  }
  
  const converted: CustodioEnriquecido = {
    ...custodio,
    // Asegurar que todas las propiedades requeridas estén presentes
    id: custodio.id,
    nombre: custodio.nombre,
    telefono: custodio.telefono || '',
    score_comunicacion: custodio.score_comunicacion || 5.0,
    score_aceptacion: custodio.score_aceptacion || 5.0,
    score_confiabilidad: custodio.score_confiabilidad || 5.0,
    score_total: custodio.score_total || 5.0,
    tasa_aceptacion: custodio.tasa_aceptacion || 0,
    tasa_respuesta: custodio.tasa_respuesta || 0,
    tasa_confiabilidad: custodio.tasa_confiabilidad || 0,
    performance_level: 'nuevo' as const,
    rejection_risk: 'medio' as const,
    response_speed: 'normal' as const,
    experience_category: custodio.numero_servicios && custodio.numero_servicios >= 50 ? 'experimentado' : 
                        custodio.numero_servicios && custodio.numero_servicios >= 10 ? 'intermedio' :
                        custodio.numero_servicios && custodio.numero_servicios > 0 ? 'rookie' : 'nuevo'
  };
  
  console.log('✅ Custodio convertido exitosamente:', converted);
  return converted;
};

export function CustodianAssignmentStep({ serviceData, onComplete, onBack }: CustodianAssignmentStepProps) {
  const [selectedCustodio, setSelectedCustodio] = useState<string | null>(null);
  const [comunicaciones, setComunicaciones] = useState<Record<string, ComunicacionState>>({});
  
  // Search and filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    disponibles: true,
    parcialmenteOcupados: true,
    excelentes: false
  });
  
  // Estado para el diálogo de contacto
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactingCustodian, setContactingCustodian] = useState<CustodioConProximidad | null>(null);
  const [initialContactMethod, setInitialContactMethod] = useState<'whatsapp' | 'llamada' | undefined>(undefined);

  // Estado para override de conflictos
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideCustodian, setOverrideCustodian] = useState<CustodioConProximidad | null>(null);
  const [conflictSectionOpen, setConflictSectionOpen] = useState(false);

  // Preparar datos del servicio para el hook
  const servicioNuevo: ServicioNuevo = useMemo(() => ({
    origen_texto: serviceData.origen || serviceData.cliente_nombre || 'No especificado',
    destino_texto: serviceData.destino || serviceData.destino_texto || 'No especificado',
    fecha_programada: serviceData.fecha_programada || serviceData.fecha_hora_cita || new Date().toISOString(),
    hora_ventana_inicio: serviceData.hora_ventana_inicio || '09:00',
    tipo_servicio: serviceData.tipo_servicio || 'custodia',
    incluye_armado: serviceData.incluye_armado || false,
    requiere_gadgets: serviceData.requiere_gadgets || false
  }), [
    serviceData.origen,
    serviceData.cliente_nombre,
    serviceData.destino,
    serviceData.destino_texto,
    serviceData.fecha_programada,
    serviceData.fecha_hora_cita,
    serviceData.hora_ventana_inicio,
    serviceData.tipo_servicio,
    serviceData.incluye_armado,
    serviceData.requiere_gadgets
  ]);

  // Usar el hook mejorado con validación preventiva
  const { data: custodiosCategorizados, isLoading: loading } = useCustodiosConProximidad(servicioNuevo);

  // PRIORIZAR custodios por disponibilidad real (CORRECCIÓN APLICADA)
  // 1. Disponibles (sin conflictos) PRIMERO
  // 2. Parcialmente ocupados SEGUNDO  
  // 3. Filtrar completamente ocupados/con conflictos
  const custodiosDisponibles = useMemo(() => {
    if (!custodiosCategorizados) return [];
    
    // PRIORIZAR: Disponibles primero, luego parcialmente ocupados
    // FILTRAR: Ocupados y no disponibles (como Israel Mayo con conflictos)
    let priorizados = [
      // 🟢 PRIORIDAD ALTA: Custodios ideales (sin servicios)
      ...custodiosCategorizados.disponibles.sort((a, b) => (b.score_total || 0) - (a.score_total || 0)),
      
      // 🟡 PRIORIDAD MEDIA: Parcialmente ocupados (1 servicio)
      ...custodiosCategorizados.parcialmenteOcupados.sort((a, b) => (b.score_total || 0) - (a.score_total || 0))
    ];

    // Apply category filters
    if (!activeFilters.disponibles) {
      priorizados = priorizados.filter(c => !custodiosCategorizados.disponibles.includes(c));
    }
    if (!activeFilters.parcialmenteOcupados) {
      priorizados = priorizados.filter(c => !custodiosCategorizados.parcialmenteOcupados.includes(c));
    }
    if (activeFilters.excelentes) {
      priorizados = priorizados.filter(c => (c.score_total || 0) >= 8.0);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      priorizados = priorizados.filter(c => 
        c.nombre?.toLowerCase().includes(term) ||
        c.telefono?.toLowerCase().includes(term) ||
        c.zona_base?.toLowerCase().includes(term)
      );
    }
    
    console.log('🎯 Custodios filtrados:', {
      disponibles: custodiosCategorizados.disponibles.length,
      parcialmenteOcupados: custodiosCategorizados.parcialmenteOcupados.length,
      ocupados_filtrados: custodiosCategorizados.ocupados.length,
      noDisponibles_filtrados: custodiosCategorizados.noDisponibles.length,
      despues_filtros: priorizados.length
    });
    
    return priorizados;
  }, [custodiosCategorizados, searchTerm, activeFilters]);

  // Inicializar estados de comunicación SOLO para custodios disponibles
  useEffect(() => {
    if (!custodiosDisponibles.length) return;
    
    const initialComunicaciones: Record<string, ComunicacionState> = {};
    custodiosDisponibles.forEach(custodio => {
      if (custodio.id && !comunicaciones[custodio.id]) {
        initialComunicaciones[custodio.id] = {
          estado: 'pendiente'
        };
      }
    });
    setComunicaciones(prev => ({ ...prev, ...initialComunicaciones }));
  }, [custodiosDisponibles]);

  const handleOpenContactDialog = (custodian: CustodioConProximidad, method?: 'whatsapp' | 'llamada') => {
    console.log('📞 handleOpenContactDialog llamado:', {
      nombre: custodian.nombre,
      id: custodian.id,
      telefono: custodian.telefono,
      method,
      currentState: { contactDialogOpen, contactingCustodian: contactingCustodian?.nombre }
    });
    
    try {
      // Validar que el custodio tenga las propiedades mínimas
      if (!custodian || !custodian.id) {
        console.error('❌ ERROR: Custodio inválido o sin ID');
        toast.error('Error: Datos del custodio no válidos');
        return;
      }
      
      // Establecer el custodio, método y abrir el diálogo
      console.log('✅ Estableciendo contactingCustodian, método y abriendo diálogo');
      setContactingCustodian(custodian);
      setInitialContactMethod(method);
      setContactDialogOpen(true);
      
      console.log('✅ Estado actualizado - diálogo debería abrirse con método:', method);
    } catch (error) {
      console.error('❌ ERROR en handleOpenContactDialog:', error);
      toast.error('Error al abrir diálogo de contacto');
    }
  };

  const handleContactResult = (custodianId: string, result: {
    status: 'acepta' | 'rechaza' | 'contactar_despues' | 'sin_respuesta';
    razon_rechazo?: string;
    categoria_rechazo?: string;
    detalles?: string;
    contactar_en?: string;
  }) => {
    const custodian = custodiosDisponibles.find(c => c.id === custodianId);
    
    // Actualizar estado de comunicación
    setComunicaciones(prev => ({
      ...prev,
      [custodianId]: {
        estado: result.status === 'acepta' ? 'aceptado' : 
               result.status === 'rechaza' ? 'rechazado' :
               result.status === 'contactar_despues' ? 'contactar_despues' :
               'sin_responder',
        metodo: 'dialog',
        timestamp: new Date(),
        razon_rechazo: result.razon_rechazo,
        categoria_rechazo: result.categoria_rechazo,
        detalles: result.detalles,
        contactar_en: result.contactar_en
      }
    }));

    // Manejar resultado
    if (result.status === 'acepta') {
      setSelectedCustodio(custodianId);
      toast.success(`¡${custodian?.nombre} ha aceptado el servicio!`);
      
      // Auto-advance: proceder inmediatamente al siguiente paso
      console.log('🚀 Custodio aceptó, avanzando automáticamente al siguiente paso:', {
        custodianId,
        custodianName: custodian?.nombre,
        serviceId: serviceData.servicio_id
      });
      
      const assignmentData: AssignmentData = {
        ...serviceData,
        custodio_asignado_id: custodianId,
        custodio_nombre: custodian?.nombre,
        estado_comunicacion: 'aceptado'
      };
      
      // Llamar onComplete inmediatamente
      onComplete(assignmentData);
      
    } else if (result.status === 'rechaza') {
      toast.error(`${custodian?.nombre} ha rechazado el servicio: ${result.razon_rechazo}`);
    } else if (result.status === 'contactar_despues') {
      toast.info(`${custodian?.nombre} pide contactar ${result.contactar_en}`);
    } else {
      toast.warning(`${custodian?.nombre} no respondió`);
    }
  };

  // Manejar selección de custodio con conflicto (abre modal de override)
  const handleSelectCustodioConflicto = (custodio: CustodioConProximidad) => {
    console.log('⚠️ Seleccionando custodio con conflicto:', custodio.nombre);
    setOverrideCustodian(custodio);
    setOverrideModalOpen(true);
  };

  // Confirmar override de conflicto
  const handleConfirmOverride = async (motivo: string, detalles?: string) => {
    if (!overrideCustodian) return;
    
    // Validación de UUID antes de proceder
    const { isValidUUID } = await import('@/lib/validators');
    if (!isValidUUID(overrideCustodian.id)) {
      console.error('❌ ID de custodio inválido para override:', overrideCustodian.id);
      toast.error('Error: ID de custodio inválido. No se puede completar la asignación.');
      setOverrideModalOpen(false);
      setOverrideCustodian(null);
      return;
    }
    
    console.log('✅ Override confirmado:', {
      custodio: overrideCustodian.nombre,
      custodioId: overrideCustodian.id,
      motivo,
      detalles
    });
    
    // Obtener usuario actual para auditoría
    const { data: { user } } = await supabase.auth.getUser();
    
    toast.success(`Override autorizado: ${overrideCustodian.nombre} asignado con motivo "${motivo}"`);
    
    const assignmentData: AssignmentData = {
      ...serviceData,
      custodio_asignado_id: overrideCustodian.id,
      custodio_nombre: overrideCustodian.nombre,
      estado_comunicacion: 'sin_responder',
      override_conflicto_motivo: motivo,
      override_conflicto_detalles: detalles
    };
    
    setOverrideModalOpen(false);
    setOverrideCustodian(null);
    onComplete(assignmentData);
  };

  // Obtener detalles de conflicto para el modal
  const getConflictDetails = (custodio: CustodioConProximidad): ConflictDetails => {
    const indisponibilidad = custodio.indisponibilidades_activas?.[0];
    return {
      servicios_hoy: indisponibilidad?.servicios_hoy,
      conflictos_detalle: indisponibilidad?.conflictos_detalle,
      razon_no_disponible: custodio.razon_no_disponible || indisponibilidad?.motivo
    };
  };

  // Custodios con conflictos (ocupados + no disponibles)
  const custodiosConConflicto = useMemo(() => {
    if (!custodiosCategorizados) return [];
    return [
      ...custodiosCategorizados.ocupados,
      ...custodiosCategorizados.noDisponibles
    ];
  }, [custodiosCategorizados]);

  const handleComplete = () => {
    if (!selectedCustodio) return;

    const custodio = custodiosDisponibles.find(c => c.id === selectedCustodio);
    const comunicacion = comunicaciones[selectedCustodio];

    // YA NO HAY CONFLICTOS - todos los custodios mostrados están disponibles

    const assignmentData: AssignmentData = {
      ...serviceData,
      custodio_asignado_id: selectedCustodio,
      custodio_nombre: custodio?.nombre,
      estado_comunicacion: (comunicacion?.estado === 'pendiente' ? 'sin_responder' : comunicacion?.estado) as 'enviado' | 'aceptado' | 'rechazado' | 'sin_responder' | 'contactar_despues'
    };

    onComplete(assignmentData);
  };

  const getAvailabilityCategory = (custodio: CustodioConProximidad) => {
    if (!custodiosCategorizados) return 'disponible';
    
    if (custodiosCategorizados.disponibles.includes(custodio)) return 'disponible';
    if (custodiosCategorizados.parcialmenteOcupados.includes(custodio)) return 'parcialmente_ocupado';
    if (custodiosCategorizados.ocupados.includes(custodio)) return 'ocupado';
    
    return 'no_disponible';
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { variant: 'outline' | 'secondary' | 'success' | 'destructive', text: string }> = {
      pendiente: { variant: 'outline' as const, text: 'Pendiente' },
      enviado: { variant: 'secondary' as const, text: 'Enviado' },
      aceptado: { variant: 'success' as const, text: 'Aceptado' },
      rechazado: { variant: 'destructive' as const, text: 'Rechazado' },
      sin_responder: { variant: 'outline' as const, text: 'Sin responder' },
      contactar_despues: { variant: 'secondary' as const, text: 'Contactar después' }
    };
    
    return variants[estado] || variants.pendiente;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              3. Asignación de Custodio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Buscando custodios disponibles...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            3. Asignación de Custodio
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Service Summary */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2">Resumen del Servicio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>ID:</strong> {serviceData.servicio_id || 'No especificado'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>Ruta:</strong> {serviceData.origen || serviceData.cliente_nombre} → {serviceData.destino || serviceData.destino_texto}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>Fecha:</strong> {serviceData.fecha_programada || serviceData.fecha_hora_cita || 'Por definir'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>Tipo:</strong> {serviceData.tipo_servicio || 'Custodia'}
                </span>
              </div>
              {serviceData.incluye_armado && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-amber-600">Requiere armado</span>
                </div>
              )}
            </div>
          </div>

          {/* 🆕 INFORMACIÓN DE RUTA MULTI-PUNTO */}
          {serviceData.es_ruta_reparto && serviceData.puntos_intermedios && serviceData.puntos_intermedios.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  Ruta de Reparto - {serviceData.numero_paradas} paradas
                </h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">1</Badge>
                  <div>
                    <strong>Origen:</strong> {serviceData.origen || serviceData.cliente_nombre}
                  </div>
                </div>
                {serviceData.puntos_intermedios.map((punto, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">{index + 2}</Badge>
                    <div>
                      <strong>{punto.nombre || `Parada ${index + 1}`}:</strong> {punto.direccion}
                      <span className="text-muted-foreground ml-2">
                        (~{punto.tiempo_estimado_parada_min} min)
                      </span>
                    </div>
                  </div>
                ))}
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">
                    {serviceData.puntos_intermedios.length + 2}
                  </Badge>
                  <div>
                    <strong>Destino final:</strong> {serviceData.destino || serviceData.destino_texto}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2">
                  <AlertCircle className="h-3 w-3" />
                  El mismo custodio realizará toda la ruta completa
                </p>
              </div>
            </div>
          )}


          {/* Search Bar */}
          <UniversalSearchBar
            placeholder="Buscar por nombre, teléfono o zona..."
            value={searchTerm}
            onChange={setSearchTerm}
            filters={[
              {
                id: 'disponibles',
                label: '🟢 Disponibles',
                value: 'disponibles',
                active: activeFilters.disponibles,
                variant: 'success'
              },
              {
                id: 'parcialmenteOcupados',
                label: '🟡 Parcialmente Ocupados',
                value: 'parcialmenteOcupados',
                active: activeFilters.parcialmenteOcupados,
                variant: 'secondary'
              },
              {
                id: 'excelentes',
                label: '⭐ Score ≥ 8.0',
                value: 'excelentes',
                active: activeFilters.excelentes,
                variant: 'default'
              }
            ]}
            onFilterToggle={(filterId) => {
              setActiveFilters(prev => ({
                ...prev,
                [filterId]: !prev[filterId]
              }));
            }}
            onClearAll={() => {
              setSearchTerm('');
              setActiveFilters({
                disponibles: true,
                parcialmenteOcupados: true,
                excelentes: false
              });
            }}
            resultsCount={custodiosDisponibles.length}
            totalCount={(custodiosCategorizados?.disponibles.length || 0) + (custodiosCategorizados?.parcialmenteOcupados.length || 0)}
            className="mb-4"
          />

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">{custodiosDisponibles.length}</div>
                <p className="text-sm text-muted-foreground">Mostrados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {custodiosCategorizados?.disponibles.length || 0}
                </div>
                <p className="text-sm text-muted-foreground">🟢 Ideales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {custodiosCategorizados?.parcialmenteOcupados.length || 0}
                </div>
                <p className="text-sm text-muted-foreground">🟡 Ocupados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">
                  {(custodiosCategorizados?.ocupados.length || 0) + (custodiosCategorizados?.noDisponibles.length || 0)}
                </div>
                <p className="text-sm text-muted-foreground">🔴 Filtrados</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Custodians List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Custodios Priorizados (Disponibles Sin Conflictos)</span>
            {custodiosDisponibles.length > 0 && (
              <Badge variant="secondary">
                {custodiosDisponibles.length} priorizados
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {custodiosDisponibles.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay custodios disponibles sin conflictos</h3>
              <p className="text-muted-foreground mb-4">
                Todos los custodios tienen conflictos horarios, están ocupados o fuera de límites operacionales.
                {custodiosCategorizados && (
                  <span className="block mt-2 text-sm">
                    Ocupados: {custodiosCategorizados.ocupados.length} • 
                    Con conflictos: {custodiosCategorizados.noDisponibles.length}
                  </span>
                )}
              </p>
              <Button variant="outline" onClick={onBack}>
                Volver atrás y ajustar horario
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {custodiosDisponibles.map((custodio) => {
                const comunicacion = comunicaciones[custodio.id!] || { estado: 'pendiente' };
                const badge = getEstadoBadge(comunicacion.estado);
                const isSelected = selectedCustodio === custodio.id;
                const availabilityCategory = getAvailabilityCategory(custodio);

                return (
                  <div
                    key={custodio.id}
                    className="border rounded-lg p-4 transition-all hover:shadow-md border-border hover:border-primary/50"
                  >
                    <CustodioPerformanceCard 
                      custodio={custodio}
                      compact={true}
                      selected={isSelected}
                      onSelect={() => setSelectedCustodio(custodio.id!)}
                      availabilityStatus={availabilityCategory}
                      disabled={false} // Todos están disponibles
                    />

                    {/* Status badges */}
                    <div className="flex items-center justify-between mt-3">
                      <Badge {...badge}>
                        {badge.text}
                      </Badge>
                      
                      <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Sin conflictos
                      </Badge>
                    </div>

                    {/* Contact Buttons */}
                    {comunicacion.estado === 'pendiente' && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenContactDialog(custodio, 'whatsapp')}
                          className="flex items-center gap-1.5 flex-1"
                        >
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenContactDialog(custodio, 'llamada')}
                          className="flex items-center gap-1.5 flex-1"
                        >
                          <Phone className="h-4 w-4" />
                          Llamar
                        </Button>
                      </div>
                    )}

                    {/* Rejection Details */}
                    {comunicacion.estado === 'rechazado' && comunicacion.razon_rechazo && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                        <div className="text-xs text-red-800">
                          <strong>Razón:</strong> {comunicacion.razon_rechazo}
                        </div>
                      </div>
                    )}

                    {/* Contact After Details */}
                    {comunicacion.estado === 'contactar_despues' && comunicacion.contactar_en && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="text-xs text-yellow-800">
                          <strong>Contactar:</strong> {comunicacion.contactar_en}
                        </div>
                      </div>
                    )}

                    {/* Información de equidad si existe */}
                    {custodio.datos_equidad && (
                      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="text-xs text-blue-800">
                          Servicios hoy: {custodio.datos_equidad.servicios_hoy} • 
                          Score equidad: {custodio.datos_equidad.score_equidad}/100 •
                          Balance: {custodio.datos_equidad.balance_recommendation}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sección colapsable: Custodios con conflicto */}
      {custodiosConConflicto.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <Collapsible open={conflictSectionOpen} onOpenChange={setConflictSectionOpen}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
                >
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">
                      Ver {custodiosConConflicto.length} custodio(s) con conflicto horario
                    </span>
                  </div>
                  {conflictSectionOpen ? (
                    <ChevronUp className="h-4 w-4 text-amber-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-amber-600" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
                  <p className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                    <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Estos custodios tienen conflictos de horario detectados. Solo debes asignarlos
                      si tienes certeza operativa (ej: servicio de retorno, servicio secuencial).
                      La asignación quedará registrada para auditoría.
                    </span>
                  </p>
                </div>
                
                <div className="space-y-3">
                  {custodiosConConflicto.map((custodio) => (
                    <div
                      key={custodio.id}
                      className="border border-amber-200 dark:border-amber-700 rounded-lg p-4 bg-amber-50/50 dark:bg-amber-950/20"
                    >
                      <CustodioPerformanceCard 
                        custodio={custodio}
                        compact={true}
                        selected={false}
                        onSelect={() => {}}
                        availabilityStatus="no_disponible"
                        disabled={true}
                      />
                      
                      {/* Razón del conflicto */}
                      <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 rounded-md">
                        <div className="text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>
                            {custodio.razon_no_disponible || 
                             custodio.indisponibilidades_activas?.[0]?.motivo ||
                             'Conflicto de horario detectado'}
                          </span>
                        </div>
                        {custodio.indisponibilidades_activas?.[0]?.servicios_hoy !== undefined && (
                          <Badge variant="outline" className="mt-1 text-amber-700 border-amber-400 text-xs">
                            {custodio.indisponibilidades_activas[0].servicios_hoy} servicio(s) hoy
                          </Badge>
                        )}
                      </div>
                      
                      {/* Botón de override */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSelectCustodioConflicto(custodio)}
                        className="mt-3 w-full border-amber-400 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-900/40"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Asignar con justificación (Override)
                      </Button>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={onBack}>
              Volver
            </Button>
            
            <div className="text-sm text-muted-foreground">
              {selectedCustodio ? 'Custodio seleccionado' : 'Selecciona un custodio'}
            </div>
            
            <Button
              onClick={handleComplete}
              disabled={!selectedCustodio}
              className="min-w-[120px]"
            >
              {selectedCustodio ? 'Continuar' : 'Selecciona custodio'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact Dialog */}
      {contactingCustodian && (() => {
        console.log('🎬 Renderizando CustodianContactDialog:', {
          contactDialogOpen,
          custodianName: contactingCustodian.nombre,
          custodianId: contactingCustodian.id,
          initialMethod: initialContactMethod
        });
        
        const convertedCustodian = convertToEnriquecido(contactingCustodian);
        
        if (!convertedCustodian) {
          console.error('❌ No se pudo convertir el custodio');
          return null;
        }
        
        return (
          <CustodianContactDialog
            open={contactDialogOpen}
            onOpenChange={(open) => {
              console.log('🔄 CustodianContactDialog onOpenChange:', open);
              setContactDialogOpen(open);
              if (!open) {
                setInitialContactMethod(undefined);
              }
            }}
            custodian={convertedCustodian}
            serviceDetails={{
              origen: serviceData.origen || '',
              destino: serviceData.destino || '',
              fecha_hora: serviceData.fecha_hora_cita || serviceData.fecha_programada || '',
              tipo_servicio: serviceData.tipo_servicio || 'Custodia'
            }}
            initialMethod={initialContactMethod}
            onResult={(result) => {
              console.log('📋 Resultado del contacto:', result);
              handleContactResult(contactingCustodian.id!, result);
            }}
          />
        );
      })()}

      {/* Modal de Override de Conflicto */}
      {overrideCustodian && (
        <ConflictOverrideModal
          open={overrideModalOpen}
          onOpenChange={(open) => {
            setOverrideModalOpen(open);
            if (!open) {
              setOverrideCustodian(null);
            }
          }}
          custodioNombre={overrideCustodian.nombre}
          custodioId={overrideCustodian.id!}
          conflictDetails={getConflictDetails(overrideCustodian)}
          onConfirm={handleConfirmOverride}
        />
      )}
    </div>
  );
}