import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users, Briefcase, User } from 'lucide-react';
import { useCreateReferencia } from '@/hooks/useReferencias';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidatoId: string;
  tipoReferencia: 'laboral' | 'personal';
}

const relacionesLaborales = [
  'Jefe directo',
  'Supervisor',
  'Gerente',
  'Recursos Humanos',
  'Compañero de trabajo',
  'Subordinado',
  'Cliente',
  'Otro',
];

const relacionesPersonales = [
  'Familiar',
  'Amigo cercano',
  'Vecino',
  'Conocido',
  'Compañero de estudios',
  'Otro',
];

export function ReferenceForm({ isOpen, onClose, candidatoId, tipoReferencia }: Props) {
  const [nombre, setNombre] = useState('');
  const [relacion, setRelacion] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [cargo, setCargo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [tiempoConocido, setTiempoConocido] = useState('');

  const createMutation = useCreateReferencia();
  const isLaboral = tipoReferencia === 'laboral';
  const relaciones = isLaboral ? relacionesLaborales : relacionesPersonales;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createMutation.mutateAsync({
      candidato_id: candidatoId,
      tipo_referencia: tipoReferencia,
      nombre_referencia: nombre,
      relacion: relacion || undefined,
      empresa_institucion: empresa || undefined,
      cargo_referencia: cargo || undefined,
      telefono: telefono || undefined,
      email: email || undefined,
      tiempo_conocido: tiempoConocido || undefined,
    });

    onClose();
    resetForm();
  };

  const resetForm = () => {
    setNombre('');
    setRelacion('');
    setEmpresa('');
    setCargo('');
    setTelefono('');
    setEmail('');
    setTiempoConocido('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isLaboral ? <Briefcase className="h-5 w-5" /> : <User className="h-5 w-5" />}
            Agregar Referencia {isLaboral ? 'Laboral' : 'Personal'}
          </DialogTitle>
          <DialogDescription>
            Ingrese los datos de la referencia para su posterior validación
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre completo *</Label>
            <Input
              id="nombre"
              placeholder="Nombre de la referencia"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          {/* Relación */}
          <div className="space-y-2">
            <Label htmlFor="relacion">Relación</Label>
            <Select value={relacion} onValueChange={setRelacion}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione la relación" />
              </SelectTrigger>
              <SelectContent>
                {relaciones.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Empresa/Institución (solo laboral) */}
          {isLaboral && (
            <>
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa</Label>
                <Input
                  id="empresa"
                  placeholder="Nombre de la empresa"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo de la referencia</Label>
                <Input
                  id="cargo"
                  placeholder="Puesto que ocupa"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              type="tel"
              placeholder="Número de contacto"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Tiempo conocido */}
          <div className="space-y-2">
            <Label htmlFor="tiempo">Tiempo de conocerse</Label>
            <Select value={tiempoConocido} onValueChange={setTiempoConocido}>
              <SelectTrigger>
                <SelectValue placeholder="¿Cuánto tiempo se conocen?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="menos_6_meses">Menos de 6 meses</SelectItem>
                <SelectItem value="6_meses_1_año">6 meses - 1 año</SelectItem>
                <SelectItem value="1_2_años">1 - 2 años</SelectItem>
                <SelectItem value="2_5_años">2 - 5 años</SelectItem>
                <SelectItem value="mas_5_años">Más de 5 años</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !nombre}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Agregar Referencia
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
