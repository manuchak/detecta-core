import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Loader2 } from 'lucide-react';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableRoles: string[];
  getRoleDisplayName: (role: string) => string;
  onSuccess: () => void;
}

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
  open, onOpenChange, availableRoles, getRoleDisplayName, onSuccess
}) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setNombre('');
    setEmail('');
    setRol('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim() || !email.trim() || !rol) {
      toast({ title: 'Error', description: 'Todos los campos son requeridos', variant: 'destructive' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({ title: 'Error', description: 'Email inválido', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-staff-account', {
        body: { email: email.trim(), nombre: nombre.trim(), rol },
      });

      if (error) throw error;

      if (data?.error) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
        return;
      }

      toast({
        title: 'Usuario creado',
        description: data?.warning
          ? data.warning
          : `Se envió un correo a ${email.trim()} para establecer su contraseña`,
      });

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error('Error creating staff account:', err);
      toast({
        title: 'Error',
        description: err?.message || 'Error al crear el usuario',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out pending/unverified from creation roles
  const creatableRoles = availableRoles.filter(r => r !== 'pending' && r !== 'unverified');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Crear Usuario
          </DialogTitle>
          <DialogDescription>
            El usuario recibirá un correo para establecer su contraseña e ingresará con el rol asignado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input
              id="nombre"
              placeholder="Juan Pérez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={100}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="juan@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rol">Rol</Label>
            <Select value={rol} onValueChange={setRol} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {creatableRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {getRoleDisplayName(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Crear Usuario
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
