
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { User, Car, MapPin, Briefcase, Phone, Mail, Calendar, Shield } from "lucide-react";

interface LeadEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any;
  onUpdate: () => void;
}

export const LeadEditDialog = ({ open, onOpenChange, lead, onUpdate }: LeadEditDialogProps) => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    mensaje: '',
    fuente: '',
    estado: '',
    notas: ''
  });
  const [parsedData, setParsedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basico");
  const { toast } = useToast();

  useEffect(() => {
    if (lead && open) {
      fetchLeadDetails();
    }
  }, [lead, open]);

  const fetchLeadDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', lead.lead_id)
        .single();

      if (error) throw error;

      setFormData({
        nombre: data.nombre || '',
        email: data.email || '',
        telefono: data.telefono || '',
        empresa: data.empresa || '',
        mensaje: data.mensaje || '',
        fuente: data.fuente || '',
        estado: data.estado || '',
        notas: data.notas || ''
      });

      // Parse JSON data from notas
      try {
        if (data.notas) {
          const parsed = JSON.parse(data.notas);
          setParsedData(parsed);
        }
      } catch (e) {
        console.error('Error parsing notas JSON:', e);
        setParsedData(null);
      }
    } catch (error) {
      console.error('Error fetching lead details:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles del candidato.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          empresa: formData.empresa,
          mensaje: formData.mensaje,
          fuente: formData.fuente,
          estado: formData.estado,
          notas: formData.notas,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.lead_id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Los datos del candidato han sido actualizados.",
      });

      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la información del candidato.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTipoCustodioLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      'custodio_vehiculo': 'Con Vehículo',
      'armado': 'Armado',
      'armado_vehiculo': 'Armado con Vehículo',
      'abordo': 'Abordo'
    };
    return tipos[tipo] || tipo;
  };

  const renderCandidateProfile = () => {
    if (!parsedData) return null;

    return (
      <div className="space-y-6">
        {/* Header con información básica */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl text-blue-900">{formData.nombre}</CardTitle>
                <CardDescription className="text-blue-700">
                  {formData.email} • {formData.telefono}
                </CardDescription>
                {parsedData.tipo_custodio && (
                  <Badge variant="outline" className="mt-2 bg-blue-100 text-blue-800 border-blue-300">
                    {getTipoCustodioLabel(parsedData.tipo_custodio)}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Datos Personales */}
          {parsedData.datos_personales && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Datos Personales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {parsedData.datos_personales.edad && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Edad:</span>
                    <span className="text-sm font-medium">{parsedData.datos_personales.edad} años</span>
                  </div>
                )}
                {parsedData.datos_personales.direccion && (
                  <div>
                    <span className="text-sm text-muted-foreground">Dirección:</span>
                    <p className="text-sm font-medium mt-1">{parsedData.datos_personales.direccion}</p>
                  </div>
                )}
                {parsedData.datos_personales.ciudad && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Ciudad:</span>
                    <span className="text-sm font-medium">{parsedData.datos_personales.ciudad}</span>
                  </div>
                )}
                {parsedData.datos_personales.estado && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Estado:</span>
                    <span className="text-sm font-medium">{parsedData.datos_personales.estado}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Información del Vehículo */}
          {parsedData.vehiculo && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Car className="h-5 w-5 text-green-600" />
                  Vehículo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(parsedData.vehiculo.marca || parsedData.vehiculo.modelo || parsedData.vehiculo.año) && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Vehículo:</span>
                    <span className="text-sm font-medium">
                      {`${parsedData.vehiculo.marca || ''} ${parsedData.vehiculo.modelo || ''} ${parsedData.vehiculo.año || ''}`.trim()}
                    </span>
                  </div>
                )}
                {parsedData.vehiculo.color && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Color:</span>
                    <span className="text-sm font-medium">{parsedData.vehiculo.color}</span>
                  </div>
                )}
                {parsedData.vehiculo.placas && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Placas:</span>
                    <span className="text-sm font-medium">{parsedData.vehiculo.placas}</span>
                  </div>
                )}
                {parsedData.vehiculo.seguro_vigente && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Seguro vigente</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Experiencia */}
          {parsedData.experiencia && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-purple-600" />
                  Experiencia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {parsedData.experiencia.años_experiencia && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Años de experiencia:</span>
                    <span className="text-sm font-medium">{parsedData.experiencia.años_experiencia}</span>
                  </div>
                )}
                {parsedData.experiencia.experiencia_custodia && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      Experiencia en custodia
                    </Badge>
                  </div>
                )}
                {parsedData.experiencia.licencia_conducir && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Licencia:</span>
                    <span className="text-sm font-medium">
                      {parsedData.experiencia.tipo_licencia || 'Sí'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Zona de Trabajo */}
          {parsedData.zona_trabajo && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  Zona de Trabajo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {parsedData.zona_trabajo.zona_preferida && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Zona preferida:</span>
                    <span className="text-sm font-medium">{parsedData.zona_trabajo.zona_preferida}</span>
                  </div>
                )}
                {parsedData.zona_trabajo.disponibilidad_horario && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Disponibilidad:</span>
                    <span className="text-sm font-medium">{parsedData.zona_trabajo.disponibilidad_horario}</span>
                  </div>
                )}
                {parsedData.zona_trabajo.rango_km && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Rango (km):</span>
                    <span className="text-sm font-medium">{parsedData.zona_trabajo.rango_km}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Referencias */}
        {parsedData.referencias && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Referencias</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {parsedData.referencias}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Referido por */}
        {parsedData.referido && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-amber-800">Información de Referido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {parsedData.referido.custodio_referente_nombre && (
                <div className="flex justify-between">
                  <span className="text-sm text-amber-700">Referido por:</span>
                  <span className="text-sm font-medium text-amber-900">
                    {parsedData.referido.custodio_referente_nombre}
                  </span>
                </div>
              )}
              {parsedData.referido.custodio_referente_telefono && (
                <div className="flex justify-between">
                  <span className="text-sm text-amber-700">Teléfono del referente:</span>
                  <span className="text-sm font-medium text-amber-900">
                    {parsedData.referido.custodio_referente_telefono}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">Información del Candidato</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basico">Datos Básicos</TabsTrigger>
            <TabsTrigger value="perfil">Perfil Completo</TabsTrigger>
          </TabsList>

          <div className="mt-4 h-[calc(90vh-200px)] overflow-y-auto">
            <TabsContent value="basico" className="space-y-4 mt-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre">Nombre completo *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="empresa">Empresa</Label>
                    <Input
                      id="empresa"
                      value={formData.empresa}
                      onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="fuente">Fuente</Label>
                    <Select value={formData.fuente} onValueChange={(value) => setFormData(prev => ({ ...prev, fuente: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar fuente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="web">Sitio Web</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="indeed">Indeed</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="referido">Referido</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="telefono">Teléfono</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="estado">Estado</Label>
                    <Select value={formData.estado} onValueChange={(value) => setFormData(prev => ({ ...prev, estado: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nuevo">Nuevo</SelectItem>
                        <SelectItem value="contactado">Contactado</SelectItem>
                        <SelectItem value="entrevista">En entrevista</SelectItem>
                        <SelectItem value="documentos">Documentos</SelectItem>
                        <SelectItem value="en_proceso">En proceso</SelectItem>
                        <SelectItem value="aprobado">Aprobado</SelectItem>
                        <SelectItem value="rechazado">Rechazado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="mensaje">Mensaje</Label>
                  <Textarea
                    id="mensaje"
                    value={formData.mensaje}
                    onChange={(e) => setFormData(prev => ({ ...prev, mensaje: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar cambios'}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="perfil" className="mt-0">
              {renderCandidateProfile()}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
