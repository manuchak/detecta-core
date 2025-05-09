
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Permission, Role } from "@/types/roleTypes";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface AddPermissionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newPermission: {
    role: Role;
    permissionType: string;
    permissionId: string;
    allowed: boolean;
  };
  onNewPermissionChange: (field: string, value: string | boolean | Role) => void;
  onAddPermission: () => void;
  availableRoles: Role[] | undefined;
  existingPermissions?: Permission[];
}

// Schema for permission form validation
const permissionSchema = z.object({
  role: z.string().min(1, "El rol es requerido"),
  permissionType: z.string().min(1, "El tipo de permiso es requerido"),
  permissionId: z.string().min(1, "El ID del permiso es requerido"),
  allowed: z.boolean()
});

export const AddPermissionDialog = ({
  isOpen,
  onOpenChange,
  newPermission,
  onNewPermissionChange,
  onAddPermission,
  availableRoles,
  existingPermissions = []
}: AddPermissionDialogProps) => {
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [existingPermissionState, setExistingPermissionState] = useState<boolean | null>(null);

  // Initialize the form with react-hook-form and zod validation
  const form = useForm<z.infer<typeof permissionSchema>>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      role: newPermission.role,
      permissionType: newPermission.permissionType,
      permissionId: newPermission.permissionId,
      allowed: newPermission.allowed
    }
  });

  // Update form values when the props change
  useEffect(() => {
    form.reset({
      role: newPermission.role,
      permissionType: newPermission.permissionType,
      permissionId: newPermission.permissionId,
      allowed: newPermission.allowed
    });
  }, [newPermission, form]);

  // Check for duplicate permissions whenever form values change
  const checkDuplicate = (values: z.infer<typeof permissionSchema>) => {
    const { role, permissionType, permissionId } = values;
    
    const existingPerm = existingPermissions.find(
      p => p.role === role && 
           p.permission_type === permissionType && 
           p.permission_id === permissionId
    );
    
    if (existingPerm) {
      setIsDuplicate(true);
      setExistingPermissionState(existingPerm.allowed);
    } else {
      setIsDuplicate(false);
      setExistingPermissionState(null);
    }
  };

  // Watch form changes to detect duplicates
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.role && values.permissionType && values.permissionId) {
        checkDuplicate(values as z.infer<typeof permissionSchema>);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch, existingPermissions]);

  // Handle form submission
  const onSubmit = (values: z.infer<typeof permissionSchema>) => {
    // Only proceed if not a duplicate
    if (!isDuplicate) {
      onNewPermissionChange('role', values.role as Role);
      onNewPermissionChange('permissionType', values.permissionType);
      onNewPermissionChange('permissionId', values.permissionId);
      onNewPermissionChange('allowed', values.allowed);
      onAddPermission();
    }
  };

  const permissionTypeOptions = [
    { value: 'page', label: 'Página' },
    { value: 'module', label: 'Módulo' },
    { value: 'action', label: 'Acción' },
    { value: 'feature', label: 'Funcionalidad' },
    { value: 'admin', label: 'Administración' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <DialogTitle>Añadir Permiso</DialogTitle>
          </div>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Alert for duplicate permissions */}
            {isDuplicate && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm ml-2">
                  Este permiso ya existe y está {existingPermissionState ? "habilitado" : "deshabilitado"} para este rol.
                </AlertDescription>
              </Alert>
            )}

            {/* Role selection */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!availableRoles}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles?.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Permission Type */}
            <FormField
              control={form.control}
              name="permissionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Permiso</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {permissionTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Permission ID */}
            <FormField
              control={form.control}
              name="permissionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID del Permiso</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: dashboard, create_user, export_data" 
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Allowed Switch */}
            <FormField
              control={form.control}
              name="allowed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-x-2 space-y-0 rounded-md border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Estado del Permiso
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Habilitar o deshabilitar este permiso
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-green-600"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="sm:justify-between mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isDuplicate || !form.formState.isValid}
              >
                Añadir Permiso
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
