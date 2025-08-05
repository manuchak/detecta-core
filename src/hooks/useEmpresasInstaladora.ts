import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmpresaInstaladora {
  id: string;
  razon_social: string;
  nombre_comercial?: string;
  rfc: string;
  telefono_principal: string;
  email_principal: string;
  direccion_fiscal?: string;
  cobertura_geografica: string[];
  especialidades: string[];
  estado_contrato: 'activo' | 'inactivo' | 'suspendido';
  tarifas_negociadas: Record<string, any>;
  documentacion_completa: boolean;
  certificaciones: string[];
  años_experiencia?: number;
  capacidad_instaladores?: number;
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactoEmpresa {
  id: string;
  empresa_id: string;
  nombre_completo: string;
  cargo: string;
  telefono: string;
  email: string;
  rol_contacto: 'comercial' | 'tecnico' | 'administrativo' | 'coordinador';
  es_contacto_principal: boolean;
  activo: boolean;
  permisos_acceso: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateEmpresaData {
  razon_social: string;
  nombre_comercial?: string;
  rfc: string;
  telefono_principal: string;
  email_principal: string;
  direccion_fiscal?: string;
  cobertura_geografica: string[];
  especialidades: string[];
  tarifas_negociadas?: Record<string, any>;
  certificaciones?: string[];
  años_experiencia?: number;
  capacidad_instaladores?: number;
  observaciones?: string;
}

export interface CreateContactoData {
  empresa_id: string;
  nombre_completo: string;
  cargo: string;
  telefono: string;
  email: string;
  rol_contacto: 'comercial' | 'tecnico' | 'administrativo' | 'coordinador';
  es_contacto_principal?: boolean;
  permisos_acceso?: string[];
}

export const useEmpresasInstaladora = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener todas las empresas instaladoras
  const { data: empresas, isLoading: isLoadingEmpresas } = useQuery({
    queryKey: ['empresas-instaladoras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas_instaladoras')
        .select('*')
        .order('razon_social');

      if (error) throw error;
      return data as EmpresaInstaladora[];
    }
  });

  // Obtener empresas activas
  const { data: empresasActivas } = useQuery({
    queryKey: ['empresas-instaladoras-activas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas_instaladoras')
        .select('*')
        .eq('estado_contrato', 'activo')
        .order('razon_social');

      if (error) throw error;
      return data as EmpresaInstaladora[];
    }
  });

  // Obtener contactos de una empresa
  const getContactosEmpresa = (empresaId: string) => {
    return useQuery({
      queryKey: ['contactos-empresa', empresaId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('contactos_empresa')
          .select('*')
          .eq('empresa_id', empresaId)
          .eq('activo', true)
          .order('es_contacto_principal', { ascending: false });

        if (error) throw error;
        return data as ContactoEmpresa[];
      },
      enabled: !!empresaId
    });
  };

  // Crear nueva empresa
  const createEmpresa = useMutation({
    mutationFn: async (data: CreateEmpresaData) => {
      const { data: result, error } = await supabase
        .from('empresas_instaladoras')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas-instaladoras'] });
      queryClient.invalidateQueries({ queryKey: ['empresas-instaladoras-activas'] });
      toast({
        title: "Empresa registrada",
        description: "La empresa instaladora ha sido registrada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo registrar la empresa instaladora.",
        variant: "destructive",
      });
      console.error('Error creating empresa:', error);
    }
  });

  // Actualizar empresa
  const updateEmpresa = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EmpresaInstaladora> }) => {
      const { data: result, error } = await supabase
        .from('empresas_instaladoras')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas-instaladoras'] });
      queryClient.invalidateQueries({ queryKey: ['empresas-instaladoras-activas'] });
      toast({
        title: "Empresa actualizada",
        description: "Los datos de la empresa han sido actualizados.",
      });
    }
  });

  // Crear contacto de empresa
  const createContacto = useMutation({
    mutationFn: async (data: CreateContactoData) => {
      const { data: result, error } = await supabase
        .from('contactos_empresa')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contactos-empresa', variables.empresa_id] });
      toast({
        title: "Contacto agregado",
        description: "El contacto ha sido agregado exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo agregar el contacto.",
        variant: "destructive",
      });
      console.error('Error creating contacto:', error);
    }
  });

  // Actualizar contacto
  const updateContacto = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ContactoEmpresa> }) => {
      const { data: result, error } = await supabase
        .from('contactos_empresa')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['contactos-empresa', result.empresa_id] });
      toast({
        title: "Contacto actualizado",
        description: "Los datos del contacto han sido actualizados.",
      });
    }
  });

  // Cambiar estado de empresa
  const cambiarEstadoEmpresa = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: 'activo' | 'inactivo' | 'suspendido' }) => {
      const { data, error } = await supabase
        .from('empresas_instaladoras')
        .update({ estado_contrato: estado })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas-instaladoras'] });
      queryClient.invalidateQueries({ queryKey: ['empresas-instaladoras-activas'] });
      toast({
        title: "Estado actualizado",
        description: "El estado de la empresa ha sido actualizado.",
      });
    }
  });

  return {
    empresas,
    empresasActivas,
    isLoadingEmpresas,
    getContactosEmpresa,
    createEmpresa,
    updateEmpresa,
    createContacto,
    updateContacto,
    cambiarEstadoEmpresa
  };
};