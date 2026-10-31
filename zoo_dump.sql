--
-- PostgreSQL database dump
--

\restrict 9Th4Qg7N4tpZy893Ca54dBCT26CkzfooPk4gupOOCPBzD0z9SHlrAP5LeqLarU0

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: vrsta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vrsta (
    vrsta_id integer NOT NULL,
    naziv_hrv character varying(100) NOT NULL,
    naziv_lat character varying(100) NOT NULL,
    porodica character varying(100) NOT NULL,
    zivotni_vijek_god integer NOT NULL,
    prehrana character varying(50) NOT NULL,
    podrijetlo character varying(100) NOT NULL,
    ugrozenost character varying(2) NOT NULL,
    CONSTRAINT vrsta_ugrozenost_check CHECK (((ugrozenost)::text = ANY ((ARRAY['LC'::character varying, 'NT'::character varying, 'VU'::character varying, 'EN'::character varying, 'CR'::character varying, 'EW'::character varying, 'EX'::character varying, 'DD'::character varying])::text[]))),
    CONSTRAINT vrsta_zivotni_vijek_god_check CHECK ((zivotni_vijek_god > 0))
);


--
-- Name: vrsta_vrsta_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.vrsta ALTER COLUMN vrsta_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.vrsta_vrsta_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: zivotinja; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zivotinja (
    jedinka_id integer NOT NULL,
    ime character varying(100) NOT NULL,
    datum_rodenja date NOT NULL,
    spol character(1) NOT NULL,
    vrsta_id integer NOT NULL,
    vrt_id integer NOT NULL,
    CONSTRAINT zivotinja_datum_rodenja_check CHECK ((datum_rodenja <= CURRENT_DATE)),
    CONSTRAINT zivotinja_spol_check CHECK ((spol = ANY (ARRAY['M'::bpchar, 'F'::bpchar])))
);


--
-- Name: zivotinja_jedinka_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.zivotinja ALTER COLUMN jedinka_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.zivotinja_jedinka_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: zoo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zoo (
    vrt_id integer NOT NULL,
    naziv character varying(100) NOT NULL,
    grad character varying(100) NOT NULL,
    drzava character varying(100) NOT NULL,
    web_poveznica character varying(255) NOT NULL
);


--
-- Name: zoo_vrt_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.zoo ALTER COLUMN vrt_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.zoo_vrt_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: vrsta; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vrsta (vrsta_id, naziv_hrv, naziv_lat, porodica, zivotni_vijek_god, prehrana, podrijetlo, ugrozenost) FROM stdin;
1	Lav	Panthera leo	Felidae	13	Mesojed	Afrika	VU
2	Tigar	Panthera tigris	Felidae	17	Mesojed	Azija	EN
3	Afrički slon	Loxodonta africana	Elephantidae	65	Biljojed	Afrika	EN
4	Žirafa	Giraffa camelopardalis	Giraffidae	23	Biljojed	Afrika	VU
5	Crvena panda	Ailurus fulgens	Ailuridae	14	Biljojed	Azija	EN
6	Humboldtov pingvin	Spheniscus humboldti	Spheniscidae	18	Mesojed	Južna Amerika	VU
7	Merkat	Suricata suricatta	Herpestidae	16	Svejed	Afrika	LC
8	Crveni klokan	Osphranter rufus	Macropodidae	17	Biljojed	Australija	LC
9	Kineski leopard	Panthera pardus japonensis	Felidae	22	Mesojed	Azija	VU
10	Zapadna nizinska gorila	Gorilla gorilla gorilla	Hominidae	45	Biljojed	Afrika	CR
11	Smeđi medvjed	Ursus arctos	Ursidae	40	Svejed	Europa	LC
\.


--
-- Data for Name: zivotinja; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.zivotinja (jedinka_id, ime, datum_rodenja, spol, vrsta_id, vrt_id) FROM stdin;
1	Uganda	2018-06-12	M	1	1
2	Tayra	2019-09-03	F	1	1
3	Tara	2019-11-02	F	2	3
4	Raj	2017-08-10	M	2	2
5	Balu	2016-09-25	M	3	3
6	Nela	2015-06-18	F	3	1
7	Zara	2014-06-04	F	4	3
8	Milo	2021-01-30	M	5	3
9	Luna	2022-07-17	F	5	1
10	Kiki	2020-02-14	F	6	2
11	Pablo	2018-12-05	M	6	1
12	Miki	2021-06-08	M	7	3
13	Roko	2017-10-19	M	8	2
14	Tadzik	2018-04-20	M	9	1
15	Odilia	2019-02-11	F	9	1
16	Koko	2006-08-15	M	10	3
17	Albert	2014-05-23	M	11	1
18	Kveta	2015-03-17	F	11	1
\.


--
-- Data for Name: zoo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.zoo (vrt_id, naziv, grad, drzava, web_poveznica) FROM stdin;
1	Zoološki vrt Grada Zagreba	Zagreb	Hrvatska	https://zoo.hr
2	Zoološki vrt Ljubljana	Ljubljana	Slovenija	https://www.zoo.si
3	Tiergarten Schönbrunn	Beč	Austrija	https://www.zoovienna.at
\.


--
-- Name: vrsta_vrsta_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vrsta_vrsta_id_seq', 11, true);


--
-- Name: zivotinja_jedinka_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.zivotinja_jedinka_id_seq', 18, true);


--
-- Name: zoo_vrt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.zoo_vrt_id_seq', 3, true);


--
-- Name: vrsta vrsta_naziv_lat_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vrsta
    ADD CONSTRAINT vrsta_naziv_lat_key UNIQUE (naziv_lat);


--
-- Name: vrsta vrsta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vrsta
    ADD CONSTRAINT vrsta_pkey PRIMARY KEY (vrsta_id);


--
-- Name: zivotinja zivotinja_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zivotinja
    ADD CONSTRAINT zivotinja_pkey PRIMARY KEY (jedinka_id);


--
-- Name: zoo zoo_naziv_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoo
    ADD CONSTRAINT zoo_naziv_key UNIQUE (naziv);


--
-- Name: zoo zoo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoo
    ADD CONSTRAINT zoo_pkey PRIMARY KEY (vrt_id);


--
-- Name: zoo zoo_web_poveznica_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zoo
    ADD CONSTRAINT zoo_web_poveznica_key UNIQUE (web_poveznica);


--
-- Name: zivotinja zivotinja_vrsta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zivotinja
    ADD CONSTRAINT zivotinja_vrsta_id_fkey FOREIGN KEY (vrsta_id) REFERENCES public.vrsta(vrsta_id);


--
-- Name: zivotinja zivotinja_vrt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zivotinja
    ADD CONSTRAINT zivotinja_vrt_id_fkey FOREIGN KEY (vrt_id) REFERENCES public.zoo(vrt_id);


--
-- PostgreSQL database dump complete
--

\unrestrict 9Th4Qg7N4tpZy893Ca54dBCT26CkzfooPk4gupOOCPBzD0z9SHlrAP5LeqLarU0

