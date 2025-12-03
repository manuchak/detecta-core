import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Users, Plus, Briefcase, User, Phone, Mail, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useReferencias, useReferenciasProgress } from '@/hooks/useReferencias';
import { ReferenceForm } from './ReferenceForm';
import { ReferenceValidationDialog } from './ReferenceValidationDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Referencia } from '@/hooks/useReferencias';

interface Props {
  candidatoId: string;
  candidatoNombre: string;
}

const resultadoConfig = {
  positiva: { label: 'Positiva', icon: CheckCircle, className: 'bg-green-500/20 text-green-700' },
  negativa: { label: 'Negativa', icon: XCircle, className: 'bg-red-500/20 text-red-700' },
  no_contactado: { label: 'No contactado', icon: Phone, className: 'bg-amber-500/20 text-amber-700' },
  invalida: { label: 'Inválida', icon: XCircle, className: 'bg-gray-500/20 text-gray-700' },
  pendiente: { label: 'Pendiente', icon: Clock, className: 'bg-blue-500/20 text-blue-700' },
};

export function ReferencesTab({ candidatoId, candidatoNombre }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [selectedRef, setSelectedRef] = useState<Referencia | null>(null);
  const [tipoReferencia, setTipoReferencia] = useState<'laboral' | 'personal'>('laboral');
  
  const { data: referencias, isLoading } = useReferencias(candidatoId);
  const { data: progress } = useReferenciasProgress(candidatoId);

  const laborales = referencias?.filter(r => r.tipo_referencia === 'laboral') || [];
  const personales = referencias?.filter(r => r.tipo_referencia === 'personal') || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const handleAddRef = (tipo: 'laboral' | 'personal') => {
    setTipoReferencia(tipo);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Referencias del Candidato
        </h3>
      </div>

      {/* Progress Card */}
      <Card className={progress?.isComplete ? 'border-green-500/50 bg-green-500/5' : ''}>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Laborales
                </span>
                <span className="font-medium">{progress?.laboralesOk || 0}/2 positivas</span>
              </div>
              <Progress value={(progress?.laboralesOk || 0) * 50} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personales
                </span>
                <span className="font-medium">{progress?.personalesOk || 0}/2 positivas</span>
              </div>
              <Progress value={(progress?.personalesOk || 0) * 50} className="h-2" />
            </div>
          </div>
          {progress?.isComplete && (
            <div className="mt-3 p-2 bg-green-500/10 rounded-lg text-center text-sm text-green-700">
              <CheckCircle className="h-4 w-4 inline mr-2" />
              Referencias completas
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referencias Laborales */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Referencias Laborales ({laborales.length})
          </h4>
          <Button size="sm" variant="outline" onClick={() => handleAddRef('laboral')}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </div>
        {laborales.length === 0 ? (
          <Card>
            <CardContent className="text-center py-4 text-muted-foreground text-sm">
              No hay referencias laborales
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {laborales.map(ref => (
              <ReferenceCard key={ref.id} referencia={ref} onValidate={() => setSelectedRef(ref)} />
            ))}
          </div>
        )}
      </div>

      {/* Referencias Personales */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Referencias Personales ({personales.length})
          </h4>
          <Button size="sm" variant="outline" onClick={() => handleAddRef('personal')}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </div>
        {personales.length === 0 ? (
          <Card>
            <CardContent className="text-center py-4 text-muted-foreground text-sm">
              No hay referencias personales
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {personales.map(ref => (
              <ReferenceCard key={ref.id} referencia={ref} onValidate={() => setSelectedRef(ref)} />
            ))}
          </div>
        )}
      </div>

      <ReferenceForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        candidatoId={candidatoId}
        tipoReferencia={tipoReferencia}
      />

      {selectedRef && (
        <ReferenceValidationDialog
          isOpen={!!selectedRef}
          onClose={() => setSelectedRef(null)}
          referencia={selectedRef}
        />
      )}
    </div>
  );
}

function ReferenceCard({ referencia, onValidate }: { referencia: Referencia; onValidate: () => void }) {
  const config = resultadoConfig[referencia.resultado];
  const IconComponent = config.icon;

  return (
    <Card className="hover:bg-muted/30 transition-colors">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{referencia.nombre_referencia}</p>
              <Badge variant="outline" className={config.className}>
                <IconComponent className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {referencia.relacion}
              {referencia.empresa_institucion && ` • ${referencia.empresa_institucion}`}
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              {referencia.telefono && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {referencia.telefono}
                </span>
              )}
              {referencia.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {referencia.email}
                </span>
              )}
            </div>
          </div>
          {referencia.resultado === 'pendiente' && (
            <Button size="sm" variant="outline" onClick={onValidate}>
              Validar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
