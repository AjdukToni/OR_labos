// Klijentski kôd za datatable.html: asinkrono dohvaća podatke s backenda i puni tablicu.
const forma = document.getElementById('forma');
const unos = document.getElementById('q');
const izbornik = document.getElementById('polje');
const statusEl = document.getElementById('status');
const zaglavlje = document.getElementById('zaglavlje');
const tijelo = document.getElementById('tijelo');
const preuzmiCsv = document.getElementById('preuzmiCsv');
const preuzmiJson = document.getElementById('preuzmiJson');

let stupci = [];

function postaviStatus(tekst, jeGreska = false) {
  statusEl.textContent = tekst;
  statusEl.classList.toggle('greska', jeGreska);
}

function parametri() {
  const p = new URLSearchParams();
  if (unos.value.trim()) p.set('q', unos.value.trim());
  if (izbornik.value) p.set('polje', izbornik.value);
  return p;
}

// Poveznice za preuzimanje uvijek odgovaraju trenutnom filtru.
function azurirajPoveznice(p) {
  for (const [a, format] of [[preuzmiCsv, 'csv'], [preuzmiJson, 'json']]) {
    const s = new URLSearchParams({ format });
    for (const [k, v] of p) s.set(k, v);
    a.href = '/api/podaci/preuzmi?' + s;
  }
}

function nacrtajZaglavlje() {
  const tr = document.createElement('tr');
  for (const naziv of stupci) {
    const th = document.createElement('th');
    th.textContent = naziv.replaceAll('_', ' ');
    tr.appendChild(th);
  }
  zaglavlje.replaceChildren(tr);
}

function nacrtajRetke(redci) {
  const fragment = document.createDocumentFragment();
  for (const r of redci) {
    const tr = document.createElement('tr');
    for (const naziv of stupci) {
      const td = document.createElement('td');
      td.textContent = r[naziv] ?? '';
      tr.appendChild(td);
    }
    fragment.appendChild(tr);
  }
  tijelo.replaceChildren(fragment);
}

async function ucitaj() {
  const p = parametri();
  azurirajPoveznice(p);
  postaviStatus('Učitavam podatke…');
  try {
    const odgovor = await fetch('/api/podaci?' + p);
    const podaci = await odgovor.json();
    if (!odgovor.ok) throw new Error(podaci.greska || 'Zahtjev nije uspio.');
    nacrtajRetke(podaci);
    postaviStatus(podaci.length ? `Prikazano redaka: ${podaci.length}` : 'Nema podataka koji odgovaraju pretrazi. Promijenite pojam ili izbrišite pretragu.');
  } catch (err) {
    tijelo.replaceChildren();
    postaviStatus('Podaci se nisu mogli dohvatiti: ' + err.message, true);
  }
}

async function pokreni() {
  if (location.protocol === 'file:') {
    postaviStatus('Stranicu otvorite preko poslužitelja: http://localhost:3000/datatable.html (a ne dvostrukim klikom na datoteku).', true);
    return;
  }
  try {
    const odgovor = await fetch('/api/polja');
    stupci = await odgovor.json();
    for (const naziv of stupci) {
      const opcija = document.createElement('option');
      opcija.value = naziv;
      opcija.textContent = naziv.replaceAll('_', ' ');
      izbornik.appendChild(opcija);
    }
    nacrtajZaglavlje();
  } catch (err) {
    postaviStatus('Popis atributa se nije mogao dohvatiti: ' + err.message, true);
    return;
  }
  ucitaj();
}

forma.addEventListener('submit', (e) => { e.preventDefault(); ucitaj(); });
// Brisanje pretrage vraća tablicu u početni prikaz.
unos.addEventListener('input', () => { if (!unos.value.trim()) ucitaj(); });
izbornik.addEventListener('change', ucitaj);

pokreni();