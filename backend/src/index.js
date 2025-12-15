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

// Endpoint de listado
app.get('/files', async (req, res) => {
  try {
    const result = await query('SELECT * FROM files ORDER BY created_at DESC');

    res.json(result.rows);
  } catch (err) {
    console.error('LIST FILES ERROR:', err);
    res.status(500).json({ error: 'Could not list files' });
  }
});

// Endpoint de download
app.get("/files/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      "SELECT * FROM files WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    const file = result.rows[0];
    const filePath = path.join("/data/uploads", file.stored_name);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File missing on disk" });
    }

    res.download(filePath, file.original_name);
  } catch (err) {
    console.error("DOWNLOAD ERROR:", err);
    res.status(500).json({ error: "Could not download file" });
  }
});

// Endpoint de preview
app.get("/files/:id/preview", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      "SELECT * FROM files WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    const file = result.rows[0];
    const filePath = path.join("/data/uploads", file.stored_name);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File missing on disk" });
    }

    res.setHeader("Content-Type", file.mime_type);
    res.sendFile(filePath);
  } catch (err) {
    console.error("PREVIEW ERROR:", err);
    res.status(500).json({ error: "Could not preview file" });
  }
});

// Endpoint de delete
app.delete('/files/:id',async (req, res)=>{
  try{
    const {id} = req.params;
    
    const result = await query(
      "SELECT * FROM files WHERE id = $1",
      [id]
    );
    if(result.rows.length ===0){
      return res.status(404).json({error: "File not found"});
    }
    const file = result.rows[0];
    const filePath = path.join("/data/uploads", file.stored_name);

    // Borrar el archivo del disco
    if(fs.existsSync(filePath)){
      fs.unlinkSync(filePath);
    }

    // Borrar el registro de la base de datos
    await query(
      "DELETE FROM files WHERE id = $1",
      [id]
    );
    res.json({message: "File deleted successfully"});
  }catch(err){
    console.error("DELETE ERROR:", err);
    res.status(500).json({error: "Could not delete file"});
  }
});

// Health
app.get('/health', (_, res) => {
  res.json({ ok: true });
});

app.listen(8080, () => {
  console.log('API corriendo en http://localhost:8080');
});
