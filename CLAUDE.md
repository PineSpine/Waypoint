# Der Kartentisch — Projektgedächtnis

> Single-File-Webapp zur Routenplanung für eine Bikepacking-Tour Hannover → Berchtesgaden.
> Diese Datei ist die Kurzfassung der wichtigsten Eckdaten — nicht der komplette Chatverlauf.

## Kommunikation
- **Sprache: Deutsch.** Ton: direkt, sachkundig, auf Augenhöhe — keine Bevormundung.
- **Ehrlichkeit vor Schönwetter:** technische Grenzen offen benennen. Sichtbare Fallbacks sind erwünscht, stille Fehlschläge sind tabu.

## Die Tour
- Hannover → Weimar (Ruhetag) → Berchtesgaden, **20.–31.07.2026**, ~9 Fahrtage + 1 Ruhetag.
- ~80–100 km/Tag, **Gravelbike Stevens Prestige (GRX)**, ~20 kg Gepäck, überwiegend Campingplätze.
- **Korridor (Flusstäler, gute Versorgung):** Saale → Main → Altmühltal → Donau → Salzach.
  Fernradweg-Rückgrat: Leine-Heide-Radweg, Thüringer Städtekette, Ilmtal-/Saale-Radweg,
  Main-Radweg, Regnitz-Radweg, Altmühltal-Radweg, Donau-Radweg, Salzhandelsweg/Saalachtal.
- **Zwei offene Lückenschlüsse:** (1) Saalfeld → Lichtenfels (Wasserscheide/Frankenwald),
  (2) Donau → Burghausen (Connector). Beide ehrlich als „Gap" behandeln.

## Die App
- **Eine einzige, selbst-enthaltene HTML-Datei:** `kartentisch.html`. Kein Build-Step.
- **Stack:** Leaflet 1.9.4 (nur via cdnjs), OSM-Basiskarte + OpenTopoMap-Umschalter,
  Waymarked-Trails-Radnetz-Overlay (default aus). Fonts: Onest + DM Mono (Google Fonts).
- **Persistenz via `localStorage`** (Key `waypoint_route_v1`): expliziter Speichern-Button
  (`saveState`) sichert Wegpunkte inkl. `legProfile`, globales Profil, Nogos, POIs, Ebenen,
  Steigungsmodus und Kartenausschnitt; beim Start lädt `loadState()` diesen Stand bevorzugt,
  sonst das PRESET. (Früher galt „kein localStorage" — bewusst aufgehoben für den Save-Button.)
  Bei `file://` kann der Browser localStorage sperren → sichtbarer Fehlerstatus.
- **Stil: „Liquid Glass"** — frostige, transluzente Panels, `backdrop-filter` blur+saturate,
  Blau/Weiß-Palette. Akzent `#0a84ff` / `#0060df`, Routenlinie `#1f6fff`.
- **19-Wegpunkte-Preset** des Gesamtkorridors ist im JS am Dateiende eingebettet (`PRESET`).
- Funktionen: Klick-Wegpunkte (ziehbar), debounctes Re-Routing, Etappen-Marker alle X km,
  Overpass-Loader (Camping/Supermarkt/Wasser/Radladen mit Google-Maps-Links),
  GPX-Import (Drag&Drop) + GPX-Export, Steigungscodierung, No-Go-Kreise, POIs, Bewegungsradius.
- **Abschnitts-Profile (per-Abschnitt-Routing):** Override lebt am Start-Wegpunkt eines Teilstücks
  (`w.legProfile`), nicht per Index → robust gegen Einfügen/Löschen/Undo. Auswahl via Toolbar-Modus
  „Abschnitts-Profil" *oder* Strg+Klick auf Marker; bei aktiver Auswahl (≥2 Punkte) gilt das
  Profil-Dropdown nur für den Abschnitt, global bleibt. Routing zerlegt die Route in Läufe gleicher
  effektiver Engine (`buildRuns`/`doSegmentedRoute`), routet jeden Lauf einzeln und näht die
  Geometrie zusammen (doppelter Nahtpunkt verworfen). Nur aktiv, wenn `hasOverrides()`.

## Routing-Engines (hart erarbeitetes Wissen — bitte beachten)
- **① BRouter.de (Primär, verifiziert):** GET `https://brouter.de/brouter`, **CORS offen**.
  Profile `trekking`/`fastbike`/`shortest`. Antwort-Geometrie: `features[0].geometry.coordinates`
  als `[lon, lat, ele]`; Properties `track-length` (m) und `filtered ascend` (m).
  Nogos: `&nogos=lng,lat,radius|...`.
- **② bikerouter-Gravel (quaelnix):** Backend `brouter.m11n.de` **blockt CORS** aus der App.
  **Workaround:** echtes `quaelnix-gravel`-Profil zur Laufzeit laden und als Custom-Profil
  auf den CORS-offenen BRouter.de-Server hochladen (POST
  `https://brouter.de/brouter/profile/custom_<timestamp>`, `Content-Type: text/plain`),
  dann mit `profile=custom_<id>` routen.
  *Caveat:* Upload-POST-CORS auf brouter.de aus reiner Browser-App nicht 100% garantiert →
  sichtbarer Fallback auf BRouter.de/Trekking. **Kugelsicher** bleibt: auf bikerouter.de planen
  → GPX exportieren → in die App ziehen.
- **③ GraphHopper (Komoots Engine, eigener Free-Key):** `https://graphhopper.com/api/1/route`,
  `points_encoded=false&elevation=true`. Antwort: `paths[0].points.coordinates` `[lon,lat,ele]`,
  `distance` (m), `ascend` (m). **Free-Tier-Limits:** max. **5 Punkte/Request**, Profile nur
  **`car`/`bike`/`foot`** (kein mtb/racingbike). Deshalb: lange Routen in überlappende
  5-Punkt-Häppchen zerlegen, sequenziell holen, Geometrien zusammenfügen (doppelten Nahtpunkt
  verwerfen), Distanz/Höhenmeter summieren. Engine-Auswahl im Dropdown als `engine|profile`.

## Konventionen / Vorlieben
- **Toolleisten-Funktionsreihenfolge NICHT ändern** — nur Styling. Aktuelle Reihenfolge:
  Zoom In · Zoom Out · Standort · Suche · Route zeichnen · Wegpunkt einfügen · Route umkehren ·
  Abschnitts-Profil · No-Go-Kreis · Bewegungsradius (ohne Gewähr) · letzten Punkt löschen ·
  Routendaten speichern · Routendaten löschen · POI · Steigungscodierung ·
  letzte Aktion rückgängig · Transparenz-Slider.
- Hauptpanel und Toolleiste: beide **frei verschiebbar und einklappbar**.
- Keine redundanten Bedienelemente doppeln (z. B. „Route leeren" lebt in der Toolleiste, nicht im Panel).
- Funktionalität bei Restyles erhalten.

## Validierungs-Workflow (jede Iteration)
1. Letzten inline-`<script>`-Block extrahieren (Regex, gefiltert auf eindeutige Funktion wie `addWaypoint`).
2. `node --check` auf den extrahierten JS-Code (Syntaxcheck).
3. Div-Balance prüfen: Body-Markup zwischen `</style>` und `<script` isolieren, `<div\b` vs. `</div>` zählen.
4. Erst dann ausliefern.

## Offen / als Nächstes
- Lückenschlüsse Saalfeld→Lichtenfels und Donau→Burghausen sauber routen.
- Weiteres Iterieren an der App, Richtung Tour.
