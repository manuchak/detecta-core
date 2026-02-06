import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  WhatsAppTemplateRecord,
  MetaApprovalStatus,
  TEMPLATE_CONFIGS,
  TEMPLATE_CONTENT,
  TEMPLATE_VARIABLES,
  TEMPLATE_CATEGORIES,
  DetectaTemplateName,
  TemplateCategoryKey
} from '@/types/kapso';

interface TemplateTestPayload {
  templateName: string;
  phone: string;
  variables: Record<string, string>;
}

export const useWhatsAppTemplatesAdmin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all templates from DB
  const { data: templates = [], isLoading, refetch } = useQuery({
    queryKey: ['whatsapp-templates-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as WhatsAppTemplateRecord[];
    }
  });

  // Helper to generate template seeds
  const generateTemplateSeeds = () => {
    return Object.entries(TEMPLATE_CONFIGS).map(([key, config]) => {
      const templateName = config.name as DetectaTemplateName;
      const categoryKey = Object.entries(TEMPLATE_CATEGORIES).find(
        ([_, cat]) => (cat.templates as readonly string[]).includes(templateName)
      )?.[0] || 'servicios';

      return {
        name: config.name,
        content: TEMPLATE_CONTENT[templateName] || '',
        category: categoryKey,
        meta_status: 'not_submitted',
        meta_category: config.category,
        variable_count: config.variableCount,
        has_buttons: config.hasButtons,
        button_count: config.buttonCount || 0,
        is_active: true
      };
    });
  };

  // Seed templates if none exist
  const seedTemplatesMutation = useMutation({
    mutationFn: async () => {
      const templateSeeds = generateTemplateSeeds();

      // Check if templates already exist
      const { data: existing } = await supabase
        .from('whatsapp_templates')
        .select('name')
        .limit(1);

      if (existing && existing.length > 0) {
        throw new Error('Los templates ya existen en la base de datos');
      }

      const { error } = await supabase
        .from('whatsapp_templates')
        .insert(templateSeeds);

      if (error) throw error;
      return templateSeeds.length;
    },
    onSuccess: (count) => {
      toast({
        title: 'Templates sembrados',
        description: `Se crearon ${count} templates exitosamente`
      });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates-admin'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al sembrar templates',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Reseed templates (delete all and recreate)
  const reseedTemplatesMutation = useMutation({
    mutationFn: async () => {
      // Delete all existing templates
      const { error: deleteError } = await supabase
        .from('whatsapp_templates')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

      if (deleteError) throw deleteError;

      // Insert new templates
      const templateSeeds = generateTemplateSeeds();
      const { error: insertError } = await supabase
        .from('whatsapp_templates')
        .insert(templateSeeds);

      if (insertError) throw insertError;
      return templateSeeds.length;
    },
    onSuccess: (count) => {
      toast({
        title: 'Templates reinicializados',
        description: `Se eliminaron los templates antiguos y se crearon ${count} nuevos templates`
      });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates-admin'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al reinicializar templates',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Update template status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      templateName, 
      status, 
      rejectionReason,
      metaTemplateId 
    }: { 
      templateName: string; 
      status: MetaApprovalStatus;
      rejectionReason?: string;
      metaTemplateId?: string;
    }) => {
      const { error } = await supabase
        .from('whatsapp_templates')
        .update({ 
          meta_status: status,
          rejection_reason: rejectionReason || null,
          meta_template_id: metaTemplateId || null,
          updated_at: new Date().toISOString()
        })
        .eq('name', templateName);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Estado actualizado',
        description: 'El estado del template se actualizó correctamente'
      });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates-admin'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al actualizar',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Send test message
  const sendTestMutation = useMutation({
    mutationFn: async ({ templateName, phone, variables }: TemplateTestPayload) => {
      // Build body parameters from variables
      const variableList = Object.values(variables);
      const bodyParams = variableList.map(text => ({ type: 'text' as const, text }));

      const { data, error } = await supabase.functions.invoke('kapso-send-template', {
        body: {
          to: phone,
          templateName,
          languageCode: 'es_MX',
          components: {
            body: { parameters: bodyParams }
          },
          context: { tipo_notificacion: 'template_test' }
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Error enviando template');

      // Update last test info
      await supabase
        .from('whatsapp_templates')
        .update({
          last_test_at: new Date().toISOString(),
          last_test_phone: phone
        })
        .eq('name', templateName);

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Prueba enviada',
        description: `Message ID: ${data.message_id}`
      });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates-admin'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al enviar prueba',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Group templates by category
  const templatesByCategory = useMemo(() => {
    const grouped: Record<TemplateCategoryKey, WhatsAppTemplateRecord[]> = {
      servicios: [],
      checklist: [],
      tickets: [],
      onboarding: [],
      siercp: [],
      lms: [],
      leads: [],
      supply: []
    };

    templates.forEach(template => {
      const categoryKey = template.category as TemplateCategoryKey;
      if (grouped[categoryKey]) {
        grouped[categoryKey].push(template);
      }
    });

    return grouped;
  }, [templates]);

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      total: templates.length,
      not_submitted: templates.filter(t => t.meta_status === 'not_submitted').length,
      pending: templates.filter(t => t.meta_status === 'pending').length,
      approved: templates.filter(t => t.meta_status === 'approved').length,
      rejected: templates.filter(t => t.meta_status === 'rejected').length
    };
  }, [templates]);

  // Get template variables
  const getTemplateVariables = (templateName: string): string[] => {
    return TEMPLATE_VARIABLES[templateName as DetectaTemplateName] || [];
  };

  // Get template content
  const getTemplateContent = (templateName: string): string => {
    return TEMPLATE_CONTENT[templateName as DetectaTemplateName] || '';
  };

  return {
    templates,
    isLoading,
    refetch,
    templatesByCategory,
    statusCounts,
    seedTemplates: seedTemplatesMutation.mutate,
    isSeedingTemplates: seedTemplatesMutation.isPending,
    reseedTemplates: reseedTemplatesMutation.mutate,
    isReseedingTemplates: reseedTemplatesMutation.isPending,
    updateStatus: updateStatusMutation.mutate,
    isUpdatingStatus: updateStatusMutation.isPending,
    sendTest: sendTestMutation.mutateAsync,
    isSendingTest: sendTestMutation.isPending,
    getTemplateVariables,
    getTemplateContent
  };
};
