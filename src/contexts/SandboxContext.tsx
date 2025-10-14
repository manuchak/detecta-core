import React, { createContext, useContext, useState, useEffect } from 'react';

interface SandboxContextType {
  isSandboxMode: boolean;
  toggleSandboxMode: () => void;
}

const SandboxContext = createContext<SandboxContextType | undefined>(undefined);

export const SandboxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  // Persistir en localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sandbox-mode');
    if (saved === 'true') setIsSandboxMode(true);
  }, []);

  const toggleSandboxMode = () => {
    setIsSandboxMode(prev => {
      const newValue = !prev;
      localStorage.setItem('sandbox-mode', String(newValue));
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
