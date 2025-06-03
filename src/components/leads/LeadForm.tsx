import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Car, MapPin, Briefcase, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { PersonalInfoForm } from "./forms/PersonalInfoForm";
import { LocationForm } from "./forms/LocationForm";
import { VehicleForm } from "./forms/VehicleForm";
import { ExperienceForm } from "./forms/ExperienceForm";
import { ReferralForm } from "./forms/ReferralForm";

interface LeadFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormData {
  // Datos personales
  nombre: string;
  email: string;
  telefono: string;
  edad: string;
  direccion: string;
  estado_id: string;
  ciudad_id: string;
  zona_trabajo_id: string;
  // Tipo de custodio
  tipo_custodio: string;
  // Datos del vehículo (condicionales)
  marca_vehiculo: string;
  modelo_vehiculo: string;
  año_vehiculo: string;
  placas: string;
  color_vehiculo: string;
  tipo_vehiculo: string;
  seguro_vigente: string;
  // Datos de custodios armados
  licencia_armas: string;
  experiencia_militar: string;
  años_experiencia_armada: string;
  // Datos de custodios abordo
  especialidad_abordo: string;
  // Experiencia general
  experiencia_custodia: string;
  años_experiencia: string;
  empresas_anteriores: string;
  licencia_conducir: string;
  tipo_licencia: string;
  antecedentes_penales: string;
  disponibilidad_horario: string;
  disponibilidad_dias: string;
  mensaje: string;
  referencias: string;
  estado_solicitud: string;
  fuente: string;
}

interface ReferralData {
  custodio_referente_id: string;
  custodio_referente_nombre: string;
}

const ETAPAS = [
  { id: 'personal', titulo: 'Datos Personales', icono: User },
  { id: 'ubicacion', titulo: 'Ubicación', icono: MapPin },
  { id: 'vehiculo', titulo: 'Tipo y Vehículo', icono: Car },
  { id: 'experiencia', titulo: 'Experiencia', icono: Briefcase },
  { id: 'referido', titulo: 'Referencia', icono: Users }
];

export const LeadForm = ({ onSuccess, onCancel }: LeadFormProps) => {
  const [etapaActual, setEtapaActual] = useState(0);
  const [loading, setLoading] = useState(false);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    // Datos personales
    nombre: "",
    email: "",
    telefono: "",
    edad: "",
    direccion: "",
    estado_id: "",
    ciudad_id: "",
    zona_trabajo_id: "",
    // Tipo de custodio
    tipo_custodio: "",
    // Datos del vehículo
    marca_vehiculo: "",
    modelo_vehiculo: "",
    año_vehiculo: "",
    placas: "",
    color_vehiculo: "",
    tipo_vehiculo: "",
    seguro_vigente: "",
    // Datos de custodios armados
    licencia_armas: "",
    experiencia_militar: "",
    años_experiencia_armada: "",
    // Datos de custodios abordo
    especialidad_abordo: "",
    // Experiencia general
    experiencia_custodia: "",
    años_experiencia: "",
    empresas_anteriores: "",
    licencia_conducir: "",
    tipo_licencia: "",
    antecedentes_penales: "",
    disponibilidad_horario: "",
    disponibilidad_dias: "",
    mensaje: "",
    referencias: "",
    estado_solicitud: "nuevo",
    fuente: "web"
  });

  // Verificar acceso con diagnóstico detallado
  useState(() => {
    const checkAccess = async () => {
      try {
        console.log('🔍 Iniciando verificación de acceso...');
        
        // 1. Verificar usuario autenticado
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('👤 Usuario actual:', { user: user?.email, id: user?.id, error: userError });
        
        if (userError || !user) {
          console.error('❌ Error de autenticación:', userError);
          setHasAccess(false);
          setDebugInfo({ error: 'No autenticado', userError });
          return;
        }

        // 2. Verificar función is_current_user_admin
        const { data: isAdmin, error: adminError } = await supabase.rpc('is_current_user_admin');
        console.log('🔐 Verificación admin:', { isAdmin, adminError });
        
        // 3. Verificar roles del usuario
        const { data: userRoles, error: rolesError } = await supabase.rpc('get_user_roles');
        console.log('👥 Roles del usuario:', { userRoles, rolesError });
        
        // 4. Verificar tabla user_roles directamente
        const { data: directRoles, error: directError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        console.log('📋 Roles directos:', { directRoles, directError });

        // 5. Prueba de inserción simple en tabla leads (para diagnóstico)
        console.log('🧪 Probando permisos de inserción...');
        const testData = {
          nombre: 'Test Usuario',
          email: 'test@example.com',
          telefono: '1234567890',
          empresa: 'Test Company',
          mensaje: 'Test message',
          estado: 'nuevo',
          fuente: 'web'
        };
        
        const { data: testInsert, error: testError } = await supabase
          .from('leads')
          .insert(testData)
          .select()
          .single();
        
        if (testError) {
          console.error('❌ Error en prueba de inserción:', testError);
        } else {
          console.log('✅ Prueba de inserción exitosa:', testInsert);
          // Eliminar el registro de prueba
          await supabase.from('leads').delete().eq('id', testInsert.id);
        }

        setDebugInfo({
          user: user?.email,
          userId: user?.id,
          isAdmin,
          adminError,
          userRoles,
          rolesError,
          directRoles,
          directError,
          testError: testError?.message || 'No error',
          canInsert: !testError
        });

        const hasAdminAccess = isAdmin || false;
        setHasAccess(hasAdminAccess);
        
        setUserInfo({
          user_email: user?.email || 'No disponible',
          user_roles: Array.isArray(userRoles) ? userRoles.map((r: any) => r?.role).filter(Boolean) : [],
          is_admin: isAdmin,
          direct_roles: directRoles?.map(r => r.role) || []
        });

        if (!hasAdminAccess) {
          toast({
            title: "Acceso denegado",
            description: "No tienes permisos para crear candidatos.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('💥 Error crítico en checkAccess:', error);
        setHasAccess(false);
        setDebugInfo({ criticalError: error });
      }
    };
    
    checkAccess();
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (field === 'estado_id') {
        newData.ciudad_id = "";
        newData.zona_trabajo_id = "";
      } else if (field === 'ciudad_id') {
        newData.zona_trabajo_id = "";
      }
      
      return newData;
    });
  };

  const validarEtapa = (etapa: number): boolean => {
    switch (etapa) {
      case 0: 
        return !!(formData.nombre && formData.email && formData.telefono);
      case 1: 
        return !!(formData.estado_id && formData.ciudad_id && formData.direccion);
      case 2: 
        if (!formData.tipo_custodio) return false;
        
        const requiereVehiculo = formData.tipo_custodio === 'custodio_vehiculo' || formData.tipo_custodio === 'armado_vehiculo';
        const esArmado = formData.tipo_custodio === 'armado' || formData.tipo_custodio === 'armado_vehiculo';
        
        if (requiereVehiculo) {
          if (!formData.marca_vehiculo || !formData.seguro_vigente) return false;
        }
        
        if (esArmado) {
          if (!formData.licencia_armas) return false;
        }
        
        return true;
      case 3: 
        return true; 
      case 4: 
        return true;
      default:
        return true;
    }
  };

  const siguienteEtapa = () => {
    if (validarEtapa(etapaActual)) {
      setEtapaActual(prev => Math.min(prev + 1, ETAPAS.length - 1));
    } else {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa los campos obligatorios antes de continuar.",
        variant: "destructive",
      });
    }
  };

  const anteriorEtapa = () => {
    setEtapaActual(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📤 Iniciando envío del formulario...');
    console.log('📋 Datos del formulario:', formData);
    console.log('🔍 Debug info:', debugInfo);
    
    if (!validarEtapa(etapaActual)) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Verificar usuario antes de continuar
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }
      
      console.log('👤 Usuario confirmado para inserción:', user.email);

      // ... keep existing code (location name resolution)
      let estadoNombre = '';
      let ciudadNombre = '';
      let zonaNombre = '';

      if (formData.estado_id) {
        const { data: estados } = await supabase
          .from('estados')
          .select('nombre')
          .eq('id', formData.estado_id)
          .single();
        estadoNombre = estados?.nombre || '';
      }

      if (formData.ciudad_id) {
        const { data: ciudades } = await supabase
          .from('ciudades')
          .select('nombre')
          .eq('id', formData.ciudad_id)
          .single();
        ciudadNombre = ciudades?.nombre || '';
      }

      const zonaMap: Record<string, string> = {
        'local': 'Local',
        'foraneo_corto': 'Foráneo Corto',
        'foraneo': 'Foráneo'
      };
      zonaNombre = zonaMap[formData.zona_trabajo_id] || formData.zona_trabajo_id;

      console.log('💾 Insertando lead...');
      const leadInsertData = {
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        empresa: "Candidato a Custodio",
        mensaje: formData.mensaje,
        estado: formData.estado_solicitud,
        fuente: formData.fuente
      };
      
      console.log('📝 Datos de inserción del lead:', leadInsertData);

      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .insert(leadInsertData)
        .select()
        .single();

      if (leadError) {
        console.error('❌ Error insertando lead:', leadError);
        throw new Error(`Error al crear lead: ${leadError.message}`);
      }

      console.log('✅ Lead creado exitosamente:', leadData);

      // ... keep existing code (candidate details creation and update)
      const candidateDetails: any = {
        lead_id: leadData.id,
        tipo_custodio: formData.tipo_custodio,
        datos_personales: {
          edad: formData.edad,
          direccion: formData.direccion,
          estado: estadoNombre,
          ciudad: ciudadNombre,
          zona_trabajo: zonaNombre,
          estado_id: formData.estado_id,
          ciudad_id: formData.ciudad_id,
          zona_trabajo_id: formData.zona_trabajo_id
        },
        experiencia: {
          experiencia_custodia: formData.experiencia_custodia,
          años_experiencia: formData.años_experiencia,
          empresas_anteriores: formData.empresas_anteriores,
          licencia_conducir: formData.licencia_conducir,
          tipo_licencia: formData.tipo_licencia,
          antecedentes_penales: formData.antecedentes_penales
        },
        disponibilidad: {
          horario: formData.disponibilidad_horario,
          dias: formData.disponibilidad_dias,
          zona_trabajo: zonaNombre
        },
        referencias: formData.referencias,
        referido: referralData ? {
          custodio_referente_id: referralData.custodio_referente_id,
          custodio_referente_nombre: referralData.custodio_referente_nombre
        } : null
      };

      const requiereVehiculo = formData.tipo_custodio === 'custodio_vehiculo' || formData.tipo_custodio === 'armado_vehiculo';
      const esArmado = formData.tipo_custodio === 'armado' || formData.tipo_custodio === 'armado_vehiculo';

      if (requiereVehiculo) {
        candidateDetails.vehiculo = {
          marca: formData.marca_vehiculo,
          modelo: formData.modelo_vehiculo,
          año: formData.año_vehiculo,
          placas: formData.placas,
          color: formData.color_vehiculo,
          tipo: formData.tipo_vehiculo,
          seguro_vigente: formData.seguro_vigente
        };
      }

      if (esArmado) {
        candidateDetails.seguridad_armada = {
          licencia_armas: formData.licencia_armas,
          experiencia_militar: formData.experiencia_militar,
          años_experiencia_armada: formData.años_experiencia_armada
        };
      }

      if (formData.tipo_custodio === 'abordo') {
        candidateDetails.custodio_abordo = {
          especialidad: formData.especialidad_abordo
        };
      }

      console.log('📝 Actualizando lead con detalles del candidato...');
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          notas: JSON.stringify(candidateDetails)
        })
        .eq('id', leadData.id);

      if (updateError) {
        console.error('❌ Error actualizando lead:', updateError);
        throw updateError;
      }

      console.log('✅ Lead actualizado con detalles del candidato');

      // ... keep existing code (referral handling and success message)
      if (referralData) {
        const { error: referralError } = await supabase
          .from('referidos')
          .insert({
            custodio_referente_id: referralData.custodio_referente_id,
            candidato_referido_id: leadData.id,
            estado_referido: 'pendiente',
            notas: `Candidato ${formData.tipo_custodio} referido por ${referralData.custodio_referente_nombre}`
          });

        if (referralError) {
          console.error('Error creating referral record:', referralError);
        }
      }

      const tipoTexto = {
        'custodio_vehiculo': 'custodio con vehículo',
        'armado': 'custodio armado',
        'armado_vehiculo': 'custodio armado con vehículo',
        'abordo': 'custodio abordo'
      }[formData.tipo_custodio] || 'candidato';

      toast({
        title: "Candidato registrado",
        description: referralData 
          ? `El ${tipoTexto} ha sido registrado exitosamente con referencia de ${referralData.custodio_referente_nombre}.`
          : `La información del ${tipoTexto} ha sido guardada exitosamente.`,
      });

      onSuccess?.();
    } catch (error) {
      console.error('💥 Error crítico creando lead:', error);
      toast({
        title: "Error",
        description: `No se pudo guardar la información del candidato: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderEtapaActual = () => {
    switch (etapaActual) {
      case 0:
        return <PersonalInfoForm formData={formData} onInputChange={handleInputChange} />;
      case 1:
        return <LocationForm formData={formData} onInputChange={handleInputChange} />;
      case 2:
        return <VehicleForm formData={formData} onInputChange={handleInputChange} />;
      case 3:
        return <ExperienceForm formData={formData} onInputChange={handleInputChange} />;
      case 4:
        return <ReferralForm onReferralChange={setReferralData} />;
      default:
        return null;
    }
  };

  const EtapaActualIcon = ETAPAS[etapaActual].icono;

  // Mostrar mensaje si no hay acceso
  if (hasAccess === false) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Acceso requerido</CardTitle>
          <CardDescription>
            No tienes permisos suficientes para acceder al formulario de candidatos.
            {userInfo && (
              <div className="mt-2 text-sm">
                <p>Email: {userInfo.user_email || 'No disponible'}</p>
                <p>Roles: {userInfo.user_roles?.join(', ') || 'Sin roles asignados'}</p>
                <p>Roles directos: {userInfo.direct_roles?.join(', ') || 'Sin roles'}</p>
                <p>Admin: {userInfo.is_admin ? 'Sí' : 'No'}</p>
              </div>
            )}
            {debugInfo && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                <p><strong>Debug Info:</strong></p>
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Mostrar loading mientras se verifica el acceso
  if (hasAccess === null) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Verificando permisos...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <EtapaActualIcon className="h-5 w-5" />
          Registro de Candidato - {ETAPAS[etapaActual].titulo}
        </CardTitle>
        <CardDescription>
          Etapa {etapaActual + 1} de {ETAPAS.length}: {ETAPAS[etapaActual].titulo}
        </CardDescription>
        
        <div className="flex gap-2 mt-4">
          {ETAPAS.map((etapa, index) => (
            <div
              key={etapa.id}
              className={`flex-1 h-2 rounded-full ${
                index <= etapaActual ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {renderEtapaActual()}

          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={anteriorEtapa}
              disabled={etapaActual === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <div className="flex gap-3">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
              
              {etapaActual < ETAPAS.length - 1 ? (
                <Button type="button" onClick={siguienteEtapa}>
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar Candidato
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
