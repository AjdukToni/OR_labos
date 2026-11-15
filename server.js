// =====================================================================
// server.js – backend za skup otvorenih podataka o zoološkim vrtovima
//
// Poslužitelj radi četiri stvari:
//   1. poslužuje statične stranice iz mape public/ (index.html, datatable.html...)
//   2. poslužuje cjelovite datoteke skupa (CSV, JSON, schema) s datotečnog sustava
//   3. izlaže API za filtriranje podataka iz PostgreSQL baze (za tablicu)
//   4. izlaže API za preuzimanje filtriranog prikaza u CSV-u i JSON-u
// =====================================================================

// dotenv učitava varijable iz datoteke .env (lozinka baze, port...) u process.env,
// tako da osjetljivi podaci ne moraju biti upisani u kôd niti na git.
require('dotenv').config();

const path = require('path');          // pomoć pri slaganju putanja do datoteka
const express = require('express');    // web okvir: usmjeravanje (routing) i HTTP odgovori
const { Pool } = require('pg');        // klijent za PostgreSQL s "bazenom" veza

const app = express();

// Pool drži nekoliko otvorenih veza prema bazi i dijeli ih među zahtjevima
// (brže nego otvarati novu vezu za svaki zahtjev). Bez argumenata sam čita
// varijable PGHOST, PGPORT, PGUSER, PGPASSWORD i PGDATABASE iz okoline (.env).
const pool = new Pool();

// Ako se neka mirna veza prekine, pg emitira "error". Bez ovog slušatelja
// bi neuhvaćena greška srušila cijeli poslužitelj. Ovako je samo zapišemo.
pool.on('error', (err) => console.error('Pogreška u vezi s bazom:', err.message));

const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------
// Popis atributa plošnog prikaza
// ---------------------------------------------------------------------
// Ključ  = naziv atributa onako kako ga vidi korisnik (isto kao stupci u CSV-u).
// Vrijednost = SQL izraz kojim taj atribut dohvaćamo iz baze
//   (v = vrsta, z = zivotinja, zo = zoo – aliasi iz upita niže).
//
// Ovo je ujedno "bijela lista" (whitelist): korisnik šalje samo naziv atributa,
// a stvarni SQL dolazi iz ovog objekta. Tako se u upit nikad ne ubacuje tekst
// koji je poslao korisnik, što sprječava SQL injection u nazivima stupaca.
const POLJA = {
  id: 'v.id',
  Hrvatski_naziv: 'v.hrvatski_naziv',
  Latinski_naziv: 'v.latinski_naziv',
  Porodica: 'v.porodica',
  Zivotni_vijek_god: 'v.zivotni_vijek_god',
  Prehrana: 'v.prehrana',
  Podrijetlo: 'v.podrijetlo',
  Ugrozenost: 'v.ugrozenost',
  Ime: 'z.ime',
  // Datum pretvaramo u tekst u bazi. Da ga vrati kao JS Date objekt, pomak
  // vremenske zone mogao bi promijeniti dan (npr. 2018-06-12 -> 2018-06-11).
  Datum_rodenja: "to_char(z.datum_rodenja, 'YYYY-MM-DD')",
  Spol: 'z.spol',
  Zoo_naziv: 'zo.naziv',
  Zoo_grad: 'zo.grad',
  Zoo_drzava: 'zo.drzava',
  Zoo_web_poveznica: 'zo.web_poveznica',
};
// Popis samih naziva atributa, redoslijedom kojim se ispisuju u tablici i CSV-u.
const IMENA_POLJA = Object.keys(POLJA);

// ---------------------------------------------------------------------
// Vlastita greška za neispravan zahtjev
// ---------------------------------------------------------------------
// Nosi HTTP status 400 (Bad Request). Rukovatelj pogreškama na dnu datoteke
// po svojstvu status razlikuje greške korisnika (4xx) od grešaka poslužitelja (5xx).
class GreskaZahtjeva extends Error {
  constructor(poruka) {
    super(poruka);
    this.status = 400;
  }
}

// ---------------------------------------------------------------------
// Čitanje i provjera parametara filtra iz URL-a
// ---------------------------------------------------------------------
// Očekuje: ?q=tekst&polje=NazivAtributa
//   q     – pojam koji tražimo (prazno = nema filtra)
//   polje – atribut po kojem tražimo (prazno = svi atributi, tzv. wildcard)
function procitajUpit(req) {
  // "?? ''" osigurava prazan string ako parametar uopće nije poslan;
  // String() sprječava neočekivane tipove (npr. polje poslano kao niz).
  const q = String(req.query.q ?? '').trim();
  const polje = String(req.query.polje ?? '').trim();

  if (q.length > 200) {
    throw new GreskaZahtjeva('Pojam za pretragu je predug (najviše 200 znakova).');
  }
  // hasOwnProperty umjesto "polje in POLJA" jer bi "in" prihvatio i ugrađena
  // svojstva objekata poput "constructor" ili "toString".
  if (polje && !Object.prototype.hasOwnProperty.call(POLJA, polje)) {
    throw new GreskaZahtjeva(`Nepoznati atribut "${polje}". Dopušteni: ${IMENA_POLJA.join(', ')}.`);
  }
  return { q, polje };
}

// ---------------------------------------------------------------------
// Dohvat podataka iz baze
// ---------------------------------------------------------------------
// Vraća "plošne" retke: jedan redak po jedinki, uz ponovljene podatke o vrsti
// i vrtu (jednako kao u zoo_vrtovi.csv).
async function dohvatiPodatke(q, polje) {
  // Gradimo popis oblika: v.id AS "id", v.hrvatski_naziv AS "Hrvatski_naziv", ...
  // AS "..." osigurava da JS dobije objekte s ključevima iz POLJA (s velikim slovima).
  const select = IMENA_POLJA.map((n) => `${POLJA[n]} AS "${n}"`).join(', ');

  // LEFT JOIN (a ne običan JOIN) čuva i vrste koje nemaju niti jednu jedinku:
  // one se vraćaju s NULL vrijednostima u stupcima jedinke i vrta.
  let sql =
    `SELECT ${select} FROM vrsta v ` +
    'LEFT JOIN zivotinja z ON z.vrsta_id = v.id ' +
    'LEFT JOIN zoo zo ON zo.vrt_id = z.vrt_id';
  const params = []; // vrijednosti koje se šalju bazi odvojeno od teksta upita

  if (q) {
    // U SQL operatoru LIKE znakovi % i _ imaju posebno značenje (bilo koji niz,
    // bilo koji znak), a \ je znak za izbjegavanje. Ako ih korisnik upiše,
    // stavljamo ispred njih \ da se traže doslovno ("100%" ne smije značiti "100 i bilo što").
    // Okolo dodajemo %...% da tražimo pojam bilo gdje u vrijednosti.
    params.push(`%${q.replace(/[\\%_]/g, '\\$&')}%`);

    // Ako je odabran atribut, tražimo samo u njemu; inače u svima (wildcard).
    const poljaZaPretragu = polje ? [polje] : IMENA_POLJA;

    // ::text pretvara i brojeve (id, životni vijek) u tekst da ih ILIKE može usporediti.
    // ILIKE = LIKE bez razlikovanja velikih i malih slova (lav = Lav).
    // $1 je rezervirano mjesto za prvu vrijednost iz params. Baza vrijednost
    // tretira isključivo kao podatak, nikad kao dio naredbe (zaštita od SQL injectiona).
    // Isti $1 koristimo za sve stupce, povezane s OR.
    sql += ' WHERE ' + poljaZaPretragu.map((n) => `${POLJA[n]}::text ILIKE $1`).join(' OR ');
  }

  // Stabilan redoslijed: po vrsti, pa po jedinki unutar vrste.
  sql += ' ORDER BY v.id, z.jedinka_id';

  const { rows } = await pool.query(sql, params);
  return rows;
}

// ---------------------------------------------------------------------
// Pretvorba plošnih redaka u ugniježđeni JSON
// ---------------------------------------------------------------------
// Oblik izlaza jednak je zoo_vrtovi.json: vrsta ima listu Zivotinje,
// a svaka jedinka objekt Zoo. Time je preuzeti JSON usklađen s JSON Schemom.
function uJsonStrukturu(redci) {
  // Map pamti redoslijed ubacivanja i omogućuje brzo traženje vrste po id-u.
  const vrste = new Map();

  for (const r of redci) {
    // Prvi put kad vidimo vrstu, stvaramo njezin objekt s praznom listom jedinki.
    if (!vrste.has(r.id)) {
      vrste.set(r.id, {
        id: r.id,
        Hrvatski_naziv: r.Hrvatski_naziv,
        Latinski_naziv: r.Latinski_naziv,
        Porodica: r.Porodica,
        Zivotni_vijek_god: r.Zivotni_vijek_god,
        Prehrana: r.Prehrana,
        Podrijetlo: r.Podrijetlo,
        Ugrozenost: r.Ugrozenost,
        Zivotinje: [],
      });
    }
    // Ime je NULL ako vrsta nema jedinke (rezultat LEFT JOIN-a) – tada ništa ne dodajemo.
    // Kod filtra po atributu jedinke u listi ostaju samo jedinke koje se podudaraju,
    // što i želimo: preuzima se upravo ono što je prikazano u tablici.
    if (r.Ime !== null) {
      vrste.get(r.id).Zivotinje.push({
        Ime: r.Ime,
        Datum_rodenja: r.Datum_rodenja,
        Spol: r.Spol,
        Zoo: {
          Naziv: r.Zoo_naziv,
          Grad: r.Zoo_grad,
          Drzava: r.Zoo_drzava,
          Web_poveznica: r.Zoo_web_poveznica,
        },
      });
    }
  }
  return [...vrste.values()]; // Map -> obično polje objekata
}

// ---------------------------------------------------------------------
// Pretvorba plošnih redaka u CSV
// ---------------------------------------------------------------------
// Stupci su isti kao u zoo_vrtovi.csv. CSV format (RFC 4180) traži da vrijednosti
// sa zarezom, navodnikom ili prelaskom u novi red budu u dvostrukim navodnicima,
// a navodnik unutar vrijednosti se udvostručuje ("" ).
function uCsv(redci) {
  const escape = (v) => {
    if (v === null || v === undefined) return ''; // NULL postaje prazno polje
    const s = String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const linije = [IMENA_POLJA.join(',')]; // prvi redak je zaglavlje
  for (const r of redci) {
    linije.push(IMENA_POLJA.map((n) => escape(r[n])).join(','));
  }
  return linije.join('\n') + '\n';
}

// =====================================================================
// API krajnje točke
// =====================================================================

// Vraća popis naziva atributa. Frontend ga koristi za izgradnju zaglavlja
// tablice i padajućeg izbornika, pa se nazivi ne moraju dupliciti u HTML-u.
app.get('/api/polja', (req, res) => {
  res.json(IMENA_POLJA);
});

// Podaci za tablicu. Primjeri:
//   /api/podaci                                   -> svi podaci (početni prikaz)
//   /api/podaci?q=lav                             -> pretraga po svim atributima
//   /api/podaci?q=zagreb&polje=Zoo_grad           -> pretraga samo po jednom atributu
// Express 4 ne hvata greške iz async funkcija sam, pa ih ručno proslijeđujemo
// s next(err) u rukovatelj pogreškama na kraju datoteke.
app.get('/api/podaci', async (req, res, next) => {
  try {
    const { q, polje } = procitajUpit(req);
    res.json(await dohvatiPodatke(q, polje)); // res.json postavlja Content-Type: application/json
  } catch (err) {
    next(err);
  }
});

// Preuzimanje trenutno filtriranog prikaza kao datoteke:
//   /api/podaci/preuzmi?format=csv&q=lav&polje=Hrvatski_naziv
app.get('/api/podaci/preuzmi', async (req, res, next) => {
  try {
    const format = String(req.query.format ?? '').toLowerCase();
    if (format !== 'csv' && format !== 'json') {
      throw new GreskaZahtjeva('Parametar "format" mora biti "csv" ili "json".');
    }
    const { q, polje } = procitajUpit(req);
    const redci = await dohvatiPodatke(q, polje);

    // Content-Disposition: attachment govori pregledniku da ponudi spremanje
    // datoteke umjesto da je prikaže u prozoru, i predlaže naziv datoteke.
    res.setHeader('Content-Disposition', `attachment; filename="zoo_vrtovi_filtrirano.${format}"`);
    if (format === 'csv') {
      res.type('text/csv; charset=utf-8').send(uCsv(redci));
    } else {
      // JSON.stringify(..., null, 2) daje uredan ispis s uvlakama od 2 razmaka.
      res.type('application/json; charset=utf-8').send(JSON.stringify(uJsonStrukturu(redci), null, 2));
    }
  } catch (err) {
    next(err);
  }
});

// Sve ostalo što počinje s /api, a nije definirano gore, vraća JSON poruku
// i status 404 umjesto Expressove zadane HTML stranice s greškom.
app.use('/api', (req, res) => {
  res.status(404).json({ greska: 'Krajnja točka ne postoji.' });
});

// =====================================================================
// Cjeloviti skup podataka s datotečnog sustava
// =====================================================================
// Datoteke se poslužuju iz korijena projekta (gdje ih stvara export.sh).
// Zadatak traži da se one poslužuju s datotečnog sustava, a ne generiraju iz baze.
// Namjerno ne koristimo express.static na cijelom korijenu projekta jer bi to
// izložilo i server.js i .env (s lozinkom). Poslužujemo samo ove tri datoteke.
for (const datoteka of ['zoo_vrtovi.csv', 'zoo_vrtovi.json', 'schema.json']) {
  app.get('/' + datoteka, (req, res, next) => {
    // Ako datoteka ne postoji, sendFile vraća grešku sa statusom 404,
    // koju preuzima rukovatelj pogreškama.
    // CSV i JSON šaljemo uz zaglavlje Content-Disposition: attachment da ih preglednik
    // preuzme umjesto da ih otvori u prozoru. schema.json ostaje otvoriv u pregledniku.
    const opcije = datoteka === 'schema.json'
      ? {}
      : { headers: { 'Content-Disposition': `attachment; filename="${datoteka}"` } };
    res.sendFile(path.join(__dirname, datoteka), opcije, (err) => err && next(err));
  });
}

// =====================================================================
// Statične stranice (HTML, CSS, JS) iz mape public/
// =====================================================================
// Redoslijed je bitan: API i datoteke su definirani prije, pa im ova linija
// ne može "prekriti" putanje. Zahtjev za / vraća public/index.html.
app.use(express.static(path.join(__dirname, 'public')));

// =====================================================================
// Središnja obrada pogrešaka
// =====================================================================
// Express prepoznaje rukovatelja pogreškama po tome što ima četiri parametra.
// Svaka greška proslijeđena s next(err) završava ovdje, pa poslužitelj ne pada
// i korisnik ne vidi tehničke poruke radnog okvira.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err); // odgovor je već počeo, prepusti Expressu

  const status = err.status || 500; // 400 za GreskaZahtjeva, 404 za nepostojeću datoteku, inače 500
  if (status >= 500) console.error(err); // prave greške zapisujemo u konzolu poslužitelja

  res.status(status).json({
    // Za greške poslužitelja korisniku šaljemo samo opću poruku. Detalji
    // (npr. tekst SQL greške) ostaju u konzoli i ne otkrivaju strukturu baze.
    greska: status >= 500 ? 'Došlo je do pogreške na poslužitelju.' : err.message,
  });
});

// Pokretanje poslužitelja na zadanom portu.
app.listen(PORT, () => {
  console.log(`Poslužitelj radi na http://localhost:${PORT}`);
});