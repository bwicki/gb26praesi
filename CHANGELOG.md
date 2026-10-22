# Änderungen

Jede Vortragsfassung erhält eine Versionsnummer (assets/js/version.js), einen Git-Tag
mit derselben Nummer und einen Eintrag hier. Ältere Fassungen bleiben über den Tag
abrufbar; ein Release-ZIP dient dem Offline-Einsatz.

## 0.1.1 – 22.10.2026 – Eingangsmaske, Texte direkt aus de.json

- Eingangsmaske zeigt Titel, Hinweis und Schaltfläche wieder (Texte wurden erst nach dem
  Entsperren gesetzt); Platzhalter «Kennwort» im Eingabefeld.
- Texte werden über http(s) direkt aus `i18n/de.json` geladen: Änderungen auf GitHub sind
  ohne weiteren Schritt wirksam. Bei fehlerhaftem JSON greift `i18n/de.js`, die Fusszeile
  zeigt dann eine Warnung.
- GitHub-Action regeneriert die JS-Wrapper nach jeder Änderung an den JSON-Quellen.

## 0.1.0 – 21.10.2026 – Gerüst

- Erste lauffähige Fassung: 33 Folien gemäss Storyboard v0.1, Presets 10 / 20 / 30 / Anhang.
- Kennwortseite, Sprechernotizen (Taste S), Menü (Taste M), Fusszeile mit Version.
- Tracker-Animationen Finnland (41 h in 45 s) und Sizilien (22 h in 30 s) mit Höhenprofil
  und Anzeige von Zeit, Höhe, Fahrt und Luftlinie (Taste P).
- Schematische Karte zur Suwałki-Lücke, Zeitstrahl 1906–2026, Windschichten-Grafik,
  Doppelprofil «Tief und hoch».
- Provisorische Bilder (Auswahl aus den Kontaktbogen v1, siehe media/MEDIEN.csv);
  Platzhalter für Clips, historische Bilder, Team- und Medienfolien.
