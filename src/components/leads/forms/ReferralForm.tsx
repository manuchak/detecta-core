
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
  id: string;
  display_name: string;
  email: string;
  phone: string;
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
      
      let query = supabase
        .from('profiles')
        .select('id, display_name, email, phone')
        .eq('is_verified', true)
        .order('display_name');

      if (search.trim()) {
        query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;

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

  const handleCustodioSelect = (custodioId: string) => {
    const custodio = custodios.find(c => c.id === custodioId);
    if (custodio) {
      setSelectedCustodio(custodioId);
      onReferralChange({
        custodio_referente_id: custodioId,
        custodio_referente_nombre: custodio.display_name
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
          placeholder="Buscar custodio por nombre, email o teléfono..."
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
                <SelectItem key={custodio.id} value={custodio.id}>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{custodio.display_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {custodio.email} • {custodio.phone}
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
              Custodio referente seleccionado: {custodios.find(c => c.id === selectedCustodio)?.display_name}
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
