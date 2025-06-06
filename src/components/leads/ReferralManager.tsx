import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Search, Users, DollarSign, CheckCircle, Clock, UserCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Referido {
  id: string;
  custodio_referente_id: string;
  candidato_referido_id: string;
  fecha_referencia: string;
  estado_referido: string;
  fecha_activacion: string | null;
  fecha_cumplimiento_requisitos: string | null;
  bono_otorgado: boolean;
  monto_bono: number | null;
  fecha_pago_bono: string | null;
  notas: string | null;
  
  // Datos relacionados
  custodio_nombre: string;
  custodio_email: string;
  candidato_nombre: string;
  candidato_email: string;
}

const statusBadgeStyles = {
  pendiente: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  activado: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  cumplido: "bg-green-100 text-green-800 hover:bg-green-100",
  descalificado: "bg-red-100 text-red-800 hover:bg-red-100",
};

export const ReferralManager = () => {
  const [referidos, setReferidos] = useState<Referido[]>([]);
  const [filteredReferidos, setFilteredReferidos] = useState<Referido[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [configuracion, setConfiguracion] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchReferidos();
    fetchConfiguracion();
  }, []);

  const fetchConfiguracion = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracion_bonos_referidos')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      setConfiguracion(data);
    } catch (error) {
      console.error('Error fetching configuracion:', error);
    }
  };

  const fetchReferidos = async () => {
    try {
      setLoading(true);
      
      // Primero obtener los referidos básicos
      const { data: referidosData, error: referidosError } = await supabase
        .from('referidos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (referidosError) throw referidosError;
      
      if (!referidosData || referidosData.length === 0) {
        setReferidos([]);
        setFilteredReferidos([]);
        return;
      }

      // Obtener custodios únicos
      const custodioIds = [...new Set(referidosData.map(r => r.custodio_referente_id))];
      const { data: custodiosData, error: custodiosError } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', custodioIds);
      
      if (custodiosError) {
        console.error('Error fetching custodios:', custodiosError);
      }

      // Obtener candidatos únicos
      const candidatoIds = [...new Set(referidosData.map(r => r.candidato_referido_id))];
      const { data: candidatosData, error: candidatosError } = await supabase
        .from('leads')
        .select('id, nombre, email')
        .in('id', candidatoIds);
      
      if (candidatosError) {
        console.error('Error fetching candidatos:', candidatosError);
      }

      // Crear mapas para lookup rápido
      const custodiosMap = new Map(
        (custodiosData || []).map(c => [c.id, c])
      );
      const candidatosMap = new Map(
        (candidatosData || []).map(c => [c.id, c])
      );

      // Combinar datos
      const mappedData: Referido[] = referidosData.map((item: any) => {
        const custodio = custodiosMap.get(item.custodio_referente_id);
        const candidato = candidatosMap.get(item.candidato_referido_id);
        
        return {
          id: item.id,
          custodio_referente_id: item.custodio_referente_id,
          candidato_referido_id: item.candidato_referido_id,
          fecha_referencia: item.fecha_referencia,
          estado_referido: item.estado_referido,
          fecha_activacion: item.fecha_activacion,
          fecha_cumplimiento_requisitos: item.fecha_cumplimiento_requisitos,
          bono_otorgado: item.bono_otorgado,
          monto_bono: item.monto_bono,
          fecha_pago_bono: item.fecha_pago_bono,
          notas: item.notas,
          custodio_nombre: custodio?.display_name || 'N/A',
          custodio_email: custodio?.email || 'N/A',
          candidato_nombre: candidato?.nombre || 'N/A',
          candidato_email: candidato?.email || 'N/A'
        };
      });
      
      setReferidos(mappedData);
      setFilteredReferidos(mappedData);
    } catch (error) {
      console.error('Error fetching referidos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los referidos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateEstadoReferido = async (referidoId: string, nuevoEstado: string) => {
    try {
      const updateData: any = { 
        estado_referido: nuevoEstado,
        updated_at: new Date().toISOString()
      };

      if (nuevoEstado === 'activado') {
        updateData.fecha_activacion = new Date().toISOString();
      }

      const { error } = await supabase
        .from('referidos')
        .update(updateData)
        .eq('id', referidoId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `El referido ha sido marcado como ${nuevoEstado}.`,
      });

      fetchReferidos();
    } catch (error) {
      console.error('Error updating referido:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del referido.",
        variant: "destructive",
      });
    }
  };

  const procesarBono = async (referidoId: string) => {
    try {
      const { data, error } = await supabase.rpc('procesar_bono_referido', {
        p_referido_id: referidoId
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "Bono procesado",
          description: "El bono ha sido otorgado exitosamente al custodio referente.",
        });
        fetchReferidos();
      } else {
        toast({
          title: "Bono no procesado",
          description: "El referido aún no cumple los requisitos para recibir el bono.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing bono:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar el bono.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    let result = referidos;
    
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter((referido) => 
        referido.custodio_nombre.toLowerCase().includes(lowerSearchTerm) ||
        referido.candidato_nombre.toLowerCase().includes(lowerSearchTerm) ||
        referido.custodio_email.toLowerCase().includes(lowerSearchTerm) ||
        referido.candidato_email.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    setFilteredReferidos(result);
  }, [searchTerm, referidos]);

  const getStatusBadgeStyle = (status: string) => {
    return statusBadgeStyles[status as keyof typeof statusBadgeStyles] || "bg-gray-100 text-gray-800 hover:bg-gray-100";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const totalBonos = referidos.filter(r => r.bono_otorgado).reduce((sum, r) => sum + (r.monto_bono || 0), 0);
  const referidosActivos = referidos.filter(r => r.estado_referido === 'activado').length;
  const bonosPendientes = referidos.filter(r => r.estado_referido === 'activado' && !r.bono_otorgado).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Referidos</p>
                <p className="text-2xl font-bold">{referidos.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Custodios Activos</p>
                <p className="text-2xl font-bold">{referidosActivos}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bonos Pagados</p>
                <p className="text-2xl font-bold">{formatCurrency(totalBonos)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bonos Pendientes</p>
                <p className="text-2xl font-bold">{bonosPendientes}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Referidos</CardTitle>
          <CardDescription>
            Administra los candidatos referidos por custodios y sus bonos correspondientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por custodio o candidato..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Custodio Referente</TableHead>
                  <TableHead>Candidato Referido</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Referencia</TableHead>
                  <TableHead>Fecha Activación</TableHead>
                  <TableHead>Bono</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      Cargando referidos...
                    </TableCell>
                  </TableRow>
                ) : filteredReferidos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      No se encontraron referidos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReferidos.map((referido) => (
                    <TableRow key={referido.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{referido.custodio_nombre}</div>
                          <div className="text-sm text-muted-foreground">{referido.custodio_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{referido.candidato_nombre}</div>
                          <div className="text-sm text-muted-foreground">{referido.candidato_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadgeStyle(referido.estado_referido)}>
                          {referido.estado_referido}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(referido.fecha_referencia)}</TableCell>
                      <TableCell>{formatDate(referido.fecha_activacion)}</TableCell>
                      <TableCell>
                        {referido.bono_otorgado ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-green-600 font-medium">
                              {formatCurrency(referido.monto_bono)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Pendiente</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {referido.estado_referido === 'pendiente' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateEstadoReferido(referido.id, 'activado')}
                            >
                              Activar
                            </Button>
                          )}
                          {referido.estado_referido === 'activado' && !referido.bono_otorgado && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => procesarBono(referido.id)}
                            >
                              Procesar Bono
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {configuracion && (
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Bonos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Monto del bono:</span>
                <p>{formatCurrency(configuracion.monto_bono)}</p>
              </div>
              <div>
                <span className="font-medium">Días mínimos:</span>
                <p>{configuracion.dias_minimos_permanencia} días</p>
              </div>
              <div>
                <span className="font-medium">Servicios mínimos:</span>
                <p>{configuracion.servicios_minimos_requeridos} servicios</p>
              </div>
              <div>
                <span className="font-medium">Estado:</span>
                <p>{configuracion.activo ? 'Activo' : 'Inactivo'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
