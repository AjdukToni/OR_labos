# Zoološki vrtovi

Otvoreni skup podataka o životinjskim vrstama, pojedinim životinjskim jedinkama i zoološkim vrtovima u kojima žive. Izrađen je za laboratorijsku vježbu iz kolegija Otvoreno računarstvo (FER, Sveučilište u Zagrebu).

## Opis skupa podataka

Skup opisuje 11 životinjskih vrsta (npr. lav, tigar, afrički slon, žirafa, crvena panda), 18 životinjskih jedinki i 3 zoološka vrta (Zagreb, Ljubljana i Beč). Za svaku vrstu navedeni su porodica, prosječni životni vijek, prehrana, podrijetlo i status ugroženosti prema IUCN-ovoj Crvenoj listi. Uz vrstu je naveden popis jedinki koje joj pripadaju, a uz svaku jedinku zoološki vrt u kojem živi.

Podaci su modelirani kao veza roditelj-dijete: jedna vrsta ima više jedinki, a jedan zoološki vrt drži više jedinki. U JSON-u je vrsta glavni objekt, jedinke su ugniježđena lista, a zoološki vrt ugniježđeni objekt uz svaku jedinku. U CSV-u se podaci o vrsti ponavljaju u svakom retku jedinke.

Napomena: podaci o vrstama temelje se na javno dostupnim izvorima. Imena jedinki, datumi rođenja i njihov smještaj u pojedinim vrtovima su ilustrativni i ne odgovaraju stvarnim vrtovima.

## Metapodaci

- **Naziv skupa:** Zoološki vrtovi
- **Autor:** Toni Ajduk
- **Verzija:** 1.0
- **Licencija:** Creative Commons Imenovanje 4.0 međunarodna (CC BY 4.0)
- **Jezik podataka:** hrvatski
- **Formati:** JSON, CSV
- **Kodiranje znakova:** UTF-8
- **Broj vrsta (objekata u JSON-u):** 11
- **Broj jedinki (redaka u CSV-u, bez zaglavlja):** 18
- **Broj zooloških vrtova:** 3
- **Broj atributa:** 14 (uz identifikator **id** vrste)
- **Datum izrade:** 2026-10-31
- **Baza podataka:** PostgreSQL
- **Izvori:** IUCN Red List (status ugroženosti), javno dostupni opisi vrsta, web stranice zooloških vrtova
- **Vrsta skupa:** Katalog entiteta

## Datoteke u repozitoriju

- **zoo_vrtovi.json:** skup podataka u formatu JSON (vrste s ugniježđenim jedinkama i vrtom)
- **zoo_vrtovi.csv:** skup podataka u formatu CSV (plošna tablica)
- **zoo_dump.sql:** dump PostgreSQL baze sa strukturom i podacima
- **LICENSE:** tekst licencije

## Opis atributa

Nazivi atributa jednaki su ključevima u JSON-u, odnosno stupcima u CSV-u.

### Vrsta

- **vrsta_id:** jedinstveni identifikator vrste
- **naziv_hrv:** naziv vrste životinje na hrvatskom jeziku
- **naziv_lat:** znanstveni (latinski) naziv vrste, jedinstven za svaku vrstu
- **Porodica:** taksonomska porodica kojoj vrsta pripada
- **Zivotni_vijek_god:** prosječni životni vijek vrste u godinama
- **Prehrana:** način prehrane (Mesojed, Biljojed ili Svejed)
- **Podrijetlo:** kontinent ili područje podrijetla vrste
- **Ugrozenost:** status ugroženosti prema IUCN Crvenoj listi (kôd, vidi ispod)

### Životinja (jedinka)

U JSON-u su ovi atributi u listi **Zivotinje**, a u CSV-u su zasebni stupci.

- **jedinka_id:** jedinstveni identifikator jedinke
- **Ime:** ime životinjske jedinke
- **Datum_rodenja:** datum rođenja jedinke u formatu GGGG-MM-DD
- **Spol:** spol jedinke (M za mužjaka, F za ženku)

### Zoološki vrt

U JSON-u su ovi atributi u objektu **Zoo** unutar svake jedinke. U CSV-u se stupci zovu **Zoo_naziv**, **Zoo_grad**, **Zoo_drzava** i **Zoo_web_poveznica**.

- **vrt_id:** jedinstveni identifikator zoološkog vrta
- **Naziv:** naziv zoološkog vrta
- **Grad:** grad u kojem se zoološki vrt nalazi
- **Drzava:** država u kojoj se zoološki vrt nalazi
- **Web_poveznica:** adresa web stranice zoološkog vrta

### Kodovi statusa ugroženosti (IUCN)

- **LC:** najmanja zabrinutost (Least Concern)
- **NT:** gotovo ugrožena (Near Threatened)
- **VU:** ranjiva (Vulnerable)
- **EN:** ugrožena (Endangered)
- **CR:** kritično ugrožena (Critically Endangered)
- **EW:** izumrla u divljini (Extinct in the Wild)
- **EX:** izumrla (Extinct)
- **DD:** nedovoljno podataka (Data Deficient)

**Licencija**

Ovaj skup podataka dostupan je pod licencijom Creative Commons Imenovanje 4.0 međunarodna (CC BY 4.0). Dopušteno je slobodno kopirati, dijeliti i prilagođavati podatke, uz obvezno navođenje autora (Toni Ajduk).