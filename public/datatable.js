
// Klijentski kôd za datatable.html: dohvaća podatke s backenda i prikazuje ih u tablici.

// Dohvaćanje HTML elemenata.
const forma = document.getElementById('forma');
const unos = document.getElementById('q');
const izbornik = document.getElementById('polje');
const statusEl = document.getElementById('status');
const zaglavlje = document.getElementById('zaglavlje');
const tijelo = document.getElementById('tijelo');
const preuzmiCsv = document.getElementById('preuzmiCsv');
const preuzmiJson = document.getElementById('preuzmiJson');

// Nazivi stupaca dohvaćaju se s backenda.
let stupci = [];

// Prikaz statusne poruke, uz mogućnost označavanja greške.
function postaviStatus(tekst, jeGreska = false) {
  statusEl.textContent = tekst;
  statusEl.classList.toggle('greska', jeGreska);
}

// Priprema parametara pretraživanja i odabranog atributa.
function parametri() {
  const p = new URLSearchParams();
  if (unos.value.trim()) p.set('q', unos.value.trim());
  if (izbornik.value) p.set('polje', izbornik.value);
  return p;
}

// Poveznice za preuzimanje prilagođavaju se trenutno odabranim filtrima.
function azurirajPoveznice(p) {
  for (const [a, format] of [[preuzmiCsv, 'csv'], [preuzmiJson, 'json']]) {
    const s = new URLSearchParams({ format });
    for (const [k, v] of p) s.set(k, v);
    a.href = '/api/podaci/preuzmi?' + s;
  }
}

// Dinamičko stvaranje zaglavlja tablice prema atributima iz baze.
function nacrtajZaglavlje() {
  const tr = document.createElement('tr');
  for (const naziv of stupci) {
    const th = document.createElement('th');
    th.textContent = naziv.replaceAll('_', ' ');
    tr.appendChild(th);
  }
  zaglavlje.replaceChildren(tr);
}

// Stvaranje redaka tablice na temelju podataka dobivenih u JSON formatu.
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

  // Zamjena prethodnih redaka novima.
  tijelo.replaceChildren(fragment);
}

// Dohvaćanje podataka s backenda prema odabranim parametrima.
async function ucitaj() {
  const p = parametri();
  azurirajPoveznice(p);
  postaviStatus('Učitavam podatke…');

  try {
    const odgovor = await fetch('/api/podaci?' + p);
    const podaci = await odgovor.json();

    if (!odgovor.ok) throw new Error(podaci.greska || 'Zahtjev nije uspio.');

    nacrtajRetke(podaci);

    postaviStatus(podaci.length
      ? `Prikazano redaka: ${podaci.length}`
      : 'Nema podataka koji odgovaraju pretrazi. Promijenite pojam ili izbrišite pretragu.');

  } catch (err) {
    tijelo.replaceChildren();
    postaviStatus('Podaci se nisu mogli dohvatiti: ' + err.message, true);
  }
}

// Početno učitavanje atributa i podataka.
async function pokreni() {
  // Stranica mora biti otvorena preko poslužitelja, a ne izravno iz datoteke.
  if (location.protocol === 'file:') {
    postaviStatus('Stranicu otvorite preko poslužitelja: http://localhost:3000/datatable.html (a ne dvostrukim klikom na datoteku).', true);
    return;
  }

  try {
    const odgovor = await fetch('/api/polja');
    stupci = await odgovor.json();

    // Izrada opcija za filtriranje prema dostupnim atributima.
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

// Obrada događaja na formi i elementima za filtriranje.
forma.addEventListener('submit', (e) => {
  e.preventDefault();
  ucitaj();
});

// Brisanje pojma vraća tablicu u početni prikaz.
unos.addEventListener('input', () => {
  if (!unos.value.trim()) ucitaj();
});

izbornik.addEventListener('change', ucitaj);

// Pokretanje aplikacije.
pokreni();
