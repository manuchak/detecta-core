import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadForm } from '@/components/leads/LeadForm';
import { Lead } from '@/hooks/useLeads';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const SimpleLeadsPage = () => {
  const { user, loading, userRole } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Verificación de permisos simplificada
  const hasAccess = () => {
    if (!user) return false;
    
    // Permitir acceso a supply_admin y roles específicos
    const allowedRoles = ['admin', 'owner', 'supply_admin', 'ejecutivo_ventas', 'coordinador_operaciones'];
    const isSupplyAdminEmail = user.email === 'brenda.jimenez@detectasecurity.io' || 
                              user.email === 'marbelli.casillas@detectasecurity.io';
    
    return isSupplyAdminEmail || (userRole && allowedRoles.includes(userRole));
  };

  // Control de inicialización
  useEffect(() => {
    if (loading) return;
    
    // Esperar un momento para que todo se estabilice
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [loading, user, userRole]);

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowCreateForm(true);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingLead(null);
  };

  // Loading state
  if (loading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Cargando gestión de candidatos...</p>
        </div>
      </div>
    );
  }

  // Authentication check
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Access check
  if (!hasAccess()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 p-8">
          <h2 className="text-2xl font-bold text-gray-800">Acceso Restringido</h2>
          <p className="text-gray-600">No tienes permisos para acceder a la gestión de candidatos.</p>
          <Button onClick={() => window.history.back()}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Candidatos</h1>
            <p className="text-gray-600 mt-1">Administra los candidatos y su proceso de aprobación</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Candidato
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {showCreateForm ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingLead ? 'Editar Candidato' : 'Nuevo Candidato'}
              </h2>
              <Button variant="outline" onClick={handleCloseForm}>
                Cancelar
              </Button>
            </div>
            <div className="bg-white rounded-lg border p-6">
              <LeadForm
                editingLead={editingLead}
                onSuccess={handleCloseForm}
                onCancel={handleCloseForm}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border">
            <LeadsTable onEditLead={handleEditLead} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleLeadsPage;