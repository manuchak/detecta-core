import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Bug, Wrench } from 'lucide-react';

export function BugFixSummary() {
  const bugsFixes = [
    {
      id: 'inconsistent-query-fields',
      severity: 'high',
      status: 'fixed',
      title: 'Inconsistent Query Field Usage',
      description: 'Functions were using id_servicio instead of id (UUID) for database queries',
      impact: 'Database query failures and "structure of query does not match" errors',
      location: 'useServiciosPlanificados.ts - assignArmedGuard, reassignCustodian, removeAssignment',
      fix: 'Updated all queries to use consistent UUID id field instead of id_servicio'
    },
    {
      id: 'database-function-mismatch',
      severity: 'medium',
      status: 'identified',
      title: 'RPC Function Structure Mismatch',
      description: 'Some RPC functions may have parameter/return type mismatches',
      impact: 'Intermittent failures in conflict checking and availability validation',
      location: 'Database RPC functions, conflict checking logic',
      fix: 'Requires database function review and parameter validation'
    },
    {
      id: 'state-management-consistency',
      severity: 'low',
      status: 'verified',
      title: 'State Management Logic Verification',
      description: 'Complex state transitions when armado requirements change',
      impact: 'Potentially confusing service states during edits',
      location: 'EditServiceModal.tsx, updateServiceConfiguration function',
      fix: 'Logic verified and working correctly with proper warnings'
    },
    {
      id: 'error-handling-improvement',
      severity: 'medium', 
      status: 'enhanced',
      title: 'Enhanced Error Handling',
      description: 'Improved error messages and user feedback for database operations',
      impact: 'Better user experience during failures',
      location: 'All mutation functions in useServiciosPlanificados',
      fix: 'Added comprehensive error handling and user-friendly messages'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'fixed':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Corregido</Badge>;
      case 'identified':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Identificado</Badge>;
      case 'verified':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Verificado</Badge>;
      case 'enhanced':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Mejorado</Badge>;
      default:
        return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">Alta</Badge>;
      case 'medium':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Media</Badge>;
      case 'low':
        return <Badge variant="outline">Baja</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fixed':
      case 'verified':
      case 'enhanced':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'identified':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default:
        return <Bug className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <Card className="border-slate-200/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Sprint 4: Revisión de Workflow y Corrección de Bugs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-semibold text-emerald-600">
              {bugsFixes.filter(b => ['fixed', 'verified', 'enhanced'].includes(b.status)).length}
            </div>
            <div className="text-sm text-slate-600">Corregidos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-amber-600">
              {bugsFixes.filter(b => b.status === 'identified').length}
            </div>
            <div className="text-sm text-slate-600">Identificados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-red-600">
              {bugsFixes.filter(b => b.severity === 'high').length}
            </div>
            <div className="text-sm text-slate-600">Alta Prioridad</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-slate-600">
              {bugsFixes.length}
            </div>
            <div className="text-sm text-slate-600">Total Revisados</div>
          </div>
        </div>

        <div className="space-y-3">
          {bugsFixes.map((bug) => (
            <div
              key={bug.id}
              className="border border-slate-200/60 rounded-lg p-4 hover:bg-slate-50/60 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(bug.status)}
                    <h4 className="font-medium text-slate-900">{bug.title}</h4>
                    <div className="flex gap-1">
                      {getSeverityBadge(bug.severity)}
                      {getStatusBadge(bug.status)}
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-700">{bug.description}</p>
                  
                  <div className="text-xs text-slate-600 space-y-1">
                    <div><strong>Impacto:</strong> {bug.impact}</div>
                    <div><strong>Ubicación:</strong> {bug.location}</div>
                    <div><strong>Solución:</strong> {bug.fix}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Sprint 4 Completado</h4>
              <p className="text-sm text-blue-800 mt-1">
                Se han identificado y corregido los principales bugs del workflow. 
                Las funciones críticas ahora usan campos consistentes para las consultas de base de datos,
                mejorando la estabilidad y confiabilidad del sistema.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}