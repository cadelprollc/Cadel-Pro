import { Router, Request, Response } from 'express';
import { getDb, saveDb } from '../db.js';
import { authenticate, requireRole } from './auth.js';
import {
  ManualRoyaltyTransaction,
  RoyaltySummary,
  PayoutRequest,
  PayoutInvoice,
  ManualStreamReport,
  PlatformStreamEntry,
  WalletLedgerEntry,
  SavedPaymentMethod,
  ArtistWalletSummary,
  PayoutStatus,
} from '../../src/types.js';

export const royaltiesRouter = Router();

// Helper to ensure an artist has a royalty/wallet record initialized
function ensureArtistWallet(artistId: string, defaultCurrency: string = 'USD'): RoyaltySummary {
  const db = getDb();
  if (!db.royalties[artistId]) {
    db.royalties[artistId] = {
      totalEarned: 150,
      pendingBalance: 150,
      availableBalance: 150,
      pendingWithdrawals: 0,
      paidOut: 0,
      currency: defaultCurrency,
      totalStreams: 12500,
      monthlyStats: [],
      dspBreakdown: [
        { name: 'Spotify', percentage: 65, amount: 97.5 },
        { name: 'Apple Music', percentage: 35, amount: 52.5 },
      ],
      topTracks: [],
    };
  }
  const r = db.royalties[artistId];
  if (r.availableBalance === undefined) {
    r.availableBalance = r.pendingBalance ?? 150;
  }
  if (r.pendingWithdrawals === undefined) {
    r.pendingWithdrawals = 0;
  }
  r.pendingBalance = r.availableBalance;
  return r;
}

// GET /api/royalties/balance (Current user's balance and wallet status)
royaltiesRouter.get('/balance', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  const royalty = ensureArtistWallet(user.id);

  res.json({
    balance: {
      availableBalance: royalty.availableBalance ?? 0,
      pendingWithdrawals: royalty.pendingWithdrawals ?? 0,
      paidOut: royalty.paidOut ?? 0,
      totalEarned: royalty.totalEarned ?? 0,
      currency: royalty.currency || 'USD',
      pendingBalance: royalty.availableBalance ?? 0,
    },
    royalty,
  });
});

// POST /api/royalties/recharge - Recharge wallet balance for promotions and marketing store
royaltiesRouter.post('/recharge', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  const { amount = 100, currency = 'USD' } = req.body;
  const topupAmount = Math.max(10, Math.min(1000, Number(amount) || 100));

  const wallet = ensureArtistWallet(user.id, currency);
  const balanceBefore = Number((wallet.availableBalance ?? 0).toFixed(2));
  const balanceAfter = Number((balanceBefore + topupAmount).toFixed(2));

  wallet.availableBalance = balanceAfter;
  wallet.pendingBalance = balanceAfter;
  wallet.totalEarned = Number(((wallet.totalEarned || 0) + topupAmount).toFixed(2));

  // Ledger entry
  db.walletLedger = db.walletLedger || [];
  const txSeq = db.walletLedger.length + 1;
  const transactionNumber = `MOV-${new Date().getFullYear()}-${String(txSeq).padStart(4, '0')}`;
  const now = new Date().toISOString();

  const ledgerEntry: WalletLedgerEntry = {
    id: 'tx-wallet-topup-' + Date.now(),
    transactionNumber,
    userId: user.id,
    userName: user.stageName || user.name,
    userRole: user.role,
    type: 'deposit',
    typeLabel: 'Recarga de Saldo Promocional',
    description: `Recarga de fondos para campañas y tienda de productos ($${topupAmount.toFixed(2)} ${currency})`,
    amount: topupAmount,
    balanceBefore,
    balanceAfter,
    currency,
    status: 'completed',
    performedByUserId: user.id,
    performedByName: user.name,
    performedByRole: user.role,
    createdAt: now,
  };
  db.walletLedger.unshift(ledgerEntry);

  saveDb();

  res.json({
    success: true,
    balance: {
      availableBalance: balanceAfter,
      balanceBefore,
      added: topupAmount,
      currency,
    },
    ledgerEntry,
    message: `¡Recarga exitosa! Se han añadido $${topupAmount.toFixed(2)} ${currency} a tu saldo disponible.`,
  });
});

// GET /api/royalties/ledger (Full financial ledger of movements)
royaltiesRouter.get('/ledger', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  db.walletLedger = db.walletLedger || [];

  const { artistId, type, search } = req.query;

  let entries: WalletLedgerEntry[] = [];

  if (user.role === 'super_admin' || user.role === 'admin') {
    entries = [...db.walletLedger];
    if (artistId && typeof artistId === 'string') {
      entries = entries.filter((e) => e.userId === artistId);
    }
  } else {
    // Artists can only view their own ledger
    entries = db.walletLedger.filter((e) => e.userId === user.id);
  }

  if (type && typeof type === 'string' && type !== 'all') {
    entries = entries.filter((e) => e.type === type);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    entries = entries.filter(
      (e) =>
        e.transactionNumber.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.userName.toLowerCase().includes(q)
    );
  }

  // Sort newest first
  entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ ledger: entries });
});

// GET /api/royalties/artists-summary (Super Admin - All artists financial summary)
royaltiesRouter.get(
  '/artists-summary',
  authenticate,
  requireRole('super_admin', 'admin'),
  (req: Request, res: Response) => {
    const db = getDb();
    db.walletLedger = db.walletLedger || [];
    db.payoutRequests = db.payoutRequests || [];

    const artists = db.users.filter((u) => u.role === 'artist');

    const summaries: ArtistWalletSummary[] = artists.map((artist) => {
      const wallet = ensureArtistWallet(artist.id);
      const pendingCount = db.payoutRequests.filter(
        (p) => p.userId === artist.id && (p.status === 'pending' || p.status === 'in_review')
      ).length;

      const lastTx = db.walletLedger.find((l) => l.userId === artist.id);

      return {
        userId: artist.id,
        userName: artist.name,
        stageName: artist.stageName,
        email: artist.email,
        avatarUrl: artist.avatarUrl,
        availableBalance: wallet.availableBalance ?? 0,
        pendingWithdrawals: wallet.pendingWithdrawals ?? 0,
        paidOut: wallet.paidOut ?? 0,
        totalEarned: wallet.totalEarned ?? 0,
        currency: wallet.currency || 'USD',
        pendingRequestsCount: pendingCount,
        lastMovementAt: lastTx?.createdAt,
      };
    });

    res.json({ artists: summaries });
  }
);

// GET /api/royalties/transactions (Legacy endpoint)
royaltiesRouter.get('/transactions', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  db.manualRoyaltyTransactions = db.manualRoyaltyTransactions || [];

  let txs: ManualRoyaltyTransaction[] = [];
  if (user.role === 'super_admin' || user.role === 'admin') {
    txs = [...db.manualRoyaltyTransactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } else {
    txs = db.manualRoyaltyTransactions
      .filter((t) => t.artistId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json({ transactions: txs });
});

// POST /api/royalties/deposit (Super Admin manually credits balance to an artist)
royaltiesRouter.post(
  '/deposit',
  authenticate,
  requireRole('super_admin', 'admin'),
  (req: Request, res: Response) => {
    const adminUser = (req as any).user;
    const db = getDb();
    const {
      artistId,
      releaseId,
      trackTitle,
      amount,
      currency = 'USD',
      sourceDsp = 'Súper Admin / Abono Manual',
      period,
      type = 'deposit',
      notes,
    } = req.body;

    if (!artistId) {
      return res.status(400).json({ error: 'Debes seleccionar el artista o beneficiario.' });
    }

    const depositAmount = Number(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({ error: 'El monto a depositar debe ser un número positivo mayor a 0.' });
    }

    const targetArtist = db.users.find((u) => u.id === artistId);
    if (!targetArtist) {
      return res.status(404).json({ error: 'Usuario / Artista no encontrado en la plataforma.' });
    }

    // 1. Get or create artist wallet
    const artistRoyalty = ensureArtistWallet(artistId, currency);

    const balanceBefore = Number((artistRoyalty.availableBalance ?? 0).toFixed(2));
    const balanceAfter = Number((balanceBefore + depositAmount).toFixed(2));

    // Update balances
    artistRoyalty.availableBalance = balanceAfter;
    artistRoyalty.pendingBalance = balanceAfter;
    artistRoyalty.totalEarned = Number(((artistRoyalty.totalEarned || 0) + depositAmount).toFixed(2));

    // Update DSP Breakdown
    const dspName = sourceDsp || 'Distribución Directa';
    artistRoyalty.dspBreakdown = artistRoyalty.dspBreakdown || [];
    const existingDsp = artistRoyalty.dspBreakdown.find((d) => d.name.toLowerCase() === dspName.toLowerCase());
    if (existingDsp) {
      existingDsp.amount = Number(((existingDsp.amount || 0) + depositAmount).toFixed(2));
    } else {
      artistRoyalty.dspBreakdown.push({
        name: dspName,
        amount: depositAmount,
        percentage: 15,
      });
    }

    // Recalculate percentages
    const totalBreakdown = artistRoyalty.dspBreakdown.reduce((sum, d) => sum + (d.amount || 0), 0);
    if (totalBreakdown > 0) {
      artistRoyalty.dspBreakdown.forEach((d) => {
        d.percentage = Number((((d.amount || 0) / totalBreakdown) * 100).toFixed(1));
      });
    }

    // 2. Create Official Immutable Financial Ledger Entry
    db.walletLedger = db.walletLedger || [];
    const txSeq = db.walletLedger.length + 1;
    const transactionNumber = `MOV-${new Date().getFullYear()}-${String(txSeq).padStart(4, '0')}`;
    const ledgerId = `tx-wallet-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const newLedgerEntry: WalletLedgerEntry = {
      id: ledgerId,
      transactionNumber,
      userId: targetArtist.id,
      userName: targetArtist.stageName || targetArtist.name,
      userRole: targetArtist.role,
      type: 'deposit',
      typeLabel: 'Depósito de saldo',
      description: notes || `Depósito de saldo realizado por Súper Admin (${adminUser.name}).`,
      amount: depositAmount,
      balanceBefore,
      balanceAfter,
      currency,
      status: 'completed',
      performedByUserId: adminUser.id,
      performedByName: adminUser.name,
      performedByRole: adminUser.role,
      createdAt: new Date().toISOString(),
    };
    db.walletLedger.unshift(newLedgerEntry);

    // 3. Keep manualRoyaltyTransactions synced for backward compatibility
    let releaseTitle: string | undefined = undefined;
    if (releaseId) {
      const rel = db.releases.find((r) => r.id === releaseId);
      if (rel) releaseTitle = rel.title;
    }

    const newTx: ManualRoyaltyTransaction = {
      id: 'roy-tx-' + Date.now(),
      artistId: targetArtist.id,
      artistName: targetArtist.stageName || targetArtist.name,
      releaseId: releaseId || undefined,
      releaseTitle: releaseTitle || undefined,
      trackTitle: trackTitle || undefined,
      amount: depositAmount,
      currency,
      sourceDsp: dspName,
      period: period || `${new Date().toLocaleString('es-ES', { month: 'long' })} ${new Date().getFullYear()}`,
      type: (type as any) || 'deposit',
      notes: notes || `Acreditación manual de saldo realizada por ${adminUser.name}.`,
      recordedByAdminName: adminUser.name,
      createdAt: new Date().toISOString(),
    };
    db.manualRoyaltyTransactions = db.manualRoyaltyTransactions || [];
    db.manualRoyaltyTransactions.unshift(newTx);

    // 4. Notify Artist with in-app notice and simulated email
    db.notifications.push({
      id: 'notif-' + Date.now(),
      userId: targetArtist.id,
      title: '¡Depósito de Saldo Acreditado! 💰',
      message: `Se han depositado $${depositAmount.toFixed(2)} ${currency} en tu cuenta. Tu nuevo saldo disponible es $${balanceAfter.toFixed(2)} ${currency}.`,
      type: 'success',
      link: '/royalties',
      read: false,
      createdAt: new Date().toISOString(),
      emailSent: true,
      emailSubject: `[Sonora] Nuevo depósito de saldo: +$${depositAmount.toFixed(2)} ${currency}`,
      emailBodyPreview: `Estimado/a ${targetArtist.name}: Se ha registrado un nuevo depósito de fondos en tu saldo disponible por parte del Súper Admin. Saldo anterior: $${balanceBefore.toFixed(2)} ${currency}. Saldo actual disponible: $${balanceAfter.toFixed(2)} ${currency}.`,
    });

    // 5. Audit Log
    db.auditLogs.push({
      id: 'aud-' + Date.now(),
      timestamp: new Date().toISOString(),
      userId: adminUser.id,
      userName: adminUser.name,
      action: 'WALLET_DEPOSIT',
      entity: 'WALLET',
      entityId: ledgerId,
      details: `Súper Admin acreditó +$${depositAmount.toFixed(2)} ${currency} a ${targetArtist.name}. Saldo: $${balanceBefore.toFixed(2)} -> $${balanceAfter.toFixed(2)}`,
      ip: req.ip || '127.0.0.1',
    });

    saveDb();

    res.status(201).json({
      success: true,
      transaction: newTx,
      ledgerEntry: newLedgerEntry,
      updatedRoyalty: artistRoyalty,
      balance: {
        availableBalance: artistRoyalty.availableBalance,
        pendingWithdrawals: artistRoyalty.pendingWithdrawals,
        paidOut: artistRoyalty.paidOut,
        totalEarned: artistRoyalty.totalEarned,
        currency: artistRoyalty.currency,
      },
      message: `Saldo de $${depositAmount.toFixed(2)} ${currency} acreditado exitosamente a ${targetArtist.name}. Nuevo saldo disponible: $${balanceAfter.toFixed(2)} ${currency}.`,
    });
  }
);

// POST /api/royalties/request-payout (Artist requests withdrawal - Anti Double Spending)
royaltiesRouter.post('/request-payout', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  const {
    amount,
    currency = 'USD',
    paymentMethod, // 'bank' | 'paypal'
    bankDetails,
    paypalDetails,
    notes,
    savePaymentMethod = true,
  } = req.body;

  const withdrawAmount = Number(amount);
  if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
    return res.status(400).json({ error: 'El monto a retirar debe ser un número válido mayor a 0.' });
  }

  if (!paymentMethod || (paymentMethod !== 'bank' && paymentMethod !== 'paypal')) {
    return res.status(400).json({ error: 'Debes seleccionar un método de pago válido: Banco o PayPal.' });
  }

  // Validate details
  if (paymentMethod === 'bank') {
    if (!bankDetails || !bankDetails.bankName || !bankDetails.accountHolder || (!bankDetails.accountNumber && !bankDetails.iban)) {
      return res.status(400).json({
        error: 'Por favor completa los datos bancarios requeridos (Nombre del Banco, Titular y Número de Cuenta / IBAN).',
      });
    }
  } else if (paymentMethod === 'paypal') {
    if (!paypalDetails || !paypalDetails.paypalEmail || !paypalDetails.paypalEmail.includes('@')) {
      return res.status(400).json({
        error: 'Por favor introduce una dirección de correo electrónico válida de PayPal.',
      });
    }
  }

  // Ensure artist wallet
  const artistRoyalty = ensureArtistWallet(user.id, currency);

  // CRITICAL CHECK: Verify artist available balance
  const currentAvailable = Number((artistRoyalty.availableBalance ?? 0).toFixed(2));
  if (currentAvailable < withdrawAmount) {
    return res.status(400).json({
      error: `Saldo insuficiente. Tu saldo disponible actual es de $${currentAvailable.toFixed(2)} ${currency}. No puedes retirar más de lo que tienes disponible.`,
    });
  }

  // ANTI DOUBLE-SPENDING LOCK:
  // Reserve the requested amount immediately from availableBalance to pendingWithdrawals.
  const balanceBefore = currentAvailable;
  const balanceAfter = Number((currentAvailable - withdrawAmount).toFixed(2));

  if (balanceAfter < 0) {
    return res.status(400).json({
      error: 'La operación no puede dejar el saldo disponible en negativo.',
    });
  }

  artistRoyalty.availableBalance = balanceAfter;
  artistRoyalty.pendingBalance = balanceAfter; // Keep synced
  artistRoyalty.pendingWithdrawals = Number(((artistRoyalty.pendingWithdrawals || 0) + withdrawAmount).toFixed(2));

  // Generate Request Number (e.g. RET-2026-0012)
  db.payoutRequests = db.payoutRequests || [];
  const reqSeq = db.payoutRequests.length + 1;
  const requestNumber = `RET-${new Date().getFullYear()}-${String(reqSeq).padStart(4, '0')}`;
  const payoutId = 'payout-' + Date.now();

  const payoutRequest: PayoutRequest = {
    id: payoutId,
    requestNumber,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    artistStageName: user.stageName || user.name,
    amount: withdrawAmount,
    currency,
    paymentMethod,
    bankDetails: paymentMethod === 'bank' ? bankDetails : undefined,
    paypalDetails: paymentMethod === 'paypal' ? paypalDetails : undefined,
    status: 'pending',
    statusHistory: [
      {
        status: 'pending',
        changedAt: new Date().toISOString(),
        changedByName: user.name,
        changedByRole: user.role,
        note: 'Solicitud de retiro creada por el artista',
      },
    ],
    requestedAt: new Date().toISOString(),
    notes: notes || `Solicitud de retiro vía ${paymentMethod === 'bank' ? 'Transferencia Bancaria' : 'PayPal'}.`,
  };

  db.payoutRequests.unshift(payoutRequest);

  // 2. Financial Ledger Entry: Withdrawal Hold
  db.walletLedger = db.walletLedger || [];
  const txSeq = db.walletLedger.length + 1;
  const transactionNumber = `MOV-${new Date().getFullYear()}-${String(txSeq).padStart(4, '0')}`;
  const destinationText =
    paymentMethod === 'bank'
      ? `Banco: ${bankDetails.bankName}`
      : `PayPal: ${paypalDetails.paypalEmail}`;

  const ledgerEntry: WalletLedgerEntry = {
    id: 'tx-wallet-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
    transactionNumber,
    userId: user.id,
    userName: user.stageName || user.name,
    userRole: user.role,
    type: 'withdrawal_hold',
    typeLabel: 'Retención por solicitud de retiro',
    description: `Retención preventiva para solicitud #${requestNumber} (${destinationText})`,
    amount: -withdrawAmount,
    balanceBefore,
    balanceAfter,
    currency,
    status: 'completed',
    payoutRequestId: payoutId,
    performedByUserId: user.id,
    performedByName: user.name,
    performedByRole: user.role,
    createdAt: new Date().toISOString(),
  };
  db.walletLedger.unshift(ledgerEntry);

  // 3. Optionally save payment method for reuse
  if (savePaymentMethod) {
    db.savedPaymentMethods = db.savedPaymentMethods || [];
    const exists = db.savedPaymentMethods.some(
      (m) =>
        m.userId === user.id &&
        m.type === paymentMethod &&
        (paymentMethod === 'bank'
          ? m.bankDetails?.accountNumber === bankDetails?.accountNumber
          : m.paypalDetails?.paypalEmail === paypalDetails?.paypalEmail)
    );

    if (!exists) {
      db.savedPaymentMethods.push({
        id: 'pm-' + Date.now(),
        userId: user.id,
        type: paymentMethod,
        label:
          paymentMethod === 'bank'
            ? `${bankDetails.bankName} (••${bankDetails.accountNumber.slice(-4)})`
            : `PayPal (${paypalDetails.paypalEmail})`,
        isDefault: db.savedPaymentMethods.filter((m) => m.userId === user.id).length === 0,
        bankDetails: paymentMethod === 'bank' ? bankDetails : undefined,
        paypalDetails: paymentMethod === 'paypal' ? paypalDetails : undefined,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // 4. Notifications
  // To artist
  db.notifications.push({
    id: 'notif-' + Date.now(),
    userId: user.id,
    title: '📤 Solicitud de Retiro Enviada',
    message: `Has solicitado retirar $${withdrawAmount.toFixed(2)} ${currency}. Los fondos han quedado reservados en 'Retiro pendiente' mientras el Súper Admin procesa la transferencia.`,
    type: 'info',
    link: '/royalties',
    read: false,
    createdAt: new Date().toISOString(),
    emailSent: true,
    emailSubject: `[Sonora] Solicitud de retiro recibida #${requestNumber}`,
    emailBodyPreview: `Hola ${user.name}: Recibimos tu solicitud de retiro por $${withdrawAmount.toFixed(2)} ${currency}. Saldo disponible restante: $${balanceAfter.toFixed(2)} ${currency}. Retiro retenido: $${withdrawAmount.toFixed(2)} ${currency}. Te avisaremos una vez que el Súper Admin ejecute el pago.`,
  });

  // To Super Admin
  const superAdmin = db.users.find((u) => u.role === 'super_admin');
  if (superAdmin) {
    db.notifications.push({
      id: 'notif-admin-' + Date.now(),
      userId: superAdmin.id,
      title: '🔔 Nueva Solicitud de Retiro Pendiente',
      message: `${user.name} solicitó un retiro de $${withdrawAmount.toFixed(2)} ${currency} vía ${paymentMethod === 'bank' ? 'Banco' : 'PayPal'}.`,
      type: 'warning',
      link: '/royalties',
      read: false,
      createdAt: new Date().toISOString(),
      emailSent: false,
    });
  }

  // 5. Audit Log
  db.auditLogs.push({
    id: 'aud-' + Date.now(),
    timestamp: new Date().toISOString(),
    userId: user.id,
    userName: user.name,
    action: 'WITHDRAWAL_REQUESTED',
    entity: 'PAYOUT',
    entityId: payoutId,
    details: `Solicitó retiro de $${withdrawAmount.toFixed(2)} ${currency}. Saldo disponible: $${balanceBefore.toFixed(2)} -> $${balanceAfter.toFixed(2)}. Retenido: $${withdrawAmount.toFixed(2)}`,
    ip: req.ip || '127.0.0.1',
  });

  saveDb();

  res.status(201).json({
    success: true,
    payout: payoutRequest,
    ledgerEntry,
    updatedRoyalty: artistRoyalty,
    balance: {
      availableBalance: artistRoyalty.availableBalance,
      pendingWithdrawals: artistRoyalty.pendingWithdrawals,
      paidOut: artistRoyalty.paidOut,
      totalEarned: artistRoyalty.totalEarned,
      currency: artistRoyalty.currency,
    },
    message: `Solicitud de retiro por $${withdrawAmount.toFixed(2)} ${currency} creada exitosamente. Saldo retenido: $${withdrawAmount.toFixed(2)} ${currency}.`,
  });
});

// PATCH /api/royalties/payouts/:id/status (Super Admin processes, pays, approves, rejects or cancels payout)
royaltiesRouter.patch('/payouts/:id/status', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  const { id } = req.params;
  const {
    status, // 'in_review' | 'approved' | 'paid' | 'rejected' | 'cancelled'
    note,
    paymentReference,
    rejectionReason,
  } = req.body;

  db.payoutRequests = db.payoutRequests || [];
  const payout = db.payoutRequests.find((p) => p.id === id);

  if (!payout) {
    return res.status(404).json({ error: 'Solicitud de retiro no encontrada.' });
  }

  const validStatuses: PayoutStatus[] = ['pending', 'in_review', 'approved', 'paid', 'rejected', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Estado de retiro inválido.' });
  }

  // Permission checks:
  // Artists can only cancel their own request if it is still pending or in_review
  if (user.role === 'artist') {
    if (payout.userId !== user.id) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta solicitud.' });
    }
    if (status !== 'cancelled') {
      return res.status(403).json({ error: 'Los artistas solo pueden cancelar sus propias solicitudes.' });
    }
    if (payout.status !== 'pending' && payout.status !== 'in_review') {
      return res.status(400).json({
        error: `No puedes cancelar un retiro que ya está en estado "${payout.status}".`,
      });
    }
  } else if (user.role !== 'super_admin' && user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado.' });
  }

  const prevStatus = payout.status;
  if (prevStatus === status) {
    return res.json({ success: true, payout, message: 'El retiro ya se encuentra en este estado.' });
  }

  // Prevent transitions if already final
  if (prevStatus === 'paid' || prevStatus === 'completed') {
    return res.status(400).json({
      error: 'Esta solicitud ya fue pagada y liquidada; no puede ser modificada directamente.',
    });
  }

  const artistRoyalty = ensureArtistWallet(payout.userId, payout.currency);
  let generatedInvoice: PayoutInvoice | undefined = undefined;
  let ledgerEntry: WalletLedgerEntry | undefined = undefined;

  db.walletLedger = db.walletLedger || [];
  const txSeq = db.walletLedger.length + 1;
  const transactionNumber = `MOV-${new Date().getFullYear()}-${String(txSeq).padStart(4, '0')}`;

  // === CASE 1: STATUS -> PAID ===
  if (status === 'paid') {
    // Release from pendingWithdrawals and increment paidOut
    artistRoyalty.pendingWithdrawals = Math.max(
      0,
      Number(((artistRoyalty.pendingWithdrawals || 0) - payout.amount).toFixed(2))
    );
    artistRoyalty.paidOut = Number(((artistRoyalty.paidOut || 0) + payout.amount).toFixed(2));

    const currentYear = new Date().getFullYear();
    const invoiceSeq = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `FAC-${currentYear}-${invoiceSeq}`;
    const transactionRef = paymentReference || `TXN-${payout.paymentMethod.toUpperCase()}-${Date.now().toString().slice(-8)}`;

    generatedInvoice = {
      invoiceNumber,
      issueDate: new Date().toISOString(),
      period: `${new Date().toLocaleString('es-ES', { month: 'long' })} ${currentYear}`,
      platformName: 'Sonora Digital Music Distribution & Cadel Pro Network Media Group',
      platformTaxId: 'ES-B88741920 / US-EIN-94-3829104',
      platformAddress: 'Paseo de la Castellana 216, 28046 Madrid, España / 742 Evergreen Terrace, Miami, FL, USA',
      platformEmail: 'finance@sonoradistro.com',
      beneficiaryName:
        payout.paymentMethod === 'bank'
          ? payout.bankDetails?.accountHolder || payout.userName
          : payout.paypalDetails?.accountHolder || payout.userName,
      beneficiaryStageName: payout.artistStageName || payout.userName,
      beneficiaryEmail: payout.userEmail,
      paymentMethod: payout.paymentMethod,
      paymentDetails:
        payout.paymentMethod === 'bank'
          ? {
              bankName: payout.bankDetails?.bankName,
              accountHolder: payout.bankDetails?.accountHolder,
              accountNumber: payout.bankDetails?.accountNumber
                ? `•••••••• ${payout.bankDetails.accountNumber.slice(-4)}`
                : undefined,
              iban: payout.bankDetails?.iban
                ? `${payout.bankDetails.iban.slice(0, 4)} •••• •••• ${payout.bankDetails.iban.slice(-4)}`
                : undefined,
              swift: payout.bankDetails?.swift,
              country: payout.bankDetails?.country || 'Internacional',
            }
          : {
              paypalEmail: payout.paypalDetails?.paypalEmail,
              accountHolder: payout.paypalDetails?.accountHolder || payout.userName,
            },
      grossAmount: payout.amount,
      feeAmount: 0.0,
      netAmount: payout.amount,
      currency: payout.currency,
      status: 'paid',
      verificationHash:
        'hash-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      transactionRef,
    };

    payout.invoice = generatedInvoice;
    payout.paidAt = new Date().toISOString();
    payout.processedAt = new Date().toISOString();
    payout.paymentReference = transactionRef;
    payout.processedByAdminName = user.name;

    // Create Ledger Entry: withdrawal_paid
    ledgerEntry = {
      id: 'tx-wallet-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
      transactionNumber,
      userId: payout.userId,
      userName: payout.userName,
      userRole: 'artist',
      type: 'withdrawal_paid',
      typeLabel: 'Pago de retiro ejecutado',
      description: `Pago de retiro #${payout.requestNumber || payout.id} realizado vía ${payout.paymentMethod === 'bank' ? 'Transferencia Bancaria' : 'PayPal'}. Comprobante: ${transactionRef}. Factura: ${invoiceNumber}`,
      amount: payout.amount,
      balanceBefore: artistRoyalty.availableBalance ?? 0,
      balanceAfter: artistRoyalty.availableBalance ?? 0,
      currency: payout.currency,
      status: 'completed',
      payoutRequestId: payout.id,
      reference: transactionRef,
      performedByUserId: user.id,
      performedByName: user.name,
      performedByRole: user.role,
      createdAt: new Date().toISOString(),
    };
    db.walletLedger.unshift(ledgerEntry);

    // Notify artist
    db.notifications.push({
      id: 'notif-paid-' + Date.now(),
      userId: payout.userId,
      title: '✅ ¡Retiro Pagado y Factura Generada! 🧾',
      message: `Tu retiro de $${payout.amount.toFixed(2)} ${payout.currency} ha sido pagado por el Súper Admin. Factura Oficial #${invoiceNumber} disponible.`,
      type: 'success',
      link: '/royalties',
      read: false,
      createdAt: new Date().toISOString(),
      emailSent: true,
      emailSubject: `[Sonora] Retiro Pagado: $${payout.amount.toFixed(2)} ${payout.currency} - Factura #${invoiceNumber}`,
      emailBodyPreview: `Estimado/a ${payout.userName}: Te confirmamos que tu solicitud de retiro #${payout.requestNumber || payout.id} por $${payout.amount.toFixed(2)} ${payout.currency} fue pagada exitosamente. Referencia de pago: ${transactionRef}.`,
    });
  }

  // === CASE 2: STATUS -> REJECTED OR CANCELLED (REFUND AUTOMATICALLY) ===
  else if (status === 'rejected' || status === 'cancelled') {
    // Return funds from pendingWithdrawals back into availableBalance!
    artistRoyalty.pendingWithdrawals = Math.max(
      0,
      Number(((artistRoyalty.pendingWithdrawals || 0) - payout.amount).toFixed(2))
    );

    const balanceBefore = Number((artistRoyalty.availableBalance ?? 0).toFixed(2));
    const balanceAfter = Number((balanceBefore + payout.amount).toFixed(2));

    artistRoyalty.availableBalance = balanceAfter;
    artistRoyalty.pendingBalance = balanceAfter; // Keep synced

    const reason = rejectionReason || note || (status === 'rejected' ? 'Rechazado por administración' : 'Cancelado por el usuario');
    if (status === 'rejected') {
      payout.rejectionReason = reason;
    } else {
      payout.cancellationReason = reason;
    }

    // Create Ledger Entry: withdrawal_refund
    ledgerEntry = {
      id: 'tx-wallet-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
      transactionNumber,
      userId: payout.userId,
      userName: payout.userName,
      userRole: 'artist',
      type: 'withdrawal_refund',
      typeLabel: status === 'rejected' ? 'Devolución por retiro rechazado' : 'Devolución por retiro cancelado',
      description: `Reintegro automático de fondos al saldo disponible por solicitud #${payout.requestNumber || payout.id} (${reason})`,
      amount: payout.amount,
      balanceBefore,
      balanceAfter,
      currency: payout.currency,
      status: 'completed',
      payoutRequestId: payout.id,
      performedByUserId: user.id,
      performedByName: user.name,
      performedByRole: user.role,
      createdAt: new Date().toISOString(),
    };
    db.walletLedger.unshift(ledgerEntry);

    // Notify artist of refund
    db.notifications.push({
      id: 'notif-refund-' + Date.now(),
      userId: payout.userId,
      title: status === 'rejected' ? '⚠️ Retiro Rechazado - Fondos Devueltos' : '↩️ Retiro Cancelado - Fondos Devueltos',
      message: `Tu solicitud de retiro #${payout.requestNumber || payout.id} de $${payout.amount.toFixed(2)} ${payout.currency} fue ${status === 'rejected' ? 'rechazada' : 'cancelada'}. Los $${payout.amount.toFixed(2)} han regresado automáticamente a tu saldo disponible (Saldo actual: $${balanceAfter.toFixed(2)}).`,
      type: 'info',
      link: '/royalties',
      read: false,
      createdAt: new Date().toISOString(),
      emailSent: true,
      emailSubject: `[Sonora] Fondos reintegrados: $${payout.amount.toFixed(2)} ${payout.currency}`,
      emailBodyPreview: `Hola ${payout.userName}: Tu solicitud de retiro #${payout.requestNumber || payout.id} ha sido ${status === 'rejected' ? 'rechazada: ' + reason : 'cancelada'}. Los fondos han sido devueltos a tu saldo disponible inmediatamente. Saldo anterior: $${balanceBefore.toFixed(2)}. Saldo nuevo: $${balanceAfter.toFixed(2)}.`,
    });
  }

  // === CASE 3: STATUS -> IN_REVIEW OR APPROVED ===
  else if (status === 'in_review') {
    payout.reviewedAt = new Date().toISOString();
  }

  // Update payout record
  payout.status = status;
  payout.statusHistory = payout.statusHistory || [];
  payout.statusHistory.push({
    status,
    changedAt: new Date().toISOString(),
    changedByName: user.name,
    changedByRole: user.role,
    note: note || rejectionReason,
  });

  // Audit log
  db.auditLogs.push({
    id: 'aud-' + Date.now(),
    timestamp: new Date().toISOString(),
    userId: user.id,
    userName: user.name,
    action: `WITHDRAWAL_STATUS_${status.toUpperCase()}`,
    entity: 'PAYOUT',
    entityId: payout.id,
    details: `Cambió estado de retiro #${payout.requestNumber || payout.id} de "${prevStatus}" a "${status}". Monto: $${payout.amount.toFixed(2)}`,
    ip: req.ip || '127.0.0.1',
  });

  saveDb();

  res.json({
    success: true,
    payout,
    ledgerEntry,
    invoice: generatedInvoice,
    updatedRoyalty: artistRoyalty,
    balance: {
      availableBalance: artistRoyalty.availableBalance,
      pendingWithdrawals: artistRoyalty.pendingWithdrawals,
      paidOut: artistRoyalty.paidOut,
      totalEarned: artistRoyalty.totalEarned,
      currency: artistRoyalty.currency,
    },
    message: `Solicitud #${payout.requestNumber || payout.id} actualizada a "${status}".`,
  });
});

// GET /api/royalties/payouts (List payout requests)
royaltiesRouter.get('/payouts', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  db.payoutRequests = db.payoutRequests || [];

  let payouts: PayoutRequest[] = [];
  if (user.role === 'super_admin' || user.role === 'admin') {
    payouts = [...db.payoutRequests].sort(
      (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
  } else {
    payouts = db.payoutRequests
      .filter((p) => p.userId === user.id)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  res.json({ payouts });
});

// GET /api/royalties/payment-methods (Saved payment methods for current user)
royaltiesRouter.get('/payment-methods', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  db.savedPaymentMethods = db.savedPaymentMethods || [];

  const methods = db.savedPaymentMethods.filter((m) => m.userId === user.id);
  res.json({ methods });
});

// POST /api/royalties/payment-methods (Save new payment method)
royaltiesRouter.post('/payment-methods', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  const { type, label, bankDetails, paypalDetails, isDefault = false } = req.body;

  if (!type || (type !== 'bank' && type !== 'paypal')) {
    return res.status(400).json({ error: 'Tipo de método de pago inválido.' });
  }

  db.savedPaymentMethods = db.savedPaymentMethods || [];

  if (isDefault) {
    db.savedPaymentMethods.forEach((m) => {
      if (m.userId === user.id) m.isDefault = false;
    });
  }

  const newMethod: SavedPaymentMethod = {
    id: 'pm-' + Date.now(),
    userId: user.id,
    type,
    label: label || (type === 'bank' ? bankDetails?.bankName || 'Cuenta Bancaria' : 'PayPal'),
    isDefault,
    bankDetails: type === 'bank' ? bankDetails : undefined,
    paypalDetails: type === 'paypal' ? paypalDetails : undefined,
    createdAt: new Date().toISOString(),
  };

  db.savedPaymentMethods.unshift(newMethod);
  saveDb();

  res.status(201).json({ success: true, method: newMethod });
});

// DELETE /api/royalties/payment-methods/:id
royaltiesRouter.delete('/payment-methods/:id', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  const { id } = req.params;

  db.savedPaymentMethods = db.savedPaymentMethods || [];
  const idx = db.savedPaymentMethods.findIndex((m) => m.id === id && m.userId === user.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Método de pago no encontrado.' });
  }

  db.savedPaymentMethods.splice(idx, 1);
  saveDb();

  res.json({ success: true, message: 'Método de pago eliminado.' });
});

// POST /api/royalties/manual-streams (Super Admin inputs monthly stream counts per platform)
royaltiesRouter.post(
  '/manual-streams',
  authenticate,
  requireRole('super_admin', 'admin'),
  (req: Request, res: Response) => {
    const adminUser = (req as any).user;
    const db = getDb();
    const {
      artistId,
      period = 'Agosto 2026',
      month = 'Agosto',
      year = 2026,
      releaseId,
      platformStreams,
      notes,
      creditEarnings = true,
    } = req.body;

    if (!artistId) {
      return res.status(400).json({ error: 'Debes seleccionar el artista beneficiario.' });
    }

    const targetArtist = db.users.find((u) => u.id === artistId);
    if (!targetArtist) {
      return res.status(404).json({ error: 'Artista o sello no encontrado.' });
    }

    if (!Array.isArray(platformStreams) || platformStreams.length === 0) {
      return res.status(400).json({ error: 'Debes especificar al menos una plataforma con su conteo de reproducciones.' });
    }

    let releaseTitle: string | undefined = undefined;
    if (releaseId) {
      const rel = db.releases.find((r) => r.id === releaseId);
      if (rel) releaseTitle = rel.title;
    }

    const artistRoyalty = ensureArtistWallet(artistId);

    // Process stream entries
    let totalReportStreams = 0;
    let totalReportEarnings = 0;

    const sanitizedEntries: PlatformStreamEntry[] = platformStreams.map((entry: any) => {
      const streamsCount = Math.max(0, parseInt(entry.streams, 10) || 0);
      const rate = typeof entry.ratePerStream === 'number' && entry.ratePerStream > 0 ? entry.ratePerStream : 0.0035;
      const earnings =
        typeof entry.estimatedEarnings === 'number' && entry.estimatedEarnings >= 0
          ? Number(entry.estimatedEarnings.toFixed(2))
          : Number((streamsCount * rate).toFixed(2));

      totalReportStreams += streamsCount;
      totalReportEarnings += earnings;

      return {
        platform: entry.platform || 'General',
        streams: streamsCount,
        ratePerStream: rate,
        estimatedEarnings: earnings,
      };
    });

    // 1. Update total streams
    artistRoyalty.totalStreams = (artistRoyalty.totalStreams || 0) + totalReportStreams;

    // 2. If crediting earnings to balance
    if (creditEarnings && totalReportEarnings > 0) {
      const balanceBefore = Number((artistRoyalty.availableBalance ?? 0).toFixed(2));
      const balanceAfter = Number((balanceBefore + totalReportEarnings).toFixed(2));
      artistRoyalty.availableBalance = balanceAfter;
      artistRoyalty.pendingBalance = balanceAfter;
      artistRoyalty.totalEarned = Number(((artistRoyalty.totalEarned || 0) + totalReportEarnings).toFixed(2));

      // Financial ledger entry
      db.walletLedger = db.walletLedger || [];
      const txSeq = db.walletLedger.length + 1;
      const transactionNumber = `MOV-${new Date().getFullYear()}-${String(txSeq).padStart(4, '0')}`;

      db.walletLedger.unshift({
        id: 'tx-wallet-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900),
        transactionNumber,
        userId: targetArtist.id,
        userName: targetArtist.stageName || targetArtist.name,
        userRole: targetArtist.role,
        type: 'deposit',
        typeLabel: 'Liquidación de reproducciones (Streams)',
        description: `Liquidación por ${totalReportStreams.toLocaleString()} reproducciones en ${period} (${sanitizedEntries.map((e) => e.platform).slice(0, 3).join(', ')})`,
        amount: totalReportEarnings,
        balanceBefore,
        balanceAfter,
        currency: artistRoyalty.currency || 'USD',
        status: 'completed',
        performedByUserId: adminUser.id,
        performedByName: adminUser.name,
        performedByRole: adminUser.role,
        createdAt: new Date().toISOString(),
      });
    }

    // 3. Update Monthly Stats
    const monthLabel = month.slice(0, 3);
    artistRoyalty.monthlyStats = artistRoyalty.monthlyStats || [];
    const existingMonthIdx = artistRoyalty.monthlyStats.findIndex(
      (m) => m.month.toLowerCase() === monthLabel.toLowerCase() || m.month.toLowerCase() === month.toLowerCase()
    );
    if (existingMonthIdx >= 0) {
      artistRoyalty.monthlyStats[existingMonthIdx].streams += totalReportStreams;
      artistRoyalty.monthlyStats[existingMonthIdx].earnings = Number(
        (artistRoyalty.monthlyStats[existingMonthIdx].earnings + totalReportEarnings).toFixed(2)
      );
    } else {
      artistRoyalty.monthlyStats.push({
        month: monthLabel,
        streams: totalReportStreams,
        earnings: Number(totalReportEarnings.toFixed(2)),
      });
    }

    // 4. Update DSP Breakdown
    artistRoyalty.dspBreakdown = artistRoyalty.dspBreakdown || [];
    sanitizedEntries.forEach((entry) => {
      const existingDsp = artistRoyalty.dspBreakdown.find((d) => d.name.toLowerCase() === entry.platform.toLowerCase());
      if (existingDsp) {
        existingDsp.amount = Number(((existingDsp.amount || 0) + entry.estimatedEarnings).toFixed(2));
      } else {
        artistRoyalty.dspBreakdown.push({
          name: entry.platform,
          amount: entry.estimatedEarnings,
          percentage: 10,
        });
      }
    });

    // 5. Create stream report record
    const streamReport: ManualStreamReport = {
      id: 'rep-stream-' + Date.now(),
      artistId: targetArtist.id,
      artistName: targetArtist.stageName || targetArtist.name,
      period,
      month,
      year: Number(year) || 2026,
      platformStreams: sanitizedEntries,
      totalStreams: totalReportStreams,
      totalEarnings: Number(totalReportEarnings.toFixed(2)),
      currency: artistRoyalty.currency || 'USD',
      releaseId: releaseId || undefined,
      releaseTitle: releaseTitle || undefined,
      recordedByAdminName: adminUser.name,
      createdAt: new Date().toISOString(),
      notes: notes || `Carga manual de reproducciones generadas en ${period} por plataformas digitales.`,
    };

    db.manualStreamReports = db.manualStreamReports || [];
    db.manualStreamReports.unshift(streamReport);

    // Notify artist
    db.notifications.push({
      id: 'notif-streams-' + Date.now(),
      userId: targetArtist.id,
      title: `🎧 ¡Reporte de Reproducciones (${period}) Acreditado!`,
      message: `Tu catálogo generó ${totalReportStreams.toLocaleString()} reproducciones en plataformas digitales durante ${period}. Se han acreditado $${totalReportEarnings.toFixed(2)} USD en tu saldo disponible.`,
      type: 'success',
      link: '/royalties',
      read: false,
      createdAt: new Date().toISOString(),
      emailSent: true,
      emailSubject: `[Sonora] Reporte de streaming: ${totalReportStreams.toLocaleString()} reproducciones en ${period}`,
      emailBodyPreview: `Estimado/a ${targetArtist.name}: Se ha registrado el reporte mensual de reproducciones por plataformas para el período ${period}. Total de streams: ${totalReportStreams.toLocaleString()}. Saldo acreditado: $${totalReportEarnings.toFixed(2)} USD. Saldo disponible actual: $${(artistRoyalty.availableBalance ?? 0).toFixed(2)} USD.`,
    });

    // Audit log
    db.auditLogs.push({
      id: 'aud-' + Date.now(),
      timestamp: new Date().toISOString(),
      userId: adminUser.id,
      userName: adminUser.name,
      action: 'RECORD_MONTHLY_STREAMS',
      entity: 'ROYALTY_STREAMS',
      entityId: streamReport.id,
      details: `Registró ${totalReportStreams.toLocaleString()} streams ($${totalReportEarnings.toFixed(2)} USD) para ${targetArtist.name} en ${period}`,
      ip: req.ip || '127.0.0.1',
    });

    saveDb();

    res.status(201).json({
      success: true,
      streamReport,
      updatedRoyalty: artistRoyalty,
      balance: {
        availableBalance: artistRoyalty.availableBalance,
        pendingWithdrawals: artistRoyalty.pendingWithdrawals,
        paidOut: artistRoyalty.paidOut,
        totalEarned: artistRoyalty.totalEarned,
        currency: artistRoyalty.currency,
      },
      message: `¡Se registraron exitosamente ${totalReportStreams.toLocaleString()} reproducciones de ${period} para ${targetArtist.name}!`,
    });
  }
);

// GET /api/royalties/streams (Get manual stream reports)
royaltiesRouter.get('/streams', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const db = getDb();
  db.manualStreamReports = db.manualStreamReports || [];

  let reports: ManualStreamReport[] = [];
  if (user.role === 'super_admin' || user.role === 'admin') {
    reports = [...db.manualStreamReports].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } else {
    reports = db.manualStreamReports
      .filter((r) => r.artistId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json({ reports });
});
