import React, { createContext, useContext, useState, useEffect } from 'react';

interface SandboxContextType {
  isSandboxMode: boolean;
  toggleSandboxMode: () => void;
}

const SandboxContext = createContext<SandboxContextType | undefined>(undefined);

export const SandboxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSandboxMode, setIsSandboxMode] = useState(false);

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
    setIsSandboxMode(prev => {
      const newValue = !prev;
      const timestamp = new Date().toISOString();
      
      localStorage.setItem('sandbox-mode', String(newValue));
      localStorage.setItem('sandbox-mode-timestamp', timestamp);
      
      console.log(`🔄 SandboxContext: Modo cambiado a ${newValue ? 'SANDBOX' : 'PRODUCCIÓN'}`, {
        newValue,
        timestamp,
        url: window.location.href
      });
      
      return newValue;
    });
  };

  return (
    <SandboxContext.Provider value={{ isSandboxMode, toggleSandboxMode }}>
      {children}
    </SandboxContext.Provider>
  );
};

export const useSandbox = () => {
  const context = useContext(SandboxContext);
  if (!context) throw new Error('useSandbox must be used within SandboxProvider');
  return context;
};
