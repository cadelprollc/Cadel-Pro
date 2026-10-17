import React, { useState, useEffect } from 'react';
import { DirectMessage, User, Release } from '../types.js';
import { api } from '../lib/api.js';
import {
  MessageSquare,
  Send,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Radio,
  User as UserIcon,
  Disc,
  ArrowRight,
  Sparkles,
  Inbox,
  SendHorizontal,
  Mail,
  Reply,
} from 'lucide-react';

interface Props {
  currentUser: User | null;
  usersList?: User[];
  releases?: Release[];
  initialRecipientId?: string;
  initialRecipientName?: string;
  initialReleaseId?: string;
  initialReleaseTitle?: string;
}

export const MessagesView: React.FC<Props> = ({
  currentUser,
  usersList = [],
  releases = [],
  initialRecipientId,
  initialRecipientName,
  initialReleaseId,
  initialReleaseTitle,
}) => {
  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';

  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<DirectMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'urgent' | 'announcements'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Composer Modal State
  const [isComposerOpen, setIsComposerOpen] = useState(Boolean(initialRecipientId));
  const [recipientId, setRecipientId] = useState(initialRecipientId || 'all');
  const [subject, setSubject] = useState(
    initialReleaseTitle ? `Actualización sobre ${initialReleaseTitle}` : ''
  );
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [relatedReleaseId, setRelatedReleaseId] = useState(initialReleaseId || '');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccessMsg, setSentSuccessMsg] = useState<string | null>(null);

  // Reply state
  const [replyBody, setReplyBody] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Load messages
  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const res = await api.getMessages();
      const list: DirectMessage[] = res.messages || [];
      setMessages(list);
      if (list.length > 0 && !selectedMessage) {
        setSelectedMessage(list[0]);
      }
    } catch (err) {
      console.error('Error fetching messages', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [currentUser]);

  useEffect(() => {
    if (initialRecipientId) {
      setRecipientId(initialRecipientId);
      setIsComposerOpen(true);
    }
    if (initialReleaseId) {
      setRelatedReleaseId(initialReleaseId);
    }
    if (initialReleaseTitle && !subject) {
      setSubject(`Consulta sobre el lanzamiento: ${initialReleaseTitle}`);
    }
  }, [initialRecipientId, initialReleaseId, initialReleaseTitle]);

  const artistsList = usersList.filter((u) => u.role === 'artist');

  const handleSelectMessage = async (msg: DirectMessage) => {
    setSelectedMessage(msg);
    if (!msg.read && msg.recipientId === currentUser?.id) {
      try {
        await api.markMessageRead(msg.id);
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, read: true } : m))
        );
      } catch (err) {
        console.error('Failed to mark message read', err);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      alert('Por favor completa el asunto y el mensaje');
      return;
    }

    let recName = 'Todos los Artistas';
    if (recipientId !== 'all') {
      const found = usersList.find((u) => u.id === recipientId);
      recName = found?.name || 'Artista';
    }

    const rel = releases.find((r) => r.id === relatedReleaseId);

    setIsSending(true);
    try {
      await api.sendMessage({
        recipientId,
        recipientName: recName,
        subject,
        body,
        priority,
        relatedReleaseId: rel?.id,
        relatedReleaseTitle: rel?.title,
      });

      setSentSuccessMsg('¡Mensaje enviado exitosamente!');
      setIsComposerOpen(false);
      setSubject('');
      setBody('');
      await loadMessages();

      setTimeout(() => setSentSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Error al enviar mensaje');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyBody.trim()) return;

    setIsSendingReply(true);
    try {
      const recipient =
        selectedMessage.senderId === currentUser?.id
          ? selectedMessage.recipientId
          : selectedMessage.senderId;

      const recipientName =
        selectedMessage.senderId === currentUser?.id
          ? selectedMessage.recipientName
          : selectedMessage.senderName;

      await api.sendMessage({
        recipientId: recipient,
        recipientName,
        subject: `Re: ${selectedMessage.subject}`,
        body: replyBody,
        priority: 'normal',
        relatedReleaseId: selectedMessage.relatedReleaseId,
        relatedReleaseTitle: selectedMessage.relatedReleaseTitle,
      });

      setReplyBody('');
      setSentSuccessMsg('¡Respuesta enviada!');
      await loadMessages();

      setTimeout(() => setSentSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error al enviar respuesta');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Filter messages
  const filteredMessages = messages.filter((m) => {
    if (activeFilter === 'unread' && m.read) return false;
    if (activeFilter === 'urgent' && m.priority !== 'urgent') return false;
    if (activeFilter === 'announcements' && m.recipientId !== 'all') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const textBody = (m.body || m.content || '').toLowerCase();
      const matchSub = m.subject.toLowerCase().includes(q);
      const matchBody = textBody.includes(q);
      const matchSender = m.senderName.toLowerCase().includes(q);
      const matchRec = m.recipientName.toLowerCase().includes(q);
      if (!matchSub && !matchBody && !matchSender && !matchRec) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Centro de Mensajes & Comunicados Oficiales
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSuperAdmin
              ? 'Canal directo para notificar correcciones técnicas de ISRC/UPC, aprobaciones o novedades de la distribuidora.'
              : 'Comunícate directamente con el equipo de control de calidad y administración de Sonora.'}
          </p>
        </div>

        <button
          onClick={() => setIsComposerOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Redactar Mensaje
        </button>
      </div>

      {sentSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 flex items-center gap-2 font-semibold shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{sentSuccessMsg}</span>
        </div>
      )}

      {/* Main Mailbox Interface */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[560px]">
        {/* Left Column: Messages List (5 cols) */}
        <div className="md:col-span-5 border-r border-slate-200 flex flex-col">
          {/* Filters and search */}
          <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por asunto, artista o texto..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-medium">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                  activeFilter === 'all'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Todos ({messages.length})
              </button>
              <button
                onClick={() => setActiveFilter('unread')}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                  activeFilter === 'unread'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                No leídos
              </button>
              <button
                onClick={() => setActiveFilter('urgent')}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                  activeFilter === 'urgent'
                    ? 'bg-rose-600 text-white font-bold'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Urgentes
              </button>
              <button
                onClick={() => setActiveFilter('announcements')}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                  activeFilter === 'announcements'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Comunicados
              </button>
            </div>
          </div>

          {/* Messages Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[620px]">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Inbox className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-medium">No hay mensajes en esta bandeja.</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                const isUnread = !msg.read && msg.recipientId === currentUser?.id;

                return (
                  <button
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`w-full text-left p-4 transition flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-blue-50/70 border-l-4 border-blue-600'
                        : isUnread
                        ? 'bg-white font-semibold hover:bg-slate-50 border-l-4 border-amber-500'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {msg.senderName}
                        </span>
                        {msg.recipientId === 'all' && (
                          <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded shrink-0">
                            GLOBAL
                          </span>
                        )}
                        {msg.priority === 'urgent' && (
                          <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded shrink-0">
                            URGENTE
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {new Date(msg.createdAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-800 line-clamp-1">
                      {msg.subject}
                    </p>

                    <p className="text-[11px] text-slate-500 line-clamp-1 leading-relaxed">
                      {msg.body}
                    </p>

                    {msg.relatedReleaseTitle && (
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded self-start flex items-center gap-1 font-medium truncate max-w-full">
                        <Disc className="w-2.5 h-2.5 shrink-0" />
                        {msg.relatedReleaseTitle}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Message Reader Pane (7 cols) */}
        <div className="md:col-span-7 flex flex-col bg-white">
          {selectedMessage ? (
            <div className="flex-1 flex flex-col h-full">
              {/* Message Header */}
              <div className="p-6 border-b border-slate-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        selectedMessage.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : selectedMessage.priority === 'important'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Prioridad {selectedMessage.priority}
                    </span>

                    {selectedMessage.recipientId === 'all' && (
                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                        📢 Comunicado para Todos los Artistas
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(selectedMessage.createdAt).toLocaleString('es-ES', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {selectedMessage.subject}
                </h3>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                      {selectedMessage.senderName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 leading-tight">
                        {selectedMessage.senderName}{' '}
                        <span className="text-slate-400 font-normal">
                          ({selectedMessage.senderRole})
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Para: <span className="font-medium text-slate-700">{selectedMessage.recipientName}</span>
                      </p>
                    </div>
                  </div>

                  {selectedMessage.relatedReleaseTitle && (
                    <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Lanzamiento Referenciado</span>
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Disc className="w-3.5 h-3.5 text-blue-600" />
                        {selectedMessage.relatedReleaseTitle}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Body Content */}
              <div className="flex-1 p-6 overflow-y-auto text-xs sm:text-sm text-slate-800 leading-relaxed space-y-4 whitespace-pre-line bg-slate-50/20">
                {selectedMessage.body}
              </div>

              {/* Quick Reply Box */}
              <div className="p-4 border-t border-slate-200 bg-white space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Reply className="w-3.5 h-3.5 text-blue-600" />
                  Responder a {selectedMessage.senderName}
                </div>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Escribe tu respuesta aquí..."
                    className="flex-1 p-3 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={isSendingReply || !replyBody.trim()}
                    className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition disabled:opacity-50 shrink-0"
                  >
                    <SendHorizontal className="w-4 h-4" />
                    <span>Enviar</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 space-y-3">
              <Mail className="w-12 h-12 text-slate-200" />
              <p className="text-xs font-medium">Selecciona un mensaje para leer su contenido completo</p>
            </div>
          )}
        </div>
      </div>

      {/* COMPOSE MESSAGE MODAL */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-fadeIn my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold">
                  Nuevo Mensaje Oficial
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-600" />
                  Redactar Comunicación
                </h3>
                <p className="text-xs text-slate-500">
                  Envía instrucciones, aprobaciones o avisos directos con notificación en tiempo real.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4 text-xs">
              {/* Recipient */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Destinatario *
                </label>
                {isSuperAdmin ? (
                  <select
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                  >
                    <option value="all">📢 TODOS LOS ARTISTAS (Comunicado General Masivo)</option>
                    {artistsList.map((artist) => (
                      <option key={artist.id} value={artist.id}>
                        {artist.name} ({artist.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value="Equipo de Distribución & Super Admin de Sonora"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-slate-700 font-medium"
                  />
                )}
              </div>

              {/* Release link & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Lanzamiento Asociado (Opcional)
                  </label>
                  <select
                    value={relatedReleaseId}
                    onChange={(e) => setRelatedReleaseId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Ninguno / Consulta General</option>
                    {releases.map((rel) => (
                      <option key={rel.id} value={rel.id}>
                        {rel.title} ({rel.mainArtist})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nivel de Prioridad
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="normal">Normal</option>
                    <option value="important">Importante</option>
                    <option value="urgent">Urgente (Notificación inmediata)</option>
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Asunto del Mensaje *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ej. Revisión técnica requerida para ISRC / Asignación de regalías"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cuerpo del Mensaje *
                </label>
                <textarea
                  rows={5}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Escribe los detalles, requerimientos o mensaje oficial para el artista..."
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSending ? 'Enviando...' : 'Enviar Mensaje'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
