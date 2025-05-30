const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Stripe = require('stripe');
const cors = require('cors');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3001;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_...'; // Replace with your real key
const stripe = Stripe(STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

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

// Store file metadata and valid sessions in memory
const fileMap = new Map();
const validSessions = new Set();

// Stripe Checkout session creation
app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'QuickDrop File Transfer' },
          unit_amount: 50,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: req.body.success_url + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: req.body.cancel_url,
    });
    res.json({ id: session.id, url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validate session before upload
app.post('/validate-session', async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'Missing session_id' });
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === 'paid') {
      validSessions.add(session_id);
      return res.json({ valid: true });
    }
    res.json({ valid: false });
  } catch (err) {
    res.status(400).json({ error: 'Invalid session' });
  }
});

// Upload endpoint (requires valid session)
app.post('/upload', upload.single('file'), async (req, res) => {
  const { session_id } = req.body;
  if (!session_id || !validSessions.has(session_id)) {
    return res.status(403).json({ error: 'Invalid or missing payment session' });
  }
  validSessions.delete(session_id); // One upload per payment
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  const id = crypto.randomBytes(8).toString('hex');
  const filePath = file.path;
  const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
  fileMap.set(id, { filePath, expires, downloaded: false });
  setTimeout(() => deleteFile(id), 15 * 60 * 1000);

  // Generate QR code for download link
  const downloadUrl = `${req.protocol}://${req.get('host')}/download/${id}`;
  const qr = await QRCode.toDataURL(downloadUrl);

  res.json({ link: `/file/${id}`, qr, downloadUrl });
});

// Serve download page with QR code
app.get('/download/:id', (req, res) => {
  const { id } = req.params;
  const meta = fileMap.get(id);
  if (!meta) return res.status(404).send('File not found or expired');
  // Simple HTML page with download button
  res.send(`
    <html>
      <head><title>Download File</title></head>
      <body style="text-align:center;font-family:sans-serif;">
        <h2>Your file is ready</h2>
        <a href="/file/${id}" style="font-size:1.5em;">Download</a>
      </body>
    </html>
  `);
});

app.get('/file/:id', (req, res) => {
  const { id } = req.params;
  const meta = fileMap.get(id);
  if (!meta) return res.status(404).send('File not found or expired');
  if (meta.downloaded) {
    // File already downloaded, delete if not already
    deleteFile(id);
    return res.status(410).send('File already downloaded');
  }
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
