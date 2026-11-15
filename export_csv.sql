COPY (
  SELECT
    v.id         AS id,
    v.hrvatski_naziv        AS "Hrvatski_naziv",
    v.latinski_naziv        AS "Latinski_naziv",
    v.porodica         AS "Porodica",
    v.zivotni_vijek_god AS "Zivotni_vijek_god",
    v.prehrana         AS "Prehrana",
    v.podrijetlo       AS "Podrijetlo",
    v.ugrozenost       AS "Ugrozenost",
    z.ime              AS "Ime",
    z.datum_rodenja    AS "Datum_rodenja",
    z.spol             AS "Spol",
    zo.naziv           AS "Zoo_naziv",
    zo.grad            AS "Zoo_grad",
    zo.drzava          AS "Zoo_drzava",
    zo.web_poveznica   AS "Zoo_web_poveznica"
  FROM vrsta v
  LEFT JOIN zivotinja z ON z.vrsta_id = v.id
  LEFT JOIN zoo zo ON zo.vrt_id = z.vrt_id
  ORDER BY v.id, z.jedinka_id
) TO STDOUT WITH (FORMAT csv, HEADER, ENCODING 'UTF8');
