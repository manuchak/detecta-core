import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FileSignature, ChevronDown, ChevronRight, User, Car, Receipt, Shield, Landmark, Users } from 'lucide-react';
import { 
  usePlantillasContrato, 
  useGenerarContrato, 
  CONTRATO_LABELS, 
  TipoContrato,
  getDatosInterpolacion
} from '@/hooks/useContratosCandidato';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Tipos que requieren datos vehiculares
const TIPOS_VEHICULARES: TipoContrato[] = ['prestacion_servicios_propietario', 'prestacion_servicios_no_propietario', 'anexo_gps'];

// Tipos que requieren datos bancarios
const TIPOS_BANCARIOS: TipoContrato[] = ['prestacion_servicios_propietario', 'prestacion_servicios_no_propietario'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidatoId: string;
  candidatoNombre: string;
  tipoContrato: TipoContrato;
  onSuccess: () => void;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, icon, defaultOpen = true, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        className="flex items-center gap-2 w-full p-3 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {icon}
        <span className="flex-1">{title}</span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && <div className="p-3 pt-0 space-y-3">{children}</div>}
    </div>
  );
}

function FieldInput({ label, value, onChange, disabled = false }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        disabled={disabled}
        className="h-8 text-sm"
      />
    </div>
  );
}

export function ContractGenerateDialog({ 
  open, 
  onOpenChange, 
  candidatoId, 
  candidatoNombre,
  tipoContrato,
  onSuccess 
}: Props) {
  const [datos, setDatos] = useState<Record<string, string>>({});
  const { data: plantillas } = usePlantillasContrato();
  const generarContrato = useGenerarContrato();
  const { user } = useAuth();

  const plantilla = plantillas?.find(p => p.tipo_contrato === tipoContrato);
  const requiereDatosVehiculares = TIPOS_VEHICULARES.includes(tipoContrato);
  const requiereDatosBancarios = TIPOS_BANCARIOS.includes(tipoContrato);
  const esNoPropietario = tipoContrato === 'prestacion_servicios_no_propietario';
  const esContratoSimple = tipoContrato === 'aviso_privacidad';
  const esConfidencialidad = tipoContrato === 'confidencialidad';

  useEffect(() => {
    const loadData = async () => {
      // Cargar datos del candidato
      const { data: candidato } = await supabase
        .from('candidatos_custodios')
        .select('*')
        .eq('id', candidatoId)
        .single();

      // Cargar datos del analista (usuario autenticado)
      let analistaData = { nombre: '[PENDIENTE]', email: '[PENDIENTE]' };
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, email')
          .eq('id', user.id)
          .single();
        if (profile) {
          analistaData = {
            nombre: profile.display_name || '[PENDIENTE]',
            email: profile.email || user.email || '[PENDIENTE]'
          };
        }
      }

      if (candidato) {
        const datosBase = getDatosInterpolacion({
          nombre: candidato.nombre,
          email: candidato.email || undefined,
          telefono: candidato.telefono || undefined,
          direccion: candidato.direccion || undefined,
          curp: (candidato as any).curp || undefined,
          numero_licencia: candidato.numero_licencia || undefined,
          licencia_expedida_por: candidato.licencia_expedida_por || undefined,
          marca_vehiculo: candidato.marca_vehiculo || undefined,
          modelo_vehiculo: candidato.modelo_vehiculo || undefined,
          numero_serie: candidato.numero_serie || undefined,
          placas: candidato.placas_vehiculo || undefined,
          color_vehiculo: candidato.color_vehiculo || undefined,
          numero_motor: candidato.numero_motor || undefined,
          clave_vehicular: candidato.clave_vehicular || undefined,
          verificacion_vehicular: candidato.verificacion_vehicular || undefined,
          tarjeta_circulacion: candidato.tarjeta_circulacion || undefined,
          numero_factura: candidato.numero_factura || undefined,
          fecha_factura: candidato.fecha_factura || undefined,
          factura_emitida_a: candidato.factura_emitida_a || undefined,
          numero_poliza: candidato.numero_poliza || undefined,
          aseguradora: candidato.aseguradora || undefined,
          fecha_poliza: candidato.fecha_poliza || undefined,
          poliza_emitida_a: candidato.poliza_emitida_a || undefined,
          tipo_poliza: candidato.tipo_poliza || undefined,
          banco: candidato.banco || undefined,
          numero_cuenta: candidato.numero_cuenta || undefined,
          clabe: candidato.clabe || undefined,
          beneficiario: candidato.beneficiario || undefined,
          nombre_propietario_vehiculo: candidato.nombre_propietario_vehiculo || undefined,
        }, analistaData);
        setDatos(datosBase);
      }
    };

    if (open && candidatoId) {
      loadData();
    }
  }, [open, candidatoId, user?.id]);

  const updateField = (key: string, value: string) => {
    setDatos(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!plantilla) return;

    await generarContrato.mutateAsync({
      candidatoId,
      tipoContrato,
      plantillaId: plantilla.id,
      datosInterpolados: datos
    });

    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Generar {CONTRATO_LABELS[tipoContrato]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Verifica los datos que se incluirán en el contrato:
          </p>

          {/* Datos Personales - siempre visible */}
          <CollapsibleSection title="Datos Personales" icon={<User className="h-4 w-4" />}>
            <FieldInput label="Nombre completo" value={datos.nombre_completo || ''} onChange={v => updateField('nombre_completo', v)} />
            <FieldInput label="CURP" value={datos.curp || ''} onChange={v => updateField('curp', v)} />
            {!esContratoSimple && (
              <FieldInput label="Dirección (igual a INE)" value={datos.direccion || ''} onChange={v => updateField('direccion', v)} />
            )}
            {(requiereDatosVehiculares || esConfidencialidad) && (
              <>
                <FieldInput label="Email" value={datos.email_custodio || ''} onChange={v => updateField('email_custodio', v)} />
                <FieldInput label="Teléfono" value={datos.telefono || ''} onChange={v => updateField('telefono', v)} />
              </>
            )}
          </CollapsibleSection>

          {/* Datos del Analista - auto, no editable para contratos de prestación */}
          {requiereDatosVehiculares && (
            <CollapsibleSection title="Datos del Analista" icon={<Users className="h-4 w-4" />} defaultOpen={false}>
              <FieldInput label="Nombre analista" value={datos.nombre_analista || ''} onChange={v => updateField('nombre_analista', v)} disabled />
              <FieldInput label="Email analista" value={datos.email_analista || ''} onChange={v => updateField('email_analista', v)} disabled />
              <FieldInput label="Fecha de contratación" value={datos.fecha_contratacion || ''} onChange={v => updateField('fecha_contratacion', v)} disabled />
            </CollapsibleSection>
          )}

          {/* Licencia y Vehículo */}
          {requiereDatosVehiculares && (
            <CollapsibleSection title="Licencia y Vehículo" icon={<Car className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-2">
                <FieldInput label="Número de licencia" value={datos.numero_licencia || ''} onChange={v => updateField('numero_licencia', v)} />
                <FieldInput label="Expedida por" value={datos.licencia_expedida_por || ''} onChange={v => updateField('licencia_expedida_por', v)} />
                <FieldInput label="Marca" value={datos.marca_vehiculo || ''} onChange={v => updateField('marca_vehiculo', v)} />
                <FieldInput label="Modelo" value={datos.modelo_vehiculo || ''} onChange={v => updateField('modelo_vehiculo', v)} />
                <FieldInput label="Número de serie" value={datos.numero_serie || ''} onChange={v => updateField('numero_serie', v)} />
                <FieldInput label="Clave vehicular" value={datos.clave_vehicular || ''} onChange={v => updateField('clave_vehicular', v)} />
                <FieldInput label="Verificación vehicular" value={datos.verificacion_vehicular || ''} onChange={v => updateField('verificacion_vehicular', v)} />
                <FieldInput label="Número de motor" value={datos.numero_motor || ''} onChange={v => updateField('numero_motor', v)} />
                <FieldInput label="Placas" value={datos.placas || ''} onChange={v => updateField('placas', v)} />
                <FieldInput label="Color" value={datos.color_vehiculo || ''} onChange={v => updateField('color_vehiculo', v)} />
              </div>
              <FieldInput label="Tarjeta de circulación" value={datos.tarjeta_circulacion || ''} onChange={v => updateField('tarjeta_circulacion', v)} />
            </CollapsibleSection>
          )}

          {/* Factura del Vehículo */}
          {requiereDatosVehiculares && (
            <CollapsibleSection title="Factura del Vehículo" icon={<Receipt className="h-4 w-4" />} defaultOpen={false}>
              <FieldInput label="Número de factura" value={datos.numero_factura || ''} onChange={v => updateField('numero_factura', v)} />
              <div className="grid grid-cols-2 gap-2">
                <FieldInput label="Fecha de factura" value={datos.fecha_factura || ''} onChange={v => updateField('fecha_factura', v)} />
                <FieldInput label="Emitida a favor de" value={datos.factura_emitida_a || ''} onChange={v => updateField('factura_emitida_a', v)} />
              </div>
            </CollapsibleSection>
          )}

          {/* Seguro del Vehículo */}
          {requiereDatosVehiculares && (
            <CollapsibleSection title="Seguro del Vehículo" icon={<Shield className="h-4 w-4" />} defaultOpen={false}>
              <div className="grid grid-cols-2 gap-2">
                <FieldInput label="Número de póliza" value={datos.numero_poliza || ''} onChange={v => updateField('numero_poliza', v)} />
                <FieldInput label="Aseguradora" value={datos.aseguradora || ''} onChange={v => updateField('aseguradora', v)} />
                <FieldInput label="Fecha de póliza" value={datos.fecha_poliza || ''} onChange={v => updateField('fecha_poliza', v)} />
                <FieldInput label="A favor de" value={datos.poliza_emitida_a || ''} onChange={v => updateField('poliza_emitida_a', v)} />
              </div>
              <FieldInput label="Tipo de póliza" value={datos.tipo_poliza || ''} onChange={v => updateField('tipo_poliza', v)} />
            </CollapsibleSection>
          )}

          {/* Datos Bancarios */}
          {requiereDatosBancarios && (
            <CollapsibleSection title="Datos Bancarios" icon={<Landmark className="h-4 w-4" />} defaultOpen={false}>
              <div className="grid grid-cols-2 gap-2">
                <FieldInput label="Banco" value={datos.banco || ''} onChange={v => updateField('banco', v)} />
                <FieldInput label="Número de cuenta" value={datos.numero_cuenta || ''} onChange={v => updateField('numero_cuenta', v)} />
              </div>
              <FieldInput label="CLABE interbancaria" value={datos.clabe || ''} onChange={v => updateField('clabe', v)} />
              <FieldInput label="Nombre del beneficiario" value={datos.beneficiario || ''} onChange={v => updateField('beneficiario', v)} />
            </CollapsibleSection>
          )}

          {/* No Propietario - nombre del dueño del vehículo */}
          {esNoPropietario && (
            <CollapsibleSection title="Propietario del Vehículo" icon={<Users className="h-4 w-4" />}>
              <FieldInput label="Nombre del propietario del vehículo" value={datos.nombre_propietario_vehiculo || ''} onChange={v => updateField('nombre_propietario_vehiculo', v)} />
            </CollapsibleSection>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generarContrato.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={generarContrato.isPending}>
              {generarContrato.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <FileSignature className="h-4 w-4 mr-2" />
                  Generar Contrato
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
