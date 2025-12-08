// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Admin name is ONLY known on the server now.
// You can override this in Render with an environment variable ADMIN_NAME.
const ADMIN_NAME = process.env.ADMIN_NAME || 'gam_evo';

app.use(express.json());

// Serve your static files (index.html, CSS, JS) from ./Public
app.use(express.static(path.join(__dirname, '/')));

// Helper to load state from disk
function readState() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { events: {}, activeEventId: null };
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw || '{}');
    if (!data.events) data.events = {};
    if (!('activeEventId' in data)) data.activeEventId = null;

    // Clean up any old admin participant entries (from older frontend versions)
    if (ADMIN_NAME && data.events) {
      for (const id of Object.keys(data.events)) {
        const ev = data.events[id];
        if (ev && ev.participants && ev.participants[ADMIN_NAME]) {
          delete ev.participants[ADMIN_NAME];
        }
      }
    }

    return data;
  } catch (e) {
    console.error('Error reading state:', e);
    return { events: {}, activeEventId: null };
  }
}

// Helper to save state to disk
function writeState(state) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing state:', e);
  }
}

// Simple "login" endpoint: server tells us if this name is the admin.
// The actual admin name never appears in the HTML/JS.
app.post('/api/login', (req, res) => {
  try {
    const { name } = req.body || {};
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const trimmed = name.trim();
    const isAdmin = trimmed === ADMIN_NAME;
    res.json({ ok: true, isAdmin });
  } catch (e) {
    console.error('Error in /api/login:', e);
    res.status(500).json({ error: 'Internal error' });
  }
});

// GET current global state
app.get('/api/state', (req, res) => {
  const state = readState();
  res.json(state);
});

// POST new global state
app.post('/api/state', (req, res) => {
  const state = req.body;
  if (!state || typeof state !== 'object') {
    return res.status(400).json({ error: 'Invalid state' });
  }
  writeState(state);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
