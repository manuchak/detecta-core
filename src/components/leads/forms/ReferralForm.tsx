
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Search, UserCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Custodio {
  nombre_custodio: string;
  telefono: string;
  total_servicios: number;
}

interface ReferralFormProps {
  onReferralChange: (referralData: { custodio_referente_id: string; custodio_referente_nombre: string } | null) => void;
}

export const ReferralForm = ({ onReferralChange }: ReferralFormProps) => {
  const [custodios, setCustodios] = useState<Custodio[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustodio, setSelectedCustodio] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCustodios = async (search: string = "") => {
    try {
      setLoading(true);
      console.log('Fetching custodios with search:', search);
      
      // Usar función RPC para evitar problemas de RLS
      const { data, error } = await supabase.rpc('get_custodios_activos_safe', {
        search_term: search.trim() || null
      });

      if (error) {
        console.error('Error from RPC:', error);
        throw error;
      }

      console.log('Custodios fetched successfully:', data);
      setCustodios(data || []);
    } catch (error) {
      console.error('Error fetching custodios:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los custodios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustodios();
  }, []);

  const handleSearch = () => {
    fetchCustodios(searchTerm);
  };

  const handleCustodioSelect = (custodioNombre: string) => {
    const custodio = custodios.find(c => c.nombre_custodio === custodioNombre);
    if (custodio) {
      setSelectedCustodio(custodioNombre);
      onReferralChange({
        custodio_referente_id: custodioNombre, // Usamos el nombre como ID
        custodio_referente_nombre: custodio.nombre_custodio
      });
    }
  };

  const clearSelection = () => {
    setSelectedCustodio("");
    onReferralChange(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="referencia">¿Este candidato fue referido por algún custodio?</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Los custodios que refieran candidatos exitosos recibirán bonos.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Buscar custodio por nombre o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button type="button" variant="outline" onClick={handleSearch} disabled={loading}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {custodios.length > 0 && (
        <div>
          <Label>Seleccionar custodio referente:</Label>
          <Select value={selectedCustodio} onValueChange={handleCustodioSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar custodio..." />
            </SelectTrigger>
            <SelectContent>
              {custodios.map((custodio) => (
                <SelectItem key={custodio.nombre_custodio} value={custodio.nombre_custodio}>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{custodio.nombre_custodio}</div>
                      <div className="text-sm text-muted-foreground">
                        {custodio.telefono} • {custodio.total_servicios} servicios
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedCustodio && (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Custodio referente seleccionado: {selectedCustodio}
            </span>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
            Quitar
          </Button>
        </div>
      )}
    </div>
  );
};
