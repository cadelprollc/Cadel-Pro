import React, { useState } from 'react';
import { Release, Role } from '../types.js';
import { ReleaseStatusBadge } from './ReleaseStatusBadge.js';
import {
  Search,
  Filter,
  Eye,
  Edit,
  Send,
  Music,
  Calendar,
  Disc,
  Clock,
  ArrowUpDown,
  ExternalLink,
  Plus,
} from 'lucide-react';

interface Props {
  releases: Release[];
  userRole: Role;
  isQcQueueOnly?: boolean;
  onOpenReview: (release: Release) => void;
  onEditRelease: (release: Release) => void;
  onSubmitRelease: (id: string) => void;
  onOpenNewRelease: () => void;
}

export const ReleasesList: React.FC<Props> = ({
  releases,
  userRole,
  isQcQueueOnly = false,
  onOpenReview,
  onEditRelease,
  onSubmitRelease,
  onOpenNewRelease,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(isQcQueueOnly ? 'submitted' : 'all');

  const filteredReleases = releases.filter((r) => {
    // Search match
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.mainArtist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.upc?.includes(searchTerm) ||
      r.tracks?.some((t) => t.isrc.toLowerCase().includes(searchTerm.toLowerCase()));

    // Status match
    if (isQcQueueOnly) {
      const isPending = r.status === 'submitted' || r.status === 'under_review';
      return matchesSearch && isPending;
    }

    if (statusFilter !== 'all') {
      return matchesSearch && r.status === statusFilter;
    }

    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            {isQcQueueOnly ? (
              <>
                <Clock className="w-5 h-5 text-amber-500" />
                Cola de Control de Calidad (Pendientes de Revisión)
              </>
            ) : (
              <>
                <Disc className="w-5 h-5 text-blue-600" />
                {userRole === 'artist' ? 'Sus Lanzamientos' : 'Catálogo de Lanzamientos'}
              </>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isQcQueueOnly
              ? 'Lanzamientos enviados por artistas a la espera de validación de audio WAV, portada y metadatos.'
              : userRole === 'artist'
              ? 'Consulta el estado de tus canciones, códigos oficiales ISRC/UPC y los detalles de distribución que te asignó el Super Administrador.'
              : 'Gestiona singles, EPs y álbumes listos para distribución en tiendas digitales.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewRelease}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo Lanzamiento
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por título, artista, UPC o ISRC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        {!isQcQueueOnly && (
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Filtrar por:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="submitted">Enviado a Revisión</option>
              <option value="under_review">En Control de Calidad</option>
              <option value="changes_requested">Cambios Solicitados</option>
              <option value="approved">Aprobado</option>
              <option value="in_distribution">En Distribución</option>
              <option value="distributed">Entregado a Tiendas</option>
              <option value="published">Publicado / En Vivo</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>
        )}
      </div>

      {/* Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredReleases.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Disc className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No se encontraron lanzamientos</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {isQcQueueOnly
                ? '¡Genial! La cola de revisión técnica está al día. No hay canciones pendientes por revisar.'
                : 'Intenta ajustar los filtros de búsqueda o crea un nuevo lanzamiento.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Lanzamiento & Artista</th>
                  <th className="py-3 px-4">Formato / Género</th>
                  <th className="py-3 px-4">Fecha Salida</th>
                  <th className="py-3 px-4">UPC / Sello</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReleases.map((release) => (
                  <tr key={release.id} className="hover:bg-slate-50/70 transition group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={release.coverUrl}
                          alt={release.title}
                          className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0 shadow-sm"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate">{release.title}</p>
                          <p className="text-slate-500 text-[11px] truncate">{release.mainArtist}</p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {release.tracks?.length || 1} pista(s)
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px] bg-slate-100 px-2 py-0.5 rounded mr-1">
                        {release.releaseType}
                      </span>
                      <p className="text-slate-500 mt-1">{release.genre}</p>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{release.releaseDate}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      <p>{release.upc || 'Sin UPC'}</p>
                      <p className="text-slate-400 font-sans text-[10px] truncate max-w-[130px]">
                        {release.label || 'Independiente'}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <ReleaseStatusBadge status={release.status} size="sm" />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Admin QC Inspector Button */}
                        {(userRole === 'admin' || userRole === 'super_admin') && (
                          <button
                            onClick={() => onOpenReview(release)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition shadow-sm"
                            title="Abrir inspector de Control de Calidad"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Revisar (QC)</span>
                          </button>
                        )}

                        {/* Artist: ALWAYS has access to view release and distribution details assigned by the super admin */}
                        {userRole === 'artist' && (
                          <button
                            onClick={() => onOpenReview(release)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition border border-blue-200 shadow-sm"
                            title="Ver ficha y detalles de distribución asignados por el Super Admin"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Ficha & Distribución</span>
                          </button>
                        )}

                        {/* If user is artist and it's draft or changes requested */}
                        {userRole === 'artist' && (release.status === 'draft' || release.status === 'changes_requested') && (
                          <>
                            <button
                              onClick={() => onEditRelease(release)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                              title="Editar borrador"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onSubmitRelease(release.id)}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg text-xs flex items-center gap-1 transition shadow-sm"
                              title="Enviar a Revisión de Administrador"
                            >
                              <Send className="w-3 h-3" /> Enviar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
