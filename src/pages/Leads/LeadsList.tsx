import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Search, Plus, Users, Settings } from "lucide-react";
import { LeadForm } from "@/components/leads/LeadForm";
import { LeadEditDialog } from "@/components/leads/LeadEditDialog";
import { LeadAssignmentDialog } from "@/components/leads/LeadAssignmentDialog";
import { ReferralManager } from "@/components/leads/ReferralManager";
import { BonusConfigManager } from "@/components/leads/BonusConfigManager";

interface Lead {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  estado: string;
  empresa: string;
  fuente: string;
  mensaje: string;
  notas: string;
  asignado_a: string;
  fecha_contacto: string;
  fecha_creacion: string;
  updated_at: string;
}

const statusColors = {
  nuevo: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  contactado: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  calificado: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  aprobado: "bg-green-100 text-green-800 hover:bg-green-100",
  rechazado: "bg-red-100 text-red-800 hover:bg-red-100",
  finalizado: "bg-gray-100 text-gray-800 hover:bg-gray-100",
};

export const LeadsList = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("leads");
  const { toast } = useToast();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setLeads(data || []);
      setFilteredLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los leads.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setShowEditDialog(true);
  };

  const handleAssignLead = (lead: Lead) => {
    setSelectedLead(lead);
    setShowAssignDialog(true);
  };

  const handleDialogClose = () => {
    setSelectedLead(null);
    setShowEditDialog(false);
    setShowAssignDialog(false);
    fetchLeads();
  };

  // Filter logic
  useEffect(() => {
    let result = leads;
    
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter((lead) => 
        lead.nombre.toLowerCase().includes(lowerSearchTerm) ||
        lead.email.toLowerCase().includes(lowerSearchTerm) ||
        lead.telefono.toLowerCase().includes(lowerSearchTerm) ||
        lead.empresa.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    setFilteredLeads(result);
  }, [searchTerm, leads]);

  const getStatusBadgeStyle = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 hover:bg-gray-100";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gestión de Leads</h1>
          <p className="text-muted-foreground">
            Administra los candidatos y el sistema de referidos.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Lead
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="leads">
            <Users className="h-4 w-4 mr-2" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="referrals">
            <Users className="h-4 w-4 mr-2" />
            Referidos
          </TabsTrigger>
          <TabsTrigger value="bonus-config">
            <Settings className="h-4 w-4 mr-2" />
            Configuración de Bonos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Leads</CardTitle>
              <CardDescription>
                Total: {leads.length} leads | Filtrados: {filteredLeads.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar leads..." 
                    className="pl-8" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teléfono
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Contacto
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.nombre}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.telefono}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.empresa}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge className={getStatusBadgeStyle(lead.estado)}>{lead.estado}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(lead.fecha_contacto)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button variant="outline" size="sm" onClick={() => handleEditLead(lead)}>
                            Editar
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => handleAssignLead(lead)}>
                            Asignar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="mt-6">
          <ReferralManager />
        </TabsContent>

        <TabsContent value="bonus-config" className="mt-6">
          <BonusConfigManager />
        </TabsContent>
      </Tabs>

      {showForm && (
        <LeadForm 
          onClose={() => setShowForm(false)} 
          onSubmit={fetchLeads}
        />
      )}

      {showEditDialog && selectedLead && (
        <LeadEditDialog
          lead={selectedLead}
          onClose={handleDialogClose}
          onUpdate={fetchLeads}
        />
      )}

      {showAssignDialog && selectedLead && (
        <LeadAssignmentDialog
          lead={selectedLead}
          onClose={handleDialogClose}
          onUpdate={fetchLeads}
        />
      )}
    </div>
  );
};

export default LeadsList;
