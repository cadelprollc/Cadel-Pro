import React from 'react';
import { ReleaseStatus } from '../types.js';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Radio,
  Send,
  Sparkles,
  FileEdit,
  Globe,
  Ban,
} from 'lucide-react';

interface Props {
  status: ReleaseStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const ReleaseStatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const configMap: Record<
    ReleaseStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    draft: {
      label: 'Borrador',
      bg: 'bg-stone-100 dark:bg-stone-800',
      text: 'text-stone-700 dark:text-stone-300',
      border: 'border-stone-300 dark:border-stone-700',
      icon: FileEdit,
    },
    submitted: {
      label: 'Enviado a Revisión',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
      icon: Send,
    },
    under_review: {
      label: 'En Control de Calidad (QC)',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-700 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800',
      icon: Clock,
    },
    changes_requested: {
      label: 'Cambios Solicitados',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-800',
      icon: AlertCircle,
    },
    approved: {
      label: 'Aprobado',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: CheckCircle2,
    },
    scheduled: {
      label: 'Programado',
      bg: 'bg-sky-50 dark:bg-sky-950/40',
      text: 'text-sky-700 dark:text-sky-400',
      border: 'border-sky-200 dark:border-sky-800',
      icon: Clock,
    },
    in_distribution: {
      label: 'En Distribución',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
      icon: Radio,
    },
    distributed: {
      label: 'Entregado a Tiendas',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-700 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-800',
      icon: Globe,
    },
    published: {
      label: 'Publicado / En Vivo',
      bg: 'bg-teal-50 dark:bg-teal-950/40',
      text: 'text-teal-700 dark:text-teal-400',
      border: 'border-teal-200 dark:border-teal-800',
      icon: Sparkles,
    },
    rejected: {
      label: 'Rechazado',
      bg: 'bg-red-50 dark:bg-red-950/40',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-200 dark:border-red-800',
      icon: XCircle,
    },
    takedown: {
      label: 'Retirado (Takedown)',
      bg: 'bg-zinc-100 dark:bg-zinc-800',
      text: 'text-zinc-600 dark:text-zinc-400',
      border: 'border-zinc-300 dark:border-zinc-700',
      icon: Ban,
    },
  };

  const cfg = configMap[status] || configMap.draft;
  const Icon = cfg.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-medium px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      id={`badge-status-${status}`}
      className={`inline-flex items-center rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClasses} whitespace-nowrap`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{cfg.label}</span>
    </span>
  );
};
