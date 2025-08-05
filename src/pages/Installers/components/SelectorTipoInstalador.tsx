import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Building, MapPin, Phone, Mail, Star } from 'lucide-react';
import { useInstaladores } from '@/hooks/useInstaladores';
import { useEmpresasInstaladora } from '@/hooks/useEmpresasInstaladora';

export interface InstaladorSeleccionado {
  tipo: 'individual' | 'empresa';
  id: string;
  nombre: string;
  contacto?: string;
  empresa_id?: string;
  contacto_empresa_id?: string;
}

interface SelectorTipoInstaladorProps {
  value?: InstaladorSeleccionado;
  onChange: (instalador: InstaladorSeleccionado | undefined) => void;
  ciudadRequerida?: string;
}

export const SelectorTipoInstalador: React.FC<SelectorTipoInstaladorProps> = ({
  value,
  onChange,
  ciudadRequerida
}) => {
  const [tipoSeleccionado, setTipoSeleccionado] = React.useState<'individual' | 'empresa' | undefined>(value?.tipo);
  const [empresaSeleccionada, setEmpresaSeleccionada] = React.useState<string | undefined>(value?.empresa_id);
  
  const { instaladoresActivos } = useInstaladores();
  const { empresasActivas, getContactosEmpresa } = useEmpresasInstaladora();
  
  const contactosQuery = empresaSeleccionada ? getContactosEmpresa(empresaSeleccionada) : null;
  const contactos = contactosQuery?.data || [];

  // Filtrar instaladores por ciudad si es necesario
  const instaladoresFiltrados = React.useMemo(() => {
    if (!ciudadRequerida || !instaladoresActivos) return instaladoresActivos;
    
    return instaladoresActivos.filter(instalador => 
      instalador.zona_cobertura?.ciudades?.some(ciudad => 
        ciudad.toLowerCase().includes(ciudadRequerida.toLowerCase())
      )
    );
  }, [instaladoresActivos, ciudadRequerida]);

  // Filtrar empresas por ciudad si es necesario
  const empresasFiltradas = React.useMemo(() => {
    if (!ciudadRequerida || !empresasActivas) return empresasActivas;
    
    return empresasActivas.filter(empresa => 
      empresa.cobertura_geografica.some(ciudad => 
        ciudad.toLowerCase().includes(ciudadRequerida.toLowerCase())
      )
    );
  }, [empresasActivas, ciudadRequerida]);

  const handleTipoChange = (tipo: 'individual' | 'empresa') => {
    setTipoSeleccionado(tipo);
    setEmpresaSeleccionada(undefined);
    onChange(undefined);
  };

  const handleInstaladorSelect = (instaladorId: string) => {
    const instalador = instaladoresFiltrados?.find(i => i.id === instaladorId);
    if (instalador) {
      onChange({
        tipo: 'individual',
        id: instalador.id,
        nombre: instalador.nombre_completo,
        contacto: instalador.telefono
      });
    }
  };

  const handleEmpresaSelect = (empresaId: string) => {
    setEmpresaSeleccionada(empresaId);
    const empresa = empresasFiltradas?.find(e => e.id === empresaId);
    if (empresa) {
      onChange({
        tipo: 'empresa',
        id: empresa.id,
        nombre: empresa.nombre_comercial || empresa.razon_social,
        empresa_id: empresa.id
      });
    }
  };

  const handleContactoSelect = (contactoId: string) => {
    const contacto = contactos.find(c => c.id === contactoId);
    const empresa = empresasFiltradas?.find(e => e.id === empresaSeleccionada);
    
    if (contacto && empresa) {
      onChange({
        tipo: 'empresa',
        id: empresa.id,
        nombre: empresa.nombre_comercial || empresa.razon_social,
        contacto: `${contacto.nombre_completo} (${contacto.cargo})`,
        empresa_id: empresa.id,
        contacto_empresa_id: contacto.id
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector de Tipo */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Tipo de Instalador</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${
              tipoSeleccionado === 'individual' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleTipoChange('individual')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Instalador Individual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Instaladores registrados individualmente con certificación propia
              </p>
              {instaladoresFiltrados && (
                <p className="text-xs text-muted-foreground mt-2">
                  {instaladoresFiltrados.length} instaladores disponibles
                  {ciudadRequerida && ` en ${ciudadRequerida}`}
                </p>
              )}
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${
              tipoSeleccionado === 'empresa' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleTipoChange('empresa')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building className="h-5 w-5" />
                Empresa Integradora
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Empresas con equipo de instaladores y contratos corporativos
              </p>
              {empresasFiltradas && (
                <p className="text-xs text-muted-foreground mt-2">
                  {empresasFiltradas.length} empresas disponibles
                  {ciudadRequerida && ` en ${ciudadRequerida}`}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Selección de Instalador Individual */}
      {tipoSeleccionado === 'individual' && (
        <div className="space-y-4">
          <Label className="text-base font-semibold">Seleccionar Instalador</Label>
          {instaladoresFiltrados && instaladoresFiltrados.length > 0 ? (
            <div className="grid gap-3">
              {instaladoresFiltrados.map((instalador) => (
                <Card 
                  key={instalador.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    value?.id === instalador.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleInstaladorSelect(instalador.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{instalador.nombre_completo}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {instalador.telefono}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {instalador.calificacion_promedio}/5
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {instalador.especialidades.map((esp, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {esp}
                            </Badge>
                          ))}
                        </div>
                        {instalador.zona_cobertura?.ciudades && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {instalador.zona_cobertura.ciudades.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  No hay instaladores individuales disponibles
                  {ciudadRequerida && ` en ${ciudadRequerida}`}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Selección de Empresa */}
      {tipoSeleccionado === 'empresa' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <Label className="text-base font-semibold">Seleccionar Empresa</Label>
            <Select value={empresaSeleccionada} onValueChange={handleEmpresaSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una empresa integradora" />
              </SelectTrigger>
              <SelectContent>
                {empresasFiltradas?.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {empresa.nombre_comercial || empresa.razon_social}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {empresa.cobertura_geografica.join(', ')}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Información de la Empresa Seleccionada */}
          {empresaSeleccionada && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de la Empresa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const empresa = empresasFiltradas?.find(e => e.id === empresaSeleccionada);
                  if (!empresa) return null;
                  
                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Razón Social</Label>
                          <p className="text-sm">{empresa.razon_social}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">RFC</Label>
                          <p className="text-sm">{empresa.rfc}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Experiencia</Label>
                          <p className="text-sm">{empresa.años_experiencia || 'N/A'} años</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Capacidad</Label>
                          <p className="text-sm">{empresa.capacidad_instaladores || 'N/A'} instaladores</p>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Especialidades</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {empresa.especialidades.map((esp, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {esp}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Selección de Contacto */}
          {empresaSeleccionada && contactos.length > 0 && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">Contacto Responsable</Label>
              <Select value={value?.contacto_empresa_id} onValueChange={handleContactoSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un contacto responsable" />
                </SelectTrigger>
                <SelectContent>
                  {contactos.map((contacto) => (
                    <SelectItem key={contacto.id} value={contacto.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{contacto.nombre_completo}</span>
                        <span className="text-xs text-muted-foreground">
                          {contacto.cargo} • {contacto.rol_contacto}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Resumen de Selección */}
      {value && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selección Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {value.tipo === 'individual' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Building className="h-4 w-4" />
                )}
                <span className="font-medium">{value.nombre}</span>
                <Badge variant={value.tipo === 'individual' ? 'default' : 'secondary'}>
                  {value.tipo === 'individual' ? 'Individual' : 'Empresa'}
                </Badge>
              </div>
              {value.contacto && (
                <p className="text-sm text-muted-foreground">
                  Contacto: {value.contacto}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};