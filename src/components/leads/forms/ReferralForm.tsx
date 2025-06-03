
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
      
      // Consultar custodios activos desde servicios_custodia
      let query = supabase
        .from('servicios_custodia')
        .select('nombre_custodio, telefono')
        .not('nombre_custodio', 'is', null)
        .neq('nombre_custodio', '')
        .neq('nombre_custodio', '#N/A');

      if (search.trim()) {
        query = query.or(`nombre_custodio.ilike.%${search}%,telefono.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Agrupar por custodio y contar servicios
      const custodiosMap = new Map<string, Custodio>();
      
      (data || []).forEach((servicio: any) => {
        const key = servicio.nombre_custodio;
        if (custodiosMap.has(key)) {
          const existing = custodiosMap.get(key)!;
          existing.total_servicios += 1;
        } else {
          custodiosMap.set(key, {
            nombre_custodio: servicio.nombre_custodio,
            telefono: servicio.telefono || 'Sin teléfono',
            total_servicios: 1
          });
        }
      });

      // Convertir a array y ordenar por número de servicios (más activos primero)
      const custodiosArray = Array.from(custodiosMap.values())
        .sort((a, b) => b.total_servicios - a.total_servicios)
        .slice(0, 20); // Limitar a 20 resultados

      setCustodios(custodiosArray);
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
