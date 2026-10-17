import { Router, Request, Response } from 'express';
import { authenticate } from './auth.js';
import { FileValidationResult } from '../../src/types.js';

export const uploadRouter = Router();

// POST /api/upload/validate-cover
uploadRouter.post('/validate-cover', authenticate, (req: Request, res: Response) => {
  const { fileName, width = 3000, height = 3000, fileSizeMB = 4.2, mimeType = 'image/jpeg' } = req.body;

  const errors: string[] = [];
  const warnings: string[] = [];

  const isSquare = width === height;
  const isMinResolution = width >= 3000 && height >= 3000;
  const isAllowedFormat = ['image/jpeg', 'image/png', 'image/webp'].includes(mimeType) ||
    fileName?.toLowerCase().endsWith('.jpg') ||
    fileName?.toLowerCase().endsWith('.png');

  if (!isAllowedFormat) {
    errors.push('Formato no permitido. Solo se aceptan archivos JPG o PNG de alta fidelidad.');
  }

  if (!isSquare) {
    errors.push(`Relación de aspecto incorrecta (${width}x${height}). Los DSPs exigen una relación 1:1 perfectamente cuadrada.`);
  }

  if (!isMinResolution) {
    errors.push(`Resolución insuficiente (${width}x${height}px). Las especificaciones de Spotify y Apple Music exigen al menos 3000 x 3000 píxeles.`);
  }

  if (fileSizeMB > 25) {
    errors.push(`El archivo excede el tamaño máximo permitido de 25MB (Tamaño actual: ${fileSizeMB}MB).`);
  }

  if (width > 6000) {
    warnings.push('La resolución es superior a 6000x6000px; será procesada pero puede demorar la transcodificación.');
  }

  const result: FileValidationResult = {
    valid: errors.length === 0,
    fileName: fileName || 'cover_art.jpg',
    fileSizeMB: Number(fileSizeMB) || 4.2,
    fileType: mimeType,
    details: {
      dimensions: { width: Number(width), height: Number(height) },
      isSquare,
    },
    errors,
    warnings,
  };

  res.json({ result });
});

// POST /api/upload/validate-audio
uploadRouter.post('/validate-audio', authenticate, (req: Request, res: Response) => {
  const {
    fileName,
    fileSizeMB = 38.5,
    mimeType = 'audio/wav',
    sampleRate = '48.0 kHz',
    bitrate = '2304 kbps',
    duration = 218,
  } = req.body;

  const errors: string[] = [];
  const warnings: string[] = [];

  const ext = fileName?.split('.').pop()?.toLowerCase();
  const formatOk = ['wav', 'flac', 'mp3', 'aiff'].includes(ext || '');

  if (!formatOk) {
    errors.push('Formato de audio no compatible. La plataforma requiere archivos WAV (PCM 16 o 24 bits) o FLAC sin compresión.');
  }

  if (ext === 'mp3') {
    warnings.push('Se detectó formato MP3. Aunque es aceptado para preescucha, se recomienda encarecidamente WAV de 24-bit/48kHz para distribución oficial.');
  }

  if (fileSizeMB > 300) {
    errors.push('El archivo supera los 300MB máximos por pista.');
  }

  if (duration < 15) {
    errors.push('La pista dura menos de 15 segundos; la mayoría de tiendas digitales rechazan pistas de duración inferior a 30 segundos.');
  }

  const result: FileValidationResult = {
    valid: errors.length === 0,
    fileName: fileName || 'track_audio.wav',
    fileSizeMB: Number(fileSizeMB) || 38.5,
    fileType: mimeType,
    details: {
      duration: Number(duration),
      sampleRate,
      bitrate,
      formatOk,
    },
    errors,
    warnings,
  };

  res.json({ result });
});
