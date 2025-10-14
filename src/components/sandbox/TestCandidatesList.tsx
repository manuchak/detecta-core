import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TestTube2 } from "lucide-react";

export const TestCandidatesList = () => {
  const { data: candidates, isLoading } = useQuery({
    queryKey: ['test-candidates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidatos_custodios')
        .select('id, nombre, telefono, email, estado_proceso, created_at')
        .eq('is_test', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Cargando candidatos de prueba...</div>;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <TestTube2 className="h-5 w-5 text-warning" />
        <h3 className="text-lg font-semibold">Candidatos de Prueba</h3>
        <Badge variant="secondary">{candidates?.length || 0}</Badge>
      </div>

      <div className="space-y-2">
        {candidates?.slice(0, 10).map((candidate) => (
          <div 
            key={candidate.id}
            className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1">
              <p className="font-medium">{candidate.nombre}</p>
              <p className="text-sm text-muted-foreground">{candidate.telefono}</p>
            </div>
            <Badge variant="outline">{candidate.estado_proceso}</Badge>
          </div>
        ))}
      </div>

      {(candidates?.length || 0) > 10 && (
        <p className="text-sm text-muted-foreground text-center mt-4">
          Mostrando 10 de {candidates?.length} candidatos
        </p>
      )}
    </Card>
  );
};
