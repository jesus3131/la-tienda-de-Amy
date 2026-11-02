import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'products');
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const tmpDir = path.resolve(process.cwd(), 'uploads', 'tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
}

export function validateImage(file: { mimetype: string; size: number; originalname?: string }) {
  const ext = (file.originalname || '').toLowerCase();
  const hasImageExt = /\.(jpg|jpeg|png|webp)$/.test(ext);
  if (!ALLOWED_MIME.includes(file.mimetype) && !hasImageExt) throw new Error('Formato no permitido. Use JPEG, PNG o WebP.');
  if (file.size > MAX_SIZE) throw new Error('La imagen supera 5 MB.');
  if (file.size === 0) throw new Error('Archivo vacío.');
}

export function saveImage(file: { path: string; originalname: string; mimetype: string }) {
  ensureUploadDir();
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
  const filename = `${randomUUID()}${safeExt}`;
  const dest = path.join(UPLOAD_DIR, filename);
  fs.renameSync(file.path, dest);
  return `/uploads/products/${filename}`;
}

export function deleteImage(imageUrl: string | null) {
  if (!imageUrl) return;
  const filename = path.basename(imageUrl);
  // prevent path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) return;
  const filePath = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

export { UPLOAD_DIR, ALLOWED_MIME, MAX_SIZE };
