// oooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo
// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());

// Serve your static files (index.html, CSS, JS)
app.use(express.static(path.join(__dirname, 'Public')));

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
