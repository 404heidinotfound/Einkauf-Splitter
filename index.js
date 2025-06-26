const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const DATA_FILE = 'data.json';
const { Parser } = require('json2csv');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

let eintraege = [];
let resetZeitstempel = null;

if (fs.existsSync(DATA_FILE)) {
  try {
    const daten = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    eintraege = daten.eintraege || [];
    resetZeitstempel = daten.resetZeitstempel || null;
  } catch (err) {
    console.error('Fehler beim Einlesen der Datei:', err);
    eintraege = [];
    resetZeitstempel = null;
  }
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ eintraege, resetZeitstempel }));
}

app.get('/api/eintraege', (req, res) => {
  let filtered = [...eintraege];
  const { month, category, person } = req.query;
  if (resetZeitstempel) {
    filtered = filtered.filter(e => new Date(e.timestamp) > new Date(resetZeitstempel));
  }
  if (month) filtered = filtered.filter(e => e.timestamp.startsWith(month));
  if (category) filtered = filtered.filter(e => e.kategorie === category);
  if (person) filtered = filtered.filter(e => e.person === person);
  res.json(filtered);
});

app.post('/api/eintraege', (req, res) => {
  const data = req.body;
  const neuer = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    person: data.person,
    betrag: parseFloat(data.betrag),
    kategorie: data.kategorie,
    beschreibung: data.beschreibung || '',
    aufteilung: data.aufteilung
  };
  eintraege.push(neuer);
  saveData();
  res.status(201).json(neuer);
});

app.get('/api/export', (req, res) => {
  const fields = ['timestamp','person','betrag','kategorie','beschreibung','aufteilung'];
  const parser = new Parser({ fields });
  const csv = parser.parse(eintraege);
  res.header('Content-Type', 'text/csv');
  res.attachment('ausgaben.csv');
  res.send(csv);
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});

app.post('/api/reset', (req, res) => {
  const aktualisierteEintraege = req.body;

  if (!Array.isArray(aktualisierteEintraege)) {
    return res.status(400).json({ error: 'Erwarte ein Array von Einträgen' });
  }

  eintraege = aktualisierteEintraege; // 🟢 Ersetze die bisherigen Daten durch neue Liste
  saveData();                         // 🟢 Speichere data.json neu
  res.json({ message: 'Einträge aktualisiert' });
});
