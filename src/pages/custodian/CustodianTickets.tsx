import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket, AlertTriangle, Clock, CheckCircle, X } from "lucide-react";
import { useCustodianProfile } from "@/hooks/useCustodianProfile";

const CustodianTickets = () => {
  const { profile } = useCustodianProfile();

  // Placeholder data for now - will implement real functionality later
  const mockStats = {
    total: 5,
    abiertos: 2,
    en_progreso: 1,
    resueltos: 1,
    cerrados: 1
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mis Tickets</h1>
            <p className="text-muted-foreground">Gestión de tickets y soporte técnico</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abiertos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.abiertos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.en_progreso}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resueltos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.resueltos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cerrados</CardTitle>
              <X className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.cerrados}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Sistema de Tickets
            </CardTitle>
            <CardDescription>
              Gestión de tickets en desarrollo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Sistema de tickets en desarrollo
              </p>
              <p className="text-sm text-muted-foreground">
                Usuario: {profile?.display_name || 'Custodio'}<br />
                Teléfono: {profile?.phone || 'No registrado'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustodianTickets;