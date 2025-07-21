import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, Database, Calendar, User, Mail, Phone, Building, FileText, Eye } from "lucide-react";
import { Lead } from "@/types/leadTypes";

interface LeadDetailsDialogProps {
  lead: Lead;
  trigger?: React.ReactNode;
}

export const LeadDetailsDialog = ({ lead, trigger }: LeadDetailsDialogProps) => {
  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Eye className="h-4 w-4 mr-1" />
      Detalle
    </Button>
  );

  const formatDate = (date: string | undefined) => {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'nuevo': 'bg-blue-100 text-blue-800',
      'contactado': 'bg-green-100 text-green-800',
      'en_revision': 'bg-yellow-100 text-yellow-800',
      'aprobado': 'bg-emerald-100 text-emerald-800',
      'rechazado': 'bg-red-100 text-red-800',
      'pendiente': 'bg-orange-100 text-orange-800',
      'psicometricos_pendiente': 'bg-purple-100 text-purple-800',
      'psicometricos_completado': 'bg-green-100 text-green-800',
      'toxicologicos_pendiente': 'bg-amber-100 text-amber-800',
      'toxicologicos_completado': 'bg-green-100 text-green-800',
      'instalacion_gps_pendiente': 'bg-indigo-100 text-indigo-800',
      'instalacion_gps_completado': 'bg-green-100 text-green-800',
      'custodio_activo': 'bg-emerald-100 text-emerald-800',
      'rechazado_psicometrico': 'bg-red-100 text-red-800',
      'rechazado_toxicologico': 'bg-red-100 text-red-800',
      'inactivo': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Detalles del Candidato: {lead.nombre}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Información General */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Información General
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                  <p className="text-sm font-medium">{lead.nombre}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estado</label>
                  <div className="mt-1">{getStatusBadge(lead.estado)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{lead.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                  <p className="text-sm">{lead.telefono || 'No proporcionado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Empresa</label>
                  <p className="text-sm">{lead.empresa || 'No especificada'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fuente</label>
                  <p className="text-sm">{lead.fuente || 'No especificada'}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Fechas del Proceso */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Cronología del Proceso
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha Creación</label>
                  <p className="text-sm">{formatDate(lead.fecha_creacion)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha Contacto</label>
                  <p className="text-sm">{formatDate(lead.fecha_contacto)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha Aprobación</label>
                  <p className="text-sm">{formatDate(lead.fecha_aprobacion)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha Psicométricos</label>
                  <p className="text-sm">{formatDate(lead.fecha_psicometricos)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha Toxicológicos</label>
                  <p className="text-sm">{formatDate(lead.fecha_toxicologicos)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha Instalación GPS</label>
                  <p className="text-sm">{formatDate(lead.fecha_instalacion_gps)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha Activación</label>
                  <p className="text-sm">{formatDate(lead.fecha_activacion_custodio)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Última Actualización</label>
                  <p className="text-sm">{formatDate(lead.updated_at)}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Información Adicional */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                Información Adicional
              </div>
              <div className="grid grid-cols-1 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Asignado a</label>
                  <p className="text-sm">{lead.asignado_a || 'Sin asignar'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Motivo de Rechazo</label>
                  <p className="text-sm">{lead.motivo_rechazo || 'No aplica'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Credenciales Enviadas</label>
                  <p className="text-sm">{lead.credenciales_enviadas ? 'Sí' : 'No'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notas</label>
                  <p className="text-sm whitespace-pre-wrap">{lead.notas || 'Sin notas'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Mensaje</label>
                  <p className="text-sm whitespace-pre-wrap">{lead.mensaje || 'Sin mensaje'}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Información de Base de Datos */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Database className="h-4 w-4" />
                Información de Base de Datos
              </div>
              <div className="grid grid-cols-1 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <label className="text-sm font-medium text-blue-700">Tabla</label>
                  <p className="text-sm text-blue-900 font-mono">candidatos_custodios</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-700">ID del Registro</label>
                  <p className="text-sm text-blue-900 font-mono">{lead.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-700">Base de Datos</label>
                  <p className="text-sm text-blue-900 font-mono">Supabase PostgreSQL</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-700">Esquema</label>
                  <p className="text-sm text-blue-900 font-mono">public</p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};