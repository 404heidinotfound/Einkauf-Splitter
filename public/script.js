const API = 'http://localhost:3000/api/eintraege';
const form = document.getElementById('eintragForm');
const liste = document.getElementById('eintragsListe');
const schuldenDiv = document.getElementById('schuldenstand');
const resetBtn = document.getElementById('resetBtn');
const filterPerson = document.getElementById('filterPerson');
const filterKategorie = document.getElementById('filterKategorie');
const filterMonat = document.getElementById('filterMonat');
const filterBtn = document.getElementById('filterBtn');
const exportBtn = document.getElementById('exportBtn');

let eintraege = [];

async function ladeEintraege(query = '') {
  console.log('ladeEintraege mit query:', query);
  try {
    const res = await fetch('http://localhost:3000/api/eintraege');
    const data = await res.json();
    eintraege = data;
    eintraege = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    liste.innerHTML = '';
    data.forEach(showEntry);
    aktualisiereSchuldenstand();
  } catch (err) {
    console.error('Fehler beim Laden der Einträge:', err);
  }
}

function showEntry(e) {
  const li = document.createElement('li');
  li.classList.add('eintrag-item');
  if (e.reset) {
    li.classList.add('ausgeglichen'); // 🟢 grau
  }

  li.textContent = `${new Date(e.timestamp).toLocaleString()} | ${e.person} | €${parseFloat(e.betrag).toFixed(2)} | ${e.kategorie} | ${e.aufteilung}`;
  if (e.beschreibung) li.textContent += ` | ${e.beschreibung}`;
  liste.appendChild(li);
}


function aktualisiereSchuldenstand() {
  let schulden = { Heidi: 0, Roman: 0 };

  eintraege.forEach(e => {
    const b = parseFloat(e.betrag);
    const zahler = e.person;
    const aufteilung = e.aufteilung;

    console.log(`Eintrag: ${zahler} zahlt ${b} – Aufteilung: ${aufteilung}`);

    if (aufteilung === '50:50') {
      if (zahler === 'Heidi') {
        schulden['Roman'] += b / 2;
      } else if (zahler === 'Roman') {
        schulden['Heidi'] += b / 2;
      }
    } else if (aufteilung === 'Zahler') {
      // Niemand schuldet etwas
    } else if (aufteilung === 'Andere') {
      if (zahler === 'Heidi') {
        schulden['Roman'] += b;
      } else if (zahler === 'Roman') {
        schulden['Heidi'] += b;
      }
    }

  });

  let text;
  if (schulden.Roman > schulden.Heidi) {
    text = `Roman schuldet Heidi €${(schulden.Roman - schulden.Heidi).toFixed(2)}`;
  } else if (schulden.Heidi > schulden.Roman) {
    text = `Heidi schuldet Roman €${(schulden.Heidi - schulden.Roman).toFixed(2)}`;
  } else {
    text = 'Alles ausgeglichen 😊';
  }

  schuldenDiv.textContent = text;
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
data.reset = false;
  console.log('Sende neuen Eintrag:', data);
  try {
    await fetch('http://localhost:3000/api/eintraege', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    form.reset();
    ladeEintraege();
  } catch (err) {
    console.error('Fehler beim Speichern:', err);
  }
});

filterBtn.addEventListener('click', () => {
  const params = [];
  if (filterPerson.value) params.push(`person=${encodeURIComponent(filterPerson.value)}`);
  if (filterKategorie.value) params.push(`category=${encodeURIComponent(filterKategorie.value)}`);
  if (filterMonat.value) params.push(`month=${encodeURIComponent(filterMonat.value)}`);
  const query = params.length ? `?${params.join('&')}` : '';
  ladeEintraege(query);
});

resetBtn.addEventListener('click', async () => {
  console.log('Reset: markiere Einträge als ausgeglichen');

  try {
    // 🟢 Lade alle Einträge vom Server
    const res = await fetch('http://localhost:3000/api/eintraege');
    const data = await res.json();

    // 🟢 Setze alle auf reset = true
    const updated = data.map(e => ({ ...e, reset: true }));

    // 🟢 Speichere alle geänderten Einträge
    await fetch('http://localhost:3000/api/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });

    ladeEintraege(); // neu laden
  } catch (err) {
    console.error('Fehler beim Reset:', err);
  }
});


exportBtn.addEventListener('click', () => {
  console.log('Exportiere CSV');
  window.location.href = '/api/export';
});

window.addEventListener('DOMContentLoaded', () => ladeEintraege());
