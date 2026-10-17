import React, { useRef } from 'react';
import { PayoutInvoice } from '../types.js';
import {
  X,
  Printer,
  Download,
  CheckCircle,
  Building,
  CreditCard,
  ShieldCheck,
  Copy,
  ExternalLink,
  Sparkles,
  FileCheck,
} from 'lucide-react';

interface Props {
  invoice: PayoutInvoice;
  onClose: () => void;
}

export const InvoiceModal: React.FC<Props> = ({ invoice, onClose }) => {
  const [copiedHash, setCopiedHash] = React.useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyHash = () => {
    if (invoice.verificationHash) {
      navigator.clipboard.writeText(invoice.verificationHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 3000);
    }
  };

  const formattedDate = new Date(invoice.issueDate).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn print:p-0 print:bg-white">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 print:border-none print:shadow-none print:my-0 print:rounded-none">
        {/* Modal Top Actions (Hidden when printing) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <FileCheck className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-white">Factura Oficial de Liquidación</span>
              <span className="text-[11px] text-slate-400 ml-2 font-mono">#{invoice.invoiceNumber}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
              title="Imprimir o Guardar como PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div ref={printAreaRef} className="p-8 sm:p-10 space-y-8 bg-white text-slate-800 font-sans print:p-6">
          {/* Header with Dual Logo & Brand identity */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b-2 border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                S
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-tight text-slate-900">SONORA</span>
                  <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                    CADEL PRO NETWORK
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500 tracking-wide uppercase">
                  Digital Music & Video Distribution Platform
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                COMPROBANTE OFICIAL DE DEPÓSITO
              </span>
              <p className="text-xl font-black font-mono text-slate-900">{invoice.invoiceNumber}</p>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mt-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                PAGADO / TRANSFERRED
              </span>
            </div>
          </div>

          {/* Issuer & Beneficiary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80">
            {/* Issuer Information */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                EMISOR / DISTRIBUIDORA
              </span>
              <p className="text-sm font-bold text-slate-900">{invoice.platformName}</p>
              <p className="text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Tax ID / NIF:</span> {invoice.platformTaxId}
              </p>
              <p className="text-xs text-slate-600">{invoice.platformAddress}</p>
              <p className="text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Contacto:</span> {invoice.platformEmail}
              </p>
            </div>

            {/* Beneficiary Information */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                BENEFICIARIO / ARTISTA O SELLO
              </span>
              <p className="text-sm font-bold text-slate-900">{invoice.beneficiaryName}</p>
              {invoice.beneficiaryStageName && invoice.beneficiaryStageName !== invoice.beneficiaryName && (
                <p className="text-xs text-emerald-700 font-semibold">
                  Nombre Artístico: {invoice.beneficiaryStageName}
                </p>
              )}
              <p className="text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Email:</span> {invoice.beneficiaryEmail}
              </p>
              <div className="pt-1 text-xs text-slate-700 font-medium">
                <span className="text-slate-500">Destino de Pago:</span>{' '}
                {invoice.paymentMethod === 'bank' ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                    🏦 {invoice.paymentDetails.bankName || 'Banco'} ({invoice.paymentDetails.accountNumber || invoice.paymentDetails.iban || 'Cuenta'})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-blue-700">
                    🅿️ PayPal ({invoice.paymentDetails.paypalEmail})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Dates & Reference Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 px-4 bg-white rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Fecha de Emisión</span>
              <span className="font-semibold text-slate-800">{formattedDate}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Período Liquidado</span>
              <span className="font-semibold text-slate-800">{invoice.period}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Método Utilizado</span>
              <span className="font-semibold text-slate-800 uppercase">
                {invoice.paymentMethod === 'bank' ? 'Transferencia Bancaria' : 'PayPal'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Ref. Transacción</span>
              <span className="font-mono font-semibold text-slate-800 text-[11px]">{invoice.transactionRef}</span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Descripción del Concepto</th>
                  <th className="py-3 px-4 text-center">Período</th>
                  <th className="py-3 px-4 text-right">Comisión</th>
                  <th className="py-3 px-4 text-right">Monto Bruto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-4 px-4">
                    <p className="font-bold text-slate-900">
                      Liquidación de Regalías por Streaming & Video Digital
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Ingresos netos por reproducciones acumuladas en Spotify, Apple Music, YouTube Music, Vevo, Cadel Pro Network, TikTok y demás tiendas conectadas.
                    </p>
                  </td>
                  <td className="py-4 px-4 text-center text-slate-600 font-medium">
                    {invoice.period}
                  </td>
                  <td className="py-4 px-4 text-right text-emerald-600 font-semibold">
                    $0.00 (0%)
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-slate-900">
                    ${Number(invoice.grossAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {invoice.currency || 'USD'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Financial Summary */}
            <div className="bg-slate-50/90 p-5 border-t border-slate-200 flex flex-col items-end space-y-1.5">
              <div className="flex justify-between w-64 text-xs text-slate-600">
                <span>Subtotal Bruto:</span>
                <span className="font-semibold text-slate-800">
                  ${Number(invoice.grossAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {invoice.currency || 'USD'}
                </span>
              </div>
              <div className="flex justify-between w-64 text-xs text-slate-600">
                <span>Retención / Tarifa de Plataforma:</span>
                <span className="font-semibold text-emerald-600">
                  -$0.00 (Asumido por Sonora)
                </span>
              </div>
              <div className="flex justify-between w-64 text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>TOTAL DEPOSITADO:</span>
                <span className="text-emerald-700 text-base">
                  ${Number(invoice.netAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {invoice.currency || 'USD'}
                </span>
              </div>
            </div>
          </div>

          {/* Official Seal & Verification Hash */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[11px] font-bold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Certificación Criptográfica de Depósito</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 max-w-xs truncate">
                  {invoice.verificationHash}
                </code>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="p-1 hover:bg-slate-100 text-slate-500 rounded transition print:hidden"
                  title="Copiar hash de verificación"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              {copiedHash && (
                <span className="text-[10px] text-emerald-600 font-semibold block">¡Hash copiado al portapapeles!</span>
              )}
            </div>

            {/* Platform Official Stamp */}
            <div className="px-4 py-2 border-2 border-dashed border-emerald-600/40 rounded-xl bg-emerald-50/50 text-center transform -rotate-1">
              <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-800 font-bold block">
                SONORA DIGITAL & CADEL PRO
              </span>
              <span className="text-xs font-black text-emerald-900 block tracking-tight">
                AUTORIZADO & PAGADO
              </span>
              <span className="text-[9px] text-emerald-700 block font-mono">
                {formattedDate} • {invoice.transactionRef}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions (Hidden when printing) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <p className="text-[11px] text-slate-500">
            Este comprobante y factura oficial tiene plena validez contable para declaración de ingresos por derechos de autor.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Descargar / Imprimir
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
