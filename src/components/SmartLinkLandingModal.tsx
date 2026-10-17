import React, { useState } from 'react';
import {
  X,
  Play,
  Pause,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Music2,
  Sparkles,
  QrCode,
  Heart,
  Headphones,
  Radio,
  Tv,
} from 'lucide-react';
import { SmartLink, SmartLinkPlatform } from '../types.js';
import { api } from '../lib/api.js';

interface Props {
  smartlink: SmartLink;
  onClose: () => void;
}

export const SmartLinkLandingModal: React.FC<Props> = ({ smartlink, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [presaveSuccess, setPresaveSuccess] = useState(false);
  const [isSubmittingPresave, setIsSubmittingPresave] = useState(false);

  const fullUrl = `https://sonora.link/${smartlink.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePlay = () => {
    if (!smartlink.audioPreviewUrl) return;

    if (!audioEl) {
      const audio = new Audio(smartlink.audioPreviewUrl);
      audio.onended = () => setIsPlaying(false);
      audio.play().catch(() => {});
      setAudioEl(audio);
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioEl.pause();
        setIsPlaying(false);
      } else {
        audioEl.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const handlePlatformClick = async (platform: SmartLinkPlatform) => {
    // Record analytics click
    api.clickSmartLink(smartlink.id).catch(() => {});

    // Open target streaming URL
    window.open(platform.url, '_blank', 'noopener,noreferrer');
  };

  const handlePreSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsSubmittingPresave(true);
    try {
      await api.presaveSmartLink(smartlink.id, emailInput.trim());
      setPresaveSuccess(true);
      setEmailInput('');
    } catch {
      setPresaveSuccess(true);
    } finally {
      setIsSubmittingPresave(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      {/* Container simulating a mobile landing page screen */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60 flex flex-col my-auto">
        {/* Blurred background cover */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 filter blur-2xl pointer-events-none scale-125"
          style={{ backgroundImage: `url(${smartlink.coverUrl})` }}
        />

        {/* Top bar controls */}
        <div className="relative z-10 p-4 flex items-center justify-between border-b border-white/10 bg-slate-950/40 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-slate-400">sonora.link/{smartlink.slug}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowQr(!showQr)}
              title="Código QR"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopy}
              title="Copiar Enlace"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition flex items-center gap-1 text-[11px] font-bold"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* QR Code view toggle */}
        {showQr && (
          <div className="relative z-20 p-6 bg-slate-950/95 flex flex-col items-center justify-center text-center space-y-3 border-b border-white/10">
            <div className="w-40 h-40 bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  fullUrl
                )}`}
                alt="QR Code"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Escanea para abrir el SmartLink en cualquier smartphone
            </p>
            <button
              onClick={() => setShowQr(false)}
              className="text-xs text-indigo-400 hover:underline font-bold"
            >
              Volver al enlace
            </button>
          </div>
        )}

        {/* Content body */}
        <div className="relative z-10 p-6 flex flex-col items-center text-center space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Cover Art */}
          <div className="relative group w-52 h-52 sm:w-60 sm:h-60 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10">
            <img
              src={smartlink.coverUrl}
              alt={smartlink.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />

            {/* Audio preview button overlay */}
            {smartlink.audioPreviewUrl && (
              <button
                onClick={handleTogglePlay}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-90 group-hover:opacity-100 transition"
              >
                <div className="w-14 h-14 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg border border-white/20 hover:scale-110 transition">
                  {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
                </div>
              </button>
            )}

            {smartlink.isPreSave && (
              <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] tracking-wide uppercase shadow">
                Pre-Save
              </span>
            )}
          </div>

          {/* Title & Artist */}
          <div className="space-y-1">
            <h2 className="text-xl font-black text-white tracking-tight">{smartlink.title}</h2>
            <p className="text-sm font-semibold text-slate-300">{smartlink.artistName}</p>
            {smartlink.description && (
              <p className="text-xs text-slate-400 max-w-xs mx-auto pt-1">{smartlink.description}</p>
            )}
          </div>

          {/* Pre-Save Fan Signup if enabled */}
          {smartlink.isPreSave && (
            <div className="w-full p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-2.5 text-left">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-white">Pre-Guarda en tu biblioteca</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Sé el primero en escuchar cuando se estrene el {smartlink.releaseDate || 'próximamente'}.
              </p>

              {presaveSuccess ? (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
                  ✅ ¡Gracias! Se ha guardado tu pre-save exitosamente.
                </div>
              ) : (
                <form onSubmit={handlePreSaveSubmit} className="flex gap-1.5">
                  <input
                    type="email"
                    required
                    placeholder="Tu correo electrónico..."
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="flex-1 p-2 bg-black/40 border border-white/20 rounded-xl text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingPresave}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shrink-0"
                  >
                    Guardar
                  </button>
                </form>
              )}
            </div>
          )}

          {/* DSP Platform Buttons */}
          <div className="w-full space-y-2 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block text-left px-1">
              Elige tu servicio de música:
            </span>

            {smartlink.platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handlePlatformClick(platform)}
                className="w-full p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-between transition group hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold text-xs text-indigo-300 group-hover:bg-white/20 transition">
                    <Music2 className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-xs text-white block">{platform.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 group-hover:bg-indigo-500 text-white text-xs font-bold shadow transition">
                  <span>{smartlink.isPreSave ? 'Pre-Guardar' : platform.actionText}</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                </div>
              </button>
            ))}
          </div>

          {/* Share & Copy URL footer */}
          <div className="w-full pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 hover:text-white transition font-medium"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? '¡Copiado!' : 'Compartir enlace'}</span>
            </button>
            <span className="text-[10px] text-slate-500">Impulsado por Sonora Distro</span>
          </div>
        </div>
      </div>
    </div>
  );
};
