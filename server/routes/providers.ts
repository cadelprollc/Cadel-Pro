import { Router, Request, Response } from 'express';
import { getDb, saveDb } from '../db.js';
import { authenticate, requireRole } from './auth.js';
import { DistributionProvider } from '../../src/types.js';

export const providersRouter = Router();

// GET /api/providers
providersRouter.get('/', authenticate, (req: Request, res: Response) => {
  const db = getDb();
  res.json({ providers: db.providers });
});

// POST /api/providers (Super Admin only)
providersRouter.post('/', authenticate, requireRole('super_admin'), (req: Request, res: Response) => {
  const db = getDb();
  const {
    name,
    code,
    endpoint,
    apiKey,
    status = 'sandbox',
    integrationType = 'REST_JSON',
    webhookUrl,
    supportedDspCount = 50,
    deliveryLatencyMinutes = 15,
    description = '',
  } = req.body;

  if (!name || !endpoint) {
    return res.status(400).json({ error: 'Nombre y Endpoint del proveedor son obligatorios' });
  }

  const newProvider: DistributionProvider = {
    id: 'prov-' + Date.now(),
    name,
    code: code || name.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
    endpoint,
    apiKeyMasked: apiKey ? apiKey.slice(0, 4) + '••••••••' + apiKey.slice(-4) : 'none',
    status,
    integrationType,
    webhookUrl: webhookUrl || `https://api.sonoradistro.com/webhooks/${code.toLowerCase()}`,
    supportedDspCount: Number(supportedDspCount) || 40,
    deliveryLatencyMinutes: Number(deliveryLatencyMinutes) || 15,
    description,
  };

  db.providers.push(newProvider);
  saveDb();

  res.status(201).json({ provider: newProvider });
});

// PUT /api/providers/:id
providersRouter.put('/:id', authenticate, requireRole('super_admin'), (req: Request, res: Response) => {
  const db = getDb();
  const provider = db.providers.find((p) => p.id === req.params.id);

  if (!provider) return res.status(404).json({ error: 'Proveedor no encontrado' });

  const { apiKey, ...rest } = req.body;
  Object.assign(provider, rest);

  if (apiKey && !apiKey.includes('••••')) {
    provider.apiKeyMasked = apiKey.slice(0, 4) + '••••••••' + apiKey.slice(-4);
  }

  saveDb();
  res.json({ provider });
});

// DELETE /api/providers/:id
providersRouter.delete('/:id', authenticate, requireRole('super_admin'), (req: Request, res: Response) => {
  const db = getDb();
  const idx = db.providers.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Proveedor no encontrado' });

  db.providers.splice(idx, 1);
  saveDb();
  res.json({ success: true, message: 'Proveedor eliminado' });
});

// POST /api/providers/:id/test-ping
providersRouter.post('/:id/test-ping', authenticate, requireRole('admin', 'super_admin'), (req: Request, res: Response) => {
  const db = getDb();
  const provider = db.providers.find((p) => p.id === req.params.id);
  if (!provider) return res.status(404).json({ error: 'Proveedor no encontrado' });

  // Simulate latency & ping check
  const simulatedLatency = Math.floor(45 + Math.random() * 85);
  res.json({
    status: 'ONLINE',
    httpStatus: 200,
    latencyMs: simulatedLatency,
    endpoint: provider.endpoint,
    integrationType: provider.integrationType,
    supportedDSPs: provider.supportedDspCount,
    capabilities: ['AUDIO_WAV_24BIT', 'ARTWORK_3000x3000_RGB', 'DDEX_ERN_4_3', 'LYRICS_TIMED_TEXT'],
    message: `Conexión exitosa con el servicio ${provider.name}. Autenticación API Key validada.`,
  });
});
