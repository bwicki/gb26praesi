# Kein Motor. Kein Steuer. Kein Plan B.

Vortragspräsentation zu den beiden Gasballonfahrten 2026 von Balthasar Wicki:
Coupe Aéronautique Gordon Bennett (Gladbeck → Loviisa, Finnland, 1555 km, Team SUI-2
mit René Erni) und Aeronautica Militare Balloon Cup (Piacenza → Bronte, Sizilien,
902 km, mit Jens Berger). Dazu die Geschichte des Gordon Bennett und die elf Schweizer
Siege. Läuft als Webseite unter **gb26praesi.wicki.aero** (GitHub Pages) und ab Ordner
ohne Server.

> **Privat.** Die Seite ist kennwortgeschützt (einfache Sperre, kein Sicherheitsmechanismus;
> das Kennwort steht in `assets/js/app.js`). Fotos, Clips und Texte sind nicht Teil der
> Lizenz – siehe LICENSE.

## Bedienung

| Taste | Wirkung |
|---|---|
| → ← / Leertaste | Folie bzw. Fragment weiter / zurück |
| **M** | Menü: Fassung wählen (10 / 20 / 30 Minuten, Anhang) |
| **S** | Sprechernotizen-Fenster (aktuelle und nächste Folie, Uhr) |
| **P** | Tracker-Animation starten / anhalten (Folien «Der Alleingang», «Piacenza → Bronte») |
| **F** | Vollbild |
| **Esc** | Folienübersicht |

Fassung auch per Adresse: `?preset=10`, `?preset=20`, `?preset=30`, `?preset=anhang`.
Ein Presenter-Clicker (Bild auf/ab) funktioniert wie die Pfeiltasten.

## Aufbau

```
index.html            alle Folien (data-preset = Fassungen, data-chapter = Kapitel)
i18n/de.json          alle Texte und Sprechernotizen (Quelle) → de.js (generiert)
data/tracks/*.json    Fahrtspuren, Minutenauflösung: t_unix, lat, lon, alt_m, sea, gs_kt (Quelle) → *.js
media/finnland|sizilien|geschichte|ui   Bilder und Clips; MEDIEN.csv nennt Nummer im Kontaktbogen und Herkunft
assets/css/theme.css  Gestaltung
assets/js/app.js      Sperre, Sprache, Presets, Karten, Animationen, reveal-Start
assets/js/version.js  Versionsnummer und Datum (Fusszeile)
assets/vendor/        reveal.js 5.2.1 (MIT), Leaflet 1.9.4 (BSD-2)
tools/sync.py         erzeugt die .js-Wrapper aus den .json-Quellen (für Betrieb ab Datei)
```

## Texte ändern

1. Auf GitHub die Datei `i18n/de.json` öffnen, Stift-Symbol (Edit) klicken.
2. Text zwischen den Anführungszeichen ändern; Schlüssel (`"s3.9.title"`) unverändert lassen.
   `.notes` sind Sprechernotizen (nur im Notizfenster, Taste S).
3. «Commit changes» – nach rund einer Minute ist die Seite aktuell (Seite neu laden).

Regeln: jeder Eintrag `"schlüssel": "text",` mit Komma am Ende, ausser beim letzten;
Anführungszeichen im Text als `\"` oder als «»; erlaubt sind `<br>` (Umbruch),
`<em>…</em>` (Hervorhebung in Amber) und `<small>…</small>`. Bei einem Tippfehler in der
Struktur fällt die Seite auf die zuletzt gültige Fassung zurück und zeigt in der Fusszeile
«de.json fehlerhaft» – dann die letzte Änderung prüfen.

Die Datei `i18n/de.js` wird von einer GitHub-Action automatisch nachgeführt (für den
Betrieb ab Datei ohne Server). Englische Fassung später: `i18n/en.json` mit gleichen
Schlüsseln.

## Offline

Repository als ZIP laden, entpacken, `index.html` öffnen. Alles läuft lokal; nur die
Kartenhintergründe (OpenStreetMap/CARTO-Kacheln) brauchen Internet – ohne Verbindung
bleiben die Spuren und Anzeigen sichtbar, der Kartenhintergrund bleibt dunkel.

## Versionierung

`assets/js/version.js` trägt die Nummer, `CHANGELOG.md` die Änderungen, jeder Vortrag
bekommt einen Git-Tag (`v1.0.0-rotary-...`). Siehe CHANGELOG.md.
