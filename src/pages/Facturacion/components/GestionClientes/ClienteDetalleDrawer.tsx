import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  CreditCard, 
  User, 
  Edit,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Wallet,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Receipt
} from 'lucide-react';
import { ClienteFiscal, REGIMENES_FISCALES, USOS_CFDI } from '../../hooks/useClientesFiscales';
import { useClienteCreditoAnalisis } from '../../hooks/useClienteCredito';
import { formatCurrency } from '@/utils/formatUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClienteDetalleDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: ClienteFiscal | null;
  onEdit: () => void;
}

export function ClienteDetalleDrawer({ 
  open, 
  onOpenChange, 
  cliente, 
  onEdit 
}: ClienteDetalleDrawerProps) {
  const { data: creditoAnalisis, isLoading } = useClienteCreditoAnalisis(cliente?.id);

  const getRegimenLabel = (value: string | null) => {
    if (!value) return '-';
    return REGIMENES_FISCALES.find(r => r.value === value)?.label || value;
  };

  const getUsoCfdiLabel = (value: string | null) => {
    if (!value) return '-';
    return USOS_CFDI.find(u => u.value === value)?.label || value;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return 'bg-emerald-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getComportamientoBadge = (comportamiento: string) => {
    switch (comportamiento) {
      case 'excelente':
        return <Badge className="bg-emerald-500/10 text-emerald-700 border-0">Excelente</Badge>;
      case 'bueno':
        return <Badge className="bg-blue-500/10 text-blue-700 border-0">Bueno</Badge>;
      case 'regular':
        return <Badge className="bg-amber-500/10 text-amber-700 border-0">Regular</Badge>;
      case 'riesgoso':
        return <Badge className="bg-red-500/10 text-red-700 border-0">Riesgoso</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  if (!cliente) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between pr-8">
            <div>
              <SheetTitle className="text-lg">{cliente.nombre}</SheetTitle>
              {cliente.razon_social && (
                <p className="text-sm text-muted-foreground">{cliente.razon_social}</p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Editar
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Credit Score Card */}
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : creditoAnalisis && (
            <Card className="bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Score Crediticio</span>
                  </div>
                  {getComportamientoBadge(creditoAnalisis.comportamiento)}
                </div>
                
                <div className="flex items-end gap-4">
                  <div className={`text-4xl font-bold ${getScoreColor(creditoAnalisis.score_crediticio)}`}>
                    {creditoAnalisis.score_crediticio}
                  </div>
                  <div className="flex-1">
                    <Progress 
                      value={creditoAnalisis.score_crediticio} 
                      className="h-2.5"
                    />
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>0</span>
                      <span>50</span>
                      <span>100</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Credit Utilization */}
          {creditoAnalisis && (
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Wallet className="h-3.5 w-3.5" />
                    <span className="text-xs">Saldo Actual</span>
                  </div>
                  <p className="text-lg font-bold">{formatCurrency(creditoAnalisis.saldo_actual)}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <CreditCard className="h-3.5 w-3.5" />
                    <span className="text-xs">Límite Crédito</span>
                  </div>
                  <p className="text-lg font-bold">
                    {creditoAnalisis.limite_credito 
                      ? formatCurrency(creditoAnalisis.limite_credito)
                      : 'Sin límite'
                    }
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span className="text-xs">Utilización</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-lg font-bold ${
                      creditoAnalisis.credito_utilizado_pct > 90 ? 'text-red-600' :
                      creditoAnalisis.credito_utilizado_pct > 70 ? 'text-amber-600' :
                      'text-emerald-600'
                    }`}>
                      {creditoAnalisis.limite_credito ? `${creditoAnalisis.credito_utilizado_pct}%` : '-'}
                    </p>
                    {creditoAnalisis.credito_utilizado_pct > 90 && (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-xs">Días Prom. Pago</span>
                  </div>
                  <p className={`text-lg font-bold ${
                    creditoAnalisis.dias_promedio_pago > 60 ? 'text-red-600' :
                    creditoAnalisis.dias_promedio_pago > 45 ? 'text-amber-600' :
                    'text-emerald-600'
                  }`}>
                    {creditoAnalisis.dias_promedio_pago || 0} días
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Stats */}
          {creditoAnalisis && (
            <div className="flex items-center justify-around py-3 bg-muted/30 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold">{creditoAnalisis.facturas_pendientes}</p>
                <p className="text-xs text-muted-foreground">Facturas Pendientes</p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="text-center">
                <p className={`text-2xl font-bold ${creditoAnalisis.facturas_vencidas > 0 ? 'text-red-600' : ''}`}>
                  {creditoAnalisis.facturas_vencidas}
                </p>
                <p className="text-xs text-muted-foreground">Vencidas</p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="text-center">
                <p className="text-2xl font-bold">{formatCurrency(creditoAnalisis.historial_pagos_30d)}</p>
                <p className="text-xs text-muted-foreground">Pagado últ. 30d</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Tabs with Details */}
          <Tabs defaultValue="fiscal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="fiscal" className="text-xs">
                <Building2 className="h-3.5 w-3.5 mr-1" />
                Fiscal
              </TabsTrigger>
              <TabsTrigger value="comercial" className="text-xs">
                <Receipt className="h-3.5 w-3.5 mr-1" />
                Comercial
              </TabsTrigger>
              <TabsTrigger value="contacto" className="text-xs">
                <User className="h-3.5 w-3.5 mr-1" />
                Contacto
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fiscal" className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">RFC</p>
                  <p className="font-mono font-medium">{cliente.rfc || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">C.P. Fiscal</p>
                  <p className="font-medium">{cliente.codigo_postal_fiscal || '-'}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Régimen Fiscal</p>
                <p className="font-medium text-sm">{getRegimenLabel(cliente.regimen_fiscal)}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Uso CFDI por Defecto</p>
                <p className="font-medium text-sm">{getUsoCfdiLabel(cliente.uso_cfdi_default)}</p>
              </div>
              
              {cliente.direccion_fiscal && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Dirección Fiscal
                  </p>
                  <p className="text-sm">{cliente.direccion_fiscal}</p>
                </div>
              )}

              {/* Fiscal Status */}
              <div className="mt-4 p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  {cliente.rfc && cliente.razon_social && cliente.regimen_fiscal && cliente.codigo_postal_fiscal ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-emerald-700 font-medium">Datos fiscales completos</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm text-amber-700 font-medium">Faltan datos fiscales</span>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="comercial" className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Días de Crédito</p>
                  <p className="text-xl font-bold">{cliente.dias_credito || 30}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Límite de Crédito</p>
                  <p className="text-xl font-bold">
                    {cliente.limite_credito ? formatCurrency(cliente.limite_credito) : 'Sin límite'}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Día de Corte
                  </p>
                  <p className="font-medium">Día {cliente.dia_corte || 15}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Día de Pago
                  </p>
                  <p className="font-medium">Día {cliente.dia_pago || 30}</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Prioridad de Cobranza</p>
                <Badge variant={
                  cliente.prioridad_cobranza === 'alta' ? 'destructive' :
                  cliente.prioridad_cobranza === 'baja' ? 'secondary' : 'default'
                }>
                  {cliente.prioridad_cobranza?.charAt(0).toUpperCase() + cliente.prioridad_cobranza?.slice(1) || 'Normal'}
                </Badge>
              </div>
              
              {cliente.notas_cobranza && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Notas de Cobranza</p>
                  <p className="text-sm p-2 bg-muted/30 rounded">{cliente.notas_cobranza}</p>
                </div>
              )}

              {/* Payment History */}
              {creditoAnalisis && creditoAnalisis.ultimo_pago_fecha && (
                <div className="mt-4 p-3 rounded-lg bg-emerald-500/10">
                  <p className="text-xs text-muted-foreground mb-1">Último Pago</p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {format(new Date(creditoAnalisis.ultimo_pago_fecha), 'dd MMM yyyy', { locale: es })}
                    </span>
                    <span className="font-bold text-emerald-700">
                      {formatCurrency(creditoAnalisis.ultimo_pago_monto || 0)}
                    </span>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="contacto" className="mt-4 space-y-3">
              {cliente.contacto_facturacion_nombre ? (
                <>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Contacto de Facturación</p>
                    <p className="font-medium">{cliente.contacto_facturacion_nombre}</p>
                  </div>
                  
                  {cliente.contacto_facturacion_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`mailto:${cliente.contacto_facturacion_email}`}
                        className="text-primary hover:underline"
                      >
                        {cliente.contacto_facturacion_email}
                      </a>
                    </div>
                  )}
                  
                  {cliente.contacto_facturacion_tel && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`tel:${cliente.contacto_facturacion_tel}`}
                        className="text-primary hover:underline"
                      >
                        {cliente.contacto_facturacion_tel}
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <User className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin contacto de facturación registrado</p>
                  <Button variant="link" size="sm" onClick={onEdit}>
                    Agregar contacto
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
