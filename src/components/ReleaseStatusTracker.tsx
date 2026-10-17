import React from 'react';
import { ReleaseStatus } from '../types.js';
import { Check, Clock, Radio, Sparkles, AlertCircle, XCircle } from 'lucide-react';

interface Props {
  status: ReleaseStatus;
  rejectionReason?: string;
  changeRequestItems?: string[];
}

export const ReleaseStatusTracker: React.FC<Props> = ({ status, rejectionReason, changeRequestItems }) => {
  const steps = [
    { key: 'draft', label: 'Borrador' },
    { key: 'submitted', label: 'Enviado' },
    { key: 'under_review', label: 'En Revisión (QC)' },
    { key: 'approved', label: 'Aprobado' },
    { key: 'in_distribution', label: 'En Distribución' },
    { key: 'published', label: 'En Vivo' },
  ];

  const statusOrder: Record<ReleaseStatus, number> = {
    draft: 0,
    submitted: 1,
    under_review: 2,
    changes_requested: 2,
    approved: 3,
    scheduled: 3,
    in_distribution: 4,
    distributed: 4,
    published: 5,
    rejected: -1,
    takedown: -2,
  };

  const currentStepIdx = statusOrder[status];
  const isRejected = status === 'rejected';
  const isChangesRequested = status === 'changes_requested';

  return (
    <div id="release-status-tracker" className="w-full py-3">
      {/* Warning/Alert if changes requested */}
      {isChangesRequested && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">El Administrador ha solicitado correcciones antes de distribuir:</p>
            {changeRequestItems && changeRequestItems.length > 0 ? (
              <ul className="list-disc list-inside space-y-0.5 text-rose-800 text-xs">
                {changeRequestItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-rose-700">Por favor revisa y actualiza los metadatos o archivos indicados.</p>
            )}
          </div>
        </div>
      )}

      {/* Warning/Alert if rejected */}
      {isRejected && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-900 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Lanzamiento rechazado por Control de Calidad</p>
            <p className="text-xs text-red-700 mt-0.5">Motivo: {rejectionReason || 'No cumple con las pautas de distribución digital.'}</p>
          </div>
        </div>
      )}

      {/* Horizontal Step Bar */}
      {!isRejected && (
        <div className="relative">
          <div className="hidden sm:flex items-center justify-between">
            {steps.map((step, idx) => {
              const isCompleted = currentStepIdx > idx || (currentStepIdx === 5 && idx === 5);
              const isCurrent = currentStepIdx === idx && !isCompleted;

              return (
                <div key={step.key} className="flex-1 flex flex-col items-center relative">
                  {/* Connector Line */}
                  {idx < steps.length - 1 && (
                    <div
                      className={`absolute top-4 left-1/2 w-full h-0.5 transition-colors ${
                        currentStepIdx > idx ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    />
                  )}

                  {/* Node Circle */}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      isCompleted
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : isCurrent
                        ? 'bg-white border-2 border-blue-600 text-blue-600 ring-4 ring-blue-50 shadow-sm animate-pulse'
                        : 'bg-slate-100 border border-slate-300 text-slate-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : isCurrent ? (
                      <Clock className="w-4 h-4 text-blue-600" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Step Label */}
                  <span
                    className={`mt-2 text-xs font-medium text-center ${
                      isCompleted || isCurrent ? 'text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Mobile indicator */}
          <div className="sm:hidden flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-700">Estado de distribución:</span>
            <span className="font-semibold text-blue-700">
              Paso {Math.max(1, currentStepIdx + 1)} de 6 — {steps[Math.max(0, currentStepIdx)]?.label || 'Procesando'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
