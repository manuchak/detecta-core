import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const SimpleLeadsPage = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    // Verificar usuario actual de manera simple
    supabase.auth.getUser().then(({ data }) => {
      console.log('User data:', data.user?.email);
      setUser(data.user);
      setLoading(false);
      
      if (data.user) {
        // Cargar leads directamente
        supabase.from('leads').select('*').then(({ data: leadsData, error }) => {
          if (error) {
            console.error('Error loading leads:', error);
          } else {
            console.log('Leads loaded:', leadsData?.length || 0);
            setLeads(leadsData || []);
          }
        });
      }
    });
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Cargando...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">No autenticado</h2>
              <p>Debes iniciar sesión para ver esta página</p>
              <Button onClick={() => window.location.href = '/auth/login'} className="mt-4">
                Ir a Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Candidatos - Versión Ultra Simple</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p><strong>✅ Usuario autenticado:</strong> {user.email}</p>
              <p><strong>📊 Total de candidatos:</strong> {leads.length}</p>
              <p><strong>🔧 Estado:</strong> Sistema funcionando correctamente</p>
            </div>
            
            {leads.length > 0 ? (
              <div className="space-y-2">
                <h3 className="font-semibold">Candidatos (mostrando primeros 10):</h3>
                <div className="grid gap-3">
                  {leads.slice(0, 10).map((lead, index) => (
                    <Card key={lead.id || index} className="p-4 border-l-4 border-l-blue-500">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="font-medium text-lg">{lead.nombre || 'Sin nombre'}</p>
                          <p className="text-sm text-gray-600">{lead.email || 'Sin email'}</p>
                        </div>
                        <div>
                          <p className="text-sm"><strong>Estado:</strong> {lead.estado || 'Sin estado'}</p>
                          <p className="text-sm"><strong>Teléfono:</strong> {lead.telefono || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm"><strong>Fecha:</strong> {lead.fecha_creacion ? new Date(lead.fecha_creacion).toLocaleDateString() : 'N/A'}</p>
                          <p className="text-sm"><strong>Fuente:</strong> {lead.fuente || 'N/A'}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="p-6 text-center bg-yellow-50 border-yellow-200">
                <p className="text-lg">📝 No hay candidatos registrados</p>
                <p className="text-sm text-gray-600 mt-2">La consulta se ejecutó correctamente pero no se encontraron datos</p>
              </Card>
            )}
            
            <div className="flex gap-4 pt-4">
              <Button onClick={() => window.location.reload()}>
                🔄 Actualizar Página
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/leads'}>
                📋 Ir a Versión Completa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleLeadsPage;