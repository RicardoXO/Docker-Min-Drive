import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

// Asegurar que la carpeta exista
const UPLOAD_DIR = '/data/uploads';
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configurar almacenamiento de multer
const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Endpoint de upload
app.post('/files', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await query(
      `INSERT INTO files (original_name, stored_name, mime_type, size_bytes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        req.file.originalname,
        req.file.filename,
        req.file.mimetype,
        req.file.size,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('UPLOAD ERROR:', err);

    return res.status(500).json({
      error: 'Upload failed',
      detail: err.message,
    });
  }
});

// Health
app.get('/health', (_, res) => {
  res.json({ ok: true });
});

app.listen(8080, () => {
  console.log('API corriendo en http://localhost:8080');
});
