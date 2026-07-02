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
- **Responsive (Desktop + Mobile in EINER Datei):** Media-Queries `@media (max-width:640px)` +
  `@media (pointer:coarse)`. Auf dem Phone: Hauptpanel = **Bottom-Sheet** (max. 40vh, per Wischen
  am Kopf auf-/zuziehen — hoch=auf, runter=zu, Tipp=umschalten; kein +/-Button), Toolbar =
  horizontale, eingerückte Wisch-Leiste oben (Scroll-Fade rechts). **Long-Press auf Toolbar-Icons**
  zeigt die Beschriftung (`#tbTip`, Touch-Ersatz fürs Hover; unterdrückt die Aktion bei langem Halten).
  Profil-Dropdown-Labels sind kompakt (Emoji + Kurzname; Details im „kurz erklärt"-Hinweis).
  Panel-Ziehen ist auf dem Phone deaktiviert (`makeDraggable` bricht bei
  `matchMedia('(max-width:640px)')` ab). Arbeit läuft auf
  Branch **`mobile`**; Desktop-Stand als Backup unter `Backup/`. Siehe Memory `mobile-pwa-direction`.
- **PWA:** `manifest.webmanifest` (relative Pfade → GitHub-Pages-Unterpfad-fest), `sw.js`
  (Service-Worker: HTML=network-first → nie veraltet, Assets=cache-first, CDN=stale-while-revalidate),
  Icons `icon.svg` + `icon-192/512-.png` + `icon-maskable-512.png` (per Browser-Canvas gerastert;
  PNG-Icons per `!`-Ausnahme in `.gitignore` freigegeben). SW registriert nur über https/localhost.
  **Live via GitHub Pages:** Repo `PineSpine/Waypoint` (Branch `master`, öffentlich), URL
  <https://pinespine.github.io/Waypoint/> (`index.html` leitet auf `kartentisch.html`). `git push`
  auf `master` aktualisiert die Live-Seite automatisch (~1 Min).
- **Stack:** Leaflet 1.9.4 (nur via cdnjs), OSM-Basiskarte + OpenTopoMap-Umschalter,
  Waymarked-Trails-Radnetz-Overlay (default aus), **dynamischer Maßstab** (`L.control.scale`,
  rechts unten links neben der Legende). Fonts: Onest + DM Mono (Google Fonts).
- **Persistenz via `localStorage`** (Key `waypoint_route_v1`): expliziter Speichern-Button
  (`saveState`) sichert Wegpunkte inkl. `legProfile`+`lock`, globales Profil, Nogos, POIs, Ebenen,
  Steigungsmodus, `tune` und Kartenausschnitt; beim Start lädt `loadState()` diesen Stand bevorzugt,
  sonst das PRESET. Serialisierung zentral in `buildStateObject()`/`applyStateObject()` (von
  Save/Load **und** Datei-Export/Import geteilt → Format kann nie divergieren).
  **Beim Laden immer `fitBounds` auf die ganze Route** (≈ ganz Deutschland), der gespeicherte Zoom
  wird bewusst ignoriert. Bei `file://` kann der Browser localStorage sperren → sichtbarer Fehlerstatus.
- **Geräte-Sync (Desktop ↔ Handy):** localStorage ist pro Origin+Gerät → kein Auto-Abgleich.
  Panel-Sektion „Geräte-Sync": `exportState()` schreibt den KOMPLETTEN Stand als `.json`,
  `importStateText()` liest ihn (leert per `clearAll`, wendet an, auto-speichert). Anders als GPX
  gehen dabei `legProfile`/`lock`/`tune` NICHT verloren.
- **Stil: „Liquid Glass"** — frostige, transluzente Panels, `backdrop-filter` blur+saturate,
  Blau/Weiß-Palette. Akzent `#0a84ff` / `#0060df`, Routenlinie `#1f6fff`.
- **19-Wegpunkte-Preset** des Gesamtkorridors ist im JS am Dateiende eingebettet (`PRESET`).
- Funktionen: Klick-Wegpunkte (ziehbar), debounctes Re-Routing, Etappen-Marker alle X km,
  Overpass-Loader (Camping/Supermarkt/Wasser/Radladen mit Google-Maps-Links),
  GPX-Import (Drag&Drop) + GPX-Export, Steigungscodierung, No-Go-Kreise, POIs, Bewegungsradius.
- **Profil-Feinabstimmung (`tune`):** BRouter akzeptiert Profil-Parameter direkt in der URL
  (`&profile:<name>=<wert>`, von brouter.de unterstützt, ohne Upload/Key). `tuneParam(profile,t)`
  hängt sie nur an Standard-`trekking`/`fastbike` an. `defaultTune()` liefert die Defaults
  (steps/ferries = AN, Rest AUS). Schalter: `consider_forest`, `consider_noise`, `avoid_unsafe`,
  `stick_to_cycleroutes`, `consider_river`, `consider_town`, `consider_elevation` (opt-in, Default AUS),
  `consider_traffic`, `ignore_cycleroutes`, `use_proposed_cycleroutes`, `add_beeline`, sowie die
  Default-AN-Schalter `allow_steps`/`allow_ferries` (nur bei Abschaltung als `=0` gesendet);
  Regler „Steigungen meiden" → `uphillcost` (0..100). „Unbefestigt" = Gravel-Engine. Alte gespeicherte
  `tune`-Objekte werden beim Laden per `Object.assign(defaultTune(), …)` mit Defaults gemergt.
  **Scoping wie beim Profil-Dropdown:** ohne Auswahl global (Objekt `tune`), bei aktiver
  Auswahl (≥2 WP) nur auf den Abschnitt — das Tuning wird als `eng.tune` im Abschnitts-Override
  (`w.legProfile`) gespeichert und je Lauf via `fetchRoute(...,eng.tune)` gesendet; globale Läufe
  tragen `globalEng.tune=tune`. `buildRuns` gruppiert Läufe per Referenzgleichheit (`last.eng===eff`).
- **Rundweg (`generateRoundtrip`, experimentell):** key-frei. N Punkte auf einem Kreis um die
  Kartenmitte (Radius aus Wunsch-Distanz / Detour-Faktor 1,55), per BRouter durchrouten, zurück zum
  Start. „Andere Variante" erhöht `rtSeed` (Startrichtung). Ersetzt die Route (Undo möglich).
- **„Neueste Anfrage gewinnt" (`routeSeq`):** doRoute markiert jede Anfrage; veraltete async-Ergebnisse
  (brouter-Einzelpfad + `doSegmentedRoute`) werden verworfen, statt neuere zu überschreiben.
- **Abschnitts-Profile (per-Abschnitt-Routing):** Override lebt am Start-Wegpunkt eines Teilstücks
  (`w.legProfile`), nicht per Index → robust gegen Einfügen/Löschen/Undo. Auswahl via Toolbar-Modus
  „Abschnitts-Profil" *oder* Strg+Klick auf Marker; bei aktiver Auswahl (≥2 Punkte) gilt das
  Profil-Dropdown nur für den Abschnitt, global bleibt. Routing zerlegt die Route in Läufe gleicher
  effektiver Engine (`buildRuns`/`doSegmentedRoute`), routet jeden Lauf einzeln und näht die
  Geometrie zusammen (doppelter Nahtpunkt verworfen). Nur aktiv, wenn `hasOverrides()`.
- **Gesperrte Abschnitte (Lock):** `w.lock = {coords,dist,asc,an}` am Start-Wegpunkt eines Beins
  speichert dessen berechnete Geometrie **plus die Analyse-Segmente** (`an`, kompakt via
  `compactAnSegs`). Gesperrte Beine werden beim Routing NICHT neu berechnet, sondern aus dem Cache
  übernommen (`buildRuns` erzeugt `type:'lock'`-Läufe). Sperren via Wegpunkt-Auswahl + Schloss-Button
  (`lockSelection` routet jedes Bein einmal, fixiert Geometrie **und** Analyse) und **auto-speichert**
  sofort. „Alte" Locks ohne `an` werden beim Laden/Import einmalig von `backfillLockAnalysis()`
  nachgerüstet: das Bein wird nur geroutet, um die WayTags zu holen — **die fixierte Geometrie
  (`coords/dist/asc`) bleibt unangetastet**. Segmentierter Pfad aktiv bei `hasOverrides() || hasLocks()`.
  Lock-Geometrie+Analyse kann groß werden → localStorage-Limit beachten.
- **Streckenanalyse (`buildAnalysis`, eigenes Register):** aus BRouter-`messages`
  (`features[0].properties.messages`, Spalten `WayTags`/`Distance`) je Segment → drei Tabellen
  **Weg** (highway/tracktype), **Material** (surface), **Beschaffenheit** (smoothness) mit km +
  „Gesamt bekannt". Lebt in einem eigenen, **verschiebbaren + einklappbaren** Glas-Register rechts
  (`#analysisPanel`, wie Toolbar/Panel), nicht im Hauptpanel. Hover über eine Zeile hebt die passenden
  Abschnitte auf der Karte hervor (eigene Pane `hlPane`, z-index 445). Nicht abgedeckte km (GH ohne
  Tags) werden als Hinweis ausgewiesen. `fitAnalysisHeight()` begrenzt die Höhe auf die Legenden-
  Oberkante (Desktop), sonst scrollt der Inhalt.
- **Reisezeit (`#sTime`):** BRouter `total-time` (bzw. GH `time`) je Lauf summiert, prominent oben
  im Panel — ehrlich als „BRouter-Schätzung" beschriftet.

## Routing-Engines (hart erarbeitetes Wissen — bitte beachten)
- **① BRouter.de (Primär, verifiziert):** GET `https://brouter.de/brouter`, **CORS offen**.
  Profile `trekking`/`fastbike`/`shortest`. Antwort-Geometrie: `features[0].geometry.coordinates`
  als `[lon, lat, ele]`; Properties `track-length` (m), `filtered ascend` (m), `total-time` (s,
  für die Reisezeit) und `messages` (per-Segment `WayTags`/`Distance`, für die Streckenanalyse).
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
  Zoom In · Zoom Out · Standort · Suche · | · No-Go-Kreis · Bewegungsradius (ohne Gewähr) · POI ·
  | · Route zeichnen · Wegpunkt einfügen · Route umkehren · Abschnitts-Profil ·
  letzten Punkt löschen · Abschnitt sperren · Routendaten speichern · Routendaten löschen ·
  Auf Preset zurücksetzen · Steigungscodierung · letzte Aktion rückgängig · Transparenz-Slider.
  (Karten-Annotationen oben gruppiert, alle Routing-/Routendaten-Funktionen darunter.)
- Hauptpanel, Toolleiste **und** Streckenanalyse-Register: alle **frei verschiebbar und einklappbar**.
- Keine redundanten Bedienelemente doppeln (z. B. „Route leeren" lebt in der Toolleiste, nicht im Panel).
- Funktionalität bei Restyles erhalten.
- **Overpass (Camping/Versorgung):** öffentliche Server oft überlastet → 4 Spiegel mit je 20-s-
  Client-Timeout (`AbortController`); bei Fehler ehrliche Meldung („näher zoomen, gleich erneut").
- **Eine Datei = beide Instanzen:** Änderungen an `kartentisch.html` gelten für Desktop UND Mobile.
  Bei mobil- vs. desktop-spezifischen Entscheidungen erst darauf hinweisen, dann auf Nachfrage per
  Media-Query trennen.

## Validierungs-Workflow (jede Iteration)
1. Letzten inline-`<script>`-Block extrahieren (Regex, gefiltert auf eindeutige Funktion wie `addWaypoint`).
2. `node --check` auf den extrahierten JS-Code (Syntaxcheck).
3. Div-Balance prüfen: Body-Markup zwischen `</style>` und `<script` isolieren, `<div\b` vs. `</div>` zählen.
4. Erst dann ausliefern.

## Offen / als Nächstes
- **Hosting erledigt:** live via GitHub Pages (`PineSpine/Waypoint`, Branch `master`) →
  <https://pinespine.github.io/Waypoint/>. `git push` auf `master` aktualisiert automatisch.
  `gh` CLI weiterhin nicht installiert; Push läuft über Git Credential Manager (Browser-Login).
  Git-Identität ist lokaler Platzhalter (`ralon@kartentisch.local`) → Commits nicht mit dem
  GitHub-Konto verknüpft (nur kosmetisch).
- **Route vom alten Origin (file:// bzw. WLAN) auf die Pages-URL übertragen:** localStorage ist
  pro Origin → auf der Live-Seite startet der Preset. Per „Geräte-Sync" (Export/Import) rüberholen.
- Lückenschlüsse Saalfeld→Lichtenfels und Donau→Burghausen sauber routen.
- Weiteres Iterieren an der App, Richtung Tour.
