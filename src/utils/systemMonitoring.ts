import { supabase } from '@/integrations/supabase/client';

interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  category: string;
  message: string;
  details?: any;
  userId?: string;
  userRole?: string;
}

interface SystemMetrics {
  authErrors: number;
  permissionDenials: number;
  rpcFailures: number;
  totalUsers: number;
  activeRoles: string[];
  lastUpdate: number;
}

class SystemMonitoring {
  private logs: LogEntry[] = [];
  private metrics: SystemMetrics = {
    authErrors: 0,
    permissionDenials: 0,
    rpcFailures: 0,
    totalUsers: 0,
    activeRoles: [],
    lastUpdate: Date.now()
  };

  // Logging methods
  log(level: 'info' | 'warn' | 'error', category: string, message: string, details?: any, userId?: string, userRole?: string) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      details,
      userId,
      userRole
    };

    this.logs.push(entry);
    
    // Mantener solo los últimos 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    // Actualizar métricas según el tipo de log
    this.updateMetrics(entry);

    // Log a consola con formato
    const logMessage = `[${category}] ${message}`;
    switch (level) {
      case 'error':
        console.error(logMessage, details);
        break;
      case 'warn':
        console.warn(logMessage, details);
        break;
      default:
        console.info(logMessage, details);
    }
  }

  info(category: string, message: string, details?: any, userId?: string, userRole?: string) {
    this.log('info', category, message, details, userId, userRole);
  }

  warn(category: string, message: string, details?: any, userId?: string, userRole?: string) {
    this.log('warn', category, message, details, userId, userRole);
  }

  error(category: string, message: string, details?: any, userId?: string, userRole?: string) {
    this.log('error', category, message, details, userId, userRole);
  }

  private updateMetrics(entry: LogEntry) {
    const now = Date.now();
    
    // Actualizar contadores según categoría y nivel
    switch (entry.category) {
      case 'AUTH':
        if (entry.level === 'error') this.metrics.authErrors++;
        break;
      case 'PERMISSIONS':
        if (entry.level === 'error') this.metrics.permissionDenials++;
        break;
      case 'RPC':
        if (entry.level === 'error') this.metrics.rpcFailures++;
        break;
    }

    this.metrics.lastUpdate = now;
  }

  // Métodos de monitoreo específicos
  async logAuthEvent(event: string, userId?: string, userRole?: string, details?: any) {
    this.info('AUTH', `Auth event: ${event}`, details, userId, userRole);
  }

  async logPermissionCheck(permission: string, allowed: boolean, userId?: string, userRole?: string) {
    const level = allowed ? 'info' : 'warn';
    const message = `Permission ${permission}: ${allowed ? 'granted' : 'denied'}`;
    this.log(level, 'PERMISSIONS', message, { permission, allowed }, userId, userRole);
  }

  async logRpcCall(rpcName: string, success: boolean, userId?: string, userRole?: string, error?: any) {
    const level = success ? 'info' : 'error';
    const message = `RPC ${rpcName}: ${success ? 'success' : 'failed'}`;
    this.log(level, 'RPC', message, { rpcName, success, error }, userId, userRole);
  }

  async logRouteAccess(route: string, allowed: boolean, userId?: string, userRole?: string) {
    const level = allowed ? 'info' : 'warn';
    const message = `Route access ${route}: ${allowed ? 'granted' : 'denied'}`;
    this.log(level, 'ROUTES', message, { route, allowed }, userId, userRole);
  }

  // Métodos de consulta
  getLogs(category?: string, level?: 'info' | 'warn' | 'error', limit: number = 100): LogEntry[] {
    let filteredLogs = this.logs;

    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    return filteredLogs.slice(-limit);
  }

  getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  getErrorSummary(): { category: string; count: number }[] {
    const errorCounts: Record<string, number> = {};
    
    this.logs
      .filter(log => log.level === 'error')
      .forEach(log => {
        errorCounts[log.category] = (errorCounts[log.category] || 0) + 1;
      });

    return Object.entries(errorCounts).map(([category, count]) => ({
      category,
      count
    }));
  }

  // Actualizar métricas del sistema
  async updateSystemMetrics() {
    try {
      // Obtener total de usuarios
      const { count: userCount, error: userError } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true });

      if (!userError && userCount !== null) {
        this.metrics.totalUsers = userCount;
      }

      // Obtener roles activos
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .not('role', 'is', null);

      if (!rolesError && rolesData) {
        this.metrics.activeRoles = [...new Set(rolesData.map(r => r.role))];
      }

      this.metrics.lastUpdate = Date.now();
      this.info('METRICS', 'System metrics updated', this.metrics);
    } catch (error) {
      this.error('METRICS', 'Failed to update system metrics', error);
    }
  }

  // Limpiar logs antiguos
  clearOldLogs(olderThanHours: number = 24) {
    const cutoff = Date.now() - (olderThanHours * 60 * 60 * 1000);
    const initialCount = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp > cutoff);
    const clearedCount = initialCount - this.logs.length;
    
    if (clearedCount > 0) {
      this.info('SYSTEM', `Cleared ${clearedCount} old log entries`);
    }
  }

  // Reset métricas
  resetMetrics() {
    this.metrics = {
      authErrors: 0,
      permissionDenials: 0,
      rpcFailures: 0,
      totalUsers: 0,
      activeRoles: [],
      lastUpdate: Date.now()
    };
    this.info('SYSTEM', 'Metrics reset');
  }

  // Export logs para debugging
  exportLogs(): string {
    return JSON.stringify({
      logs: this.logs,
      metrics: this.metrics,
      timestamp: new Date().toISOString()
    }, null, 2);
  }
}

// Instancia singleton
export const systemMonitoring = new SystemMonitoring();

// Configurar limpieza automática cada hora
if (typeof window !== 'undefined') {
  setInterval(() => {
    systemMonitoring.clearOldLogs(24);
    systemMonitoring.updateSystemMetrics();
  }, 60 * 60 * 1000); // 1 hora
}