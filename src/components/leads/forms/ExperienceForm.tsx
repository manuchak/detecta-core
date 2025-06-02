
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ExperienceFormProps {
  formData: {
    experiencia_custodia: string;
    años_experiencia: string;
    empresas_anteriores: string;
    licencia_conducir: string;
    tipo_licencia: string;
    antecedentes_penales: string;
    referencias: string;
    mensaje: string;
  };
  onInputChange: (field: string, value: string) => void;
}

export const ExperienceForm = ({ formData, onInputChange }: ExperienceFormProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="experiencia_custodia">¿Tienes experiencia en custodia?</Label>
          <Select value={formData.experiencia_custodia} onValueChange={(value) => onInputChange('experiencia_custodia', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="si">Sí</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="similar">Experiencia similar (seguridad, vigilancia)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="años_experiencia">Años de experiencia</Label>
          <Select value={formData.años_experiencia} onValueChange={(value) => onInputChange('años_experiencia', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Sin experiencia</SelectItem>
              <SelectItem value="0-1">Menos de 1 año</SelectItem>
              <SelectItem value="1-2">1-2 años</SelectItem>
              <SelectItem value="2-5">2-5 años</SelectItem>
              <SelectItem value="5+">Más de 5 años</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="licencia_conducir">¿Tienes licencia de conducir vigente?</Label>
          <Select value={formData.licencia_conducir} onValueChange={(value) => onInputChange('licencia_conducir', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="si">Sí, vigente</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="tramite">En trámite</SelectItem>
              <SelectItem value="vencida">Vencida</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="tipo_licencia">Tipo de licencia</Label>
          <Select value={formData.tipo_licencia} onValueChange={(value) => onInputChange('tipo_licencia', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="automovilista">Automovilista</SelectItem>
              <SelectItem value="chofer">Chofer</SelectItem>
              <SelectItem value="motociclista">Motociclista</SelectItem>
              <SelectItem value="federal">Federal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="antecedentes_penales">¿Tienes antecedentes penales?</Label>
          <Select value={formData.antecedentes_penales} onValueChange={(value) => onInputChange('antecedentes_penales', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="si">Sí</SelectItem>
              <SelectItem value="no_se">No lo sé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="empresas_anteriores">Empresas anteriores (opcional)</Label>
          <Textarea
            id="empresas_anteriores"
            value={formData.empresas_anteriores}
            onChange={(e) => onInputChange('empresas_anteriores', e.target.value)}
            placeholder="Menciona las empresas donde has trabajado en seguridad o custodia"
            rows={3}
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="referencias">Referencias (opcional)</Label>
          <Textarea
            id="referencias"
            value={formData.referencias}
            onChange={(e) => onInputChange('referencias', e.target.value)}
            placeholder="Nombres y teléfonos de referencias laborales o personales"
            rows={3}
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="mensaje">Comentarios adicionales</Label>
          <Textarea
            id="mensaje"
            value={formData.mensaje}
            onChange={(e) => onInputChange('mensaje', e.target.value)}
            placeholder="Cualquier información adicional que consideres relevante"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};
