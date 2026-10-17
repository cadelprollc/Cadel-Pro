import React from 'react';
import { NotificationItem } from '../types.js';
import { X, Mail, CheckCircle, ShieldCheck } from 'lucide-react';

interface Props {
  notification: NotificationItem | null;
  onClose: () => void;
}

export const EmailPreviewModal: React.FC<Props> = ({ notification, onClose }) => {
  if (!notification) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div
        id="email-preview-modal"
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Email Client Header Simulator */}
        <div className="bg-slate-800 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <Mail className="w-4 h-4 text-blue-400" />
            <span className="font-semibold">Simulador de Correo Transaccional</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Email Headers */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs space-y-1.5 font-mono">
          <div className="flex">
            <span className="w-16 text-slate-400">De:</span>
            <span className="text-slate-700 font-semibold">Sonora Digital &lt;noreply@sonoradistro.com&gt;</span>
          </div>
          <div className="flex">
            <span className="w-16 text-slate-400">Para:</span>
            <span className="text-slate-700">cadelpro33@gmail.com</span>
          </div>
          <div className="flex">
            <span className="w-16 text-slate-400">Asunto:</span>
            <span className="text-slate-900 font-bold">{notification.emailSubject || notification.title}</span>
          </div>
          <div className="flex">
            <span className="w-16 text-slate-400">Fecha:</span>
            <span className="text-slate-500">{new Date(notification.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Email HTML Body Render */}
        <div className="p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <span className="text-base font-black tracking-widest text-slate-900">SONORA</span>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono">
              Notificación Segura
            </span>
          </div>

          <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
            <h3 className="text-sm font-bold text-slate-900">{notification.title}</h3>
            <p>{notification.emailBodyPreview || notification.message}</p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-600 block">Detalles del mensaje:</span>
              <p className="text-slate-800">{notification.message}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-center">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
            >
              Cerrar Vista Previa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
