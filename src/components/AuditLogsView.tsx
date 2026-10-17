import React, { useState } from 'react';
import { ShieldAlert, Search, Filter, History, User } from 'lucide-react';

interface Props {
  logs: any[];
}

export const AuditLogsView: React.FC<Props> = ({ logs }) => {
  const [filterAction, setFilterAction] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter((log) => {
    const matchesAction = filterAction === 'all' || log.action?.includes(filterAction);
    const matchesSearch =
      log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress?.includes(searchTerm);
    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Registro de Auditoría & Trazabilidad de Seguridad
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Historial inmutable de cambios de estado, aprobaciones, modificaciones de metadatos y accesos al sistema.
          </p>
        </div>

        <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl font-mono">
          {logs.length} eventos registrados
        </span>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción o IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">Filtrar por evento:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos los eventos</option>
            <option value="APPROVE">Aprobaciones</option>
            <option value="SUBMIT">Envíos a revisión</option>
            <option value="EDIT">Modificaciones de metadatos</option>
            <option value="REJECT">Rechazos</option>
            <option value="LOGIN">Inicios de sesión</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 text-[11px] border-b border-slate-200 font-sans font-semibold">
              <tr>
                <th className="p-3">Fecha y Hora</th>
                <th className="p-3">Actor / Rol</th>
                <th className="p-3">Acción</th>
                <th className="p-3">Detalles</th>
                <th className="p-3">Dirección IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3 text-slate-500 text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3 font-sans">
                    <span className="font-bold text-slate-900 block">{log.userName}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                      {log.role}
                    </span>
                  </td>
                  <td className="p-3 font-sans">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action?.includes('APPROVE')
                          ? 'bg-emerald-50 text-emerald-700'
                          : log.action?.includes('REJECT')
                          ? 'bg-rose-50 text-rose-700'
                          : log.action?.includes('SUBMIT')
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-sans text-slate-700 max-w-xs truncate">
                    {log.details || 'Operación estándar'}
                    {log.oldValue && log.newValue && (
                      <span className="block font-mono text-[10px] text-slate-500 mt-0.5">
                        {log.field}: {log.oldValue} ➔ {log.newValue}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
