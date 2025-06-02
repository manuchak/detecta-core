
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PersonalInfoFormProps {
  formData: {
    nombre: string;
    email: string;
    telefono: string;
    edad: string;
  };
  onInputChange: (field: string, value: string) => void;
}

const RANGOS_EDAD = [
  { value: "18-25", label: "18-25 años" },
  { value: "26-30", label: "26-30 años" },
  { value: "31-35", label: "31-35 años" },
  { value: "36-40", label: "36-40 años" },
  { value: "41-45", label: "41-45 años" },
  { value: "46-50", label: "46-50 años" },
  { value: "51-55", label: "51-55 años" },
  { value: "56-60", label: "56-60 años" },
  { value: "60+", label: "Más de 60 años" }
];

export const PersonalInfoForm = ({ formData, onInputChange }: PersonalInfoFormProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre Completo *</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => onInputChange('nombre', e.target.value)}
            placeholder="Ingresa el nombre completo"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            placeholder="ejemplo@correo.com"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono *</Label>
          <Input
            id="telefono"
            value={formData.telefono}
            onChange={(e) => onInputChange('telefono', e.target.value)}
            placeholder="10 dígitos sin espacios"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edad">Rango de Edad</Label>
          <Select value={formData.edad} onValueChange={(value) => onInputChange('edad', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar rango de edad" />
            </SelectTrigger>
            <SelectContent>
              {RANGOS_EDAD.map((rango) => (
                <SelectItem key={rango.value} value={rango.value}>
                  {rango.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
