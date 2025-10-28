import React, { createContext, useContext, useState, useEffect } from 'react';

interface SandboxContextType {
  isSandboxMode: boolean;
  toggleSandboxMode: () => void;
  subscribeModeChange: (callback: (newMode: boolean) => void) => () => void;
  updateUserRole?: (role: string | null) => void;
}

const SandboxContext = createContext<SandboxContextType | undefined>(undefined);

// Event emitter para notificar cambios de modo
const modeChangeListeners = new Set<(newMode: boolean) => void>();

export const SandboxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Persistir en localStorage y validar consistencia
  useEffect(() => {
    const saved = localStorage.getItem('sandbox-mode');
    const timestamp = localStorage.getItem('sandbox-mode-timestamp');
    
    console.log('🔍 SandboxContext: Inicializando desde localStorage', {
      savedValue: saved,
      timestamp: timestamp,
      currentDate: new Date().toISOString()
    });
    
    if (saved === 'true') setIsSandboxMode(true);
  }, []);

  const toggleSandboxMode = () => {
    // 🚫 Validar permisos antes de cambiar
    if (userRole && userRole !== 'admin' && userRole !== 'owner') {
      console.warn('🚫 SandboxContext: Intento de cambio de modo sin permisos', {
        userRole,
        currentMode: isSandboxMode ? 'SANDBOX' : 'PRODUCCIÓN'
      });
      return; // Bloquear cambio
    }
    
    setIsSandboxMode(prev => {
      const newValue = !prev;
      const timestamp = new Date().toISOString();
      
      localStorage.setItem('sandbox-mode', String(newValue));
      localStorage.setItem('sandbox-mode-timestamp', timestamp);
      
      console.log(`🔄 SandboxContext: Modo cambiado a ${newValue ? 'SANDBOX' : 'PRODUCCIÓN'}`, {
        newValue,
        timestamp,
        url: window.location.href,
        userRole
      });
      
      // Notificar a todos los listeners
      modeChangeListeners.forEach(listener => {
        try {
          listener(newValue);
        } catch (error) {
          console.error('Error en listener de cambio de modo:', error);
        }
      });
      
      return newValue;
    });
  };
  
  // Función para actualizar el rol del usuario desde AuthContext
  const updateUserRole = (role: string | null) => {
    setUserRole(role);
    console.log('🔄 SandboxContext: Rol de usuario actualizado', { role });
  };

  const subscribeModeChange = (callback: (newMode: boolean) => void) => {
    modeChangeListeners.add(callback);
    return () => {
      modeChangeListeners.delete(callback);
    };
  };

  return (
    <SandboxContext.Provider value={{ isSandboxMode, toggleSandboxMode, subscribeModeChange, updateUserRole }}>
      {children}
    </SandboxContext.Provider>
  );
};

export const useSandbox = () => {
  const context = useContext(SandboxContext);
  if (!context) throw new Error('useSandbox must be used within SandboxProvider');
  return context;
};
