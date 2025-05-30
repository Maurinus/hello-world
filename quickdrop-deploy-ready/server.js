const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

const upload = multer({ storage });

// Store file metadata in memory
const fileMap = new Map();

app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  const id = crypto.randomBytes(8).toString('hex');
  const filePath = file.path;
  const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
  fileMap.set(id, { filePath, expires, downloaded: false });
  setTimeout(() => deleteFile(id), 15 * 60 * 1000);
  res.json({ link: `/file/${id}` });
});

app.get('/file/:id', (req, res) => {
  const { id } = req.params;
  const meta = fileMap.get(id);
  if (!meta) return res.status(404).send('File not found or expired');
  if (meta.downloaded) return res.status(410).send('File already downloaded');
  meta.downloaded = true;
  res.download(meta.filePath, err => {
    deleteFile(id);
  });
});

function deleteFile(id) {
  const meta = fileMap.get(id);
  if (!meta) return;
  fs.unlink(meta.filePath, () => {});
  fileMap.delete(id);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
