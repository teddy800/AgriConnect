import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { auth, role } from '../middleware/auth.js';

fs.mkdirSync('uploads', { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads',
    filename: (_, file, cb) =>
      cb(
        null,
        `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname).toLowerCase()}`
      )
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_, file, cb) => cb(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype))
});

const r = Router();

r.post('/', auth, role('farmer'), upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Upload a JPG, PNG or WebP image under 2 MB.' });
  }
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

export default r;
