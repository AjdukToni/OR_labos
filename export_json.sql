SELECT json_agg(
  json_build_object(
    'id', v.id,
    'Hrvatski_naziv', v.hrvatski_naziv,
    'Latinski_naziv', v.latinski_naziv,
    'Porodica', v.porodica,
    'Zivotni_vijek_god', v.zivotni_vijek_god,
    'Prehrana', v.prehrana,
    'Podrijetlo', v.podrijetlo,
    'Ugrozenost', v.ugrozenost,
    'Zivotinje', COALESCE((
      SELECT json_agg(
        json_build_object(
          'Ime', z.ime,
          'Datum_rodenja', z.datum_rodenja,
          'Spol', z.spol,
          'Zoo', json_build_object(
            'Naziv', zo.naziv,
            'Grad', zo.grad,
            'Drzava', zo.drzava,
            'Web_poveznica', zo.web_poveznica
          )
        ) ORDER BY z.jedinka_id
      )
      FROM zivotinja z
      JOIN zoo zo ON zo.vrt_id = z.vrt_id
      WHERE z.vrsta_id = v.id
    ), '[]'::json)
  ) ORDER BY v.id
)
FROM vrsta v;